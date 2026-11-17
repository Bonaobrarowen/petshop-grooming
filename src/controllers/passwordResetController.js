const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { db } = require('../../config/database');
const app = require('../../config/app_config');
const { bad } = require('../middleware/auth');
const email = require('../services/email');

const OTP_LIFETIME = 10 * 60 * 1000;
const RESEND_DELAY = 60 * 1000;
const MAX_ATTEMPTS = 5;
const genericMessage = 'If an active account with a recovery email exists, a verification code has been sent.';

function otpHash(userId, code) {
  return crypto.createHmac('sha256', process.env.OTP_SECRET).update(`${userId}:${code}`).digest('hex');
}

exports.request = async (q, s, next) => {
  try {
    email.assertConfigured();
    const username = String(q.body?.username || '').trim();
    const user = username && db.prepare(`
      SELECT u.user_id, u.username, u.role, u.email AS account_email, c.email AS customer_email
      FROM user_account u
      LEFT JOIN customer c ON c.customer_id=u.customer_id
      WHERE lower(u.username)=lower(?) AND u.status='Active'
    `).get(username);
    const destination = user
      ? String(user.account_email || user.customer_email || '').trim()
      : '';
    if (!user || !destination) return s.json({ message: genericMessage });

    const now = Date.now();
    const previous = db.prepare('SELECT last_sent_at FROM password_reset_otp WHERE user_id=?').get(user.user_id);
    if (previous && now - previous.last_sent_at < RESEND_DELAY) return s.json({ message: genericMessage });

    const code = String(crypto.randomInt(100000, 1000000));
    const hash = otpHash(user.user_id, code);
    db.prepare(`
      INSERT INTO password_reset_otp(user_id,otp_hash,expires_at,attempts,last_sent_at)
      VALUES (?,?,?,0,?)
      ON CONFLICT(user_id) DO UPDATE SET otp_hash=excluded.otp_hash,
        expires_at=excluded.expires_at, attempts=0, last_sent_at=excluded.last_sent_at
    `).run(user.user_id, hash, now + OTP_LIFETIME, now);
    try {
      await email.sendPasswordResetCode(destination, code);
    } catch (error) {
      db.prepare('DELETE FROM password_reset_otp WHERE user_id=? AND otp_hash=?').run(user.user_id, hash);
      app.log(`Password reset email delivery failed for user ${user.user_id}`, 'error.log');
      throw bad('Unable to send the verification email right now. Try again later.', 503);
    }
    s.json({ message: genericMessage });
  } catch (error) {
    next(error);
  }
};

exports.reset = (q, s) => {
  email.assertConfigured();
  const username = String(q.body?.username || '').trim();
  const code = String(q.body?.code || '').trim();
  const password = String(q.body?.password || '');
  if (password.length < 8) throw bad('Password must be at least 8 characters');
  if (!/^\d{6}$/.test(code)) throw bad('Enter the 6-digit verification code');
  const user = db.prepare(`
    SELECT user_id FROM user_account
    WHERE lower(username)=lower(?) AND status='Active'
  `).get(username);
  if (!user) throw bad('Invalid or expired verification code');

  const record = db.prepare('SELECT * FROM password_reset_otp WHERE user_id=?').get(user.user_id);
  if (!record || record.expires_at <= Date.now() || record.attempts >= MAX_ATTEMPTS) {
    if (record && record.expires_at <= Date.now()) {
      db.prepare('DELETE FROM password_reset_otp WHERE user_id=?').run(user.user_id);
    }
    throw bad('Invalid or expired verification code');
  }
  const expected = Buffer.from(record.otp_hash, 'hex');
  const submitted = Buffer.from(otpHash(user.user_id, code), 'hex');
  if (expected.length !== submitted.length || !crypto.timingSafeEqual(expected, submitted)) {
    db.prepare('UPDATE password_reset_otp SET attempts=attempts+1 WHERE user_id=?').run(user.user_id);
    throw bad('Invalid or expired verification code');
  }

  db.transaction(() => {
    db.prepare('UPDATE user_account SET password_hash=? WHERE user_id=?')
      .run(bcrypt.hashSync(password, 10), user.user_id);
    db.prepare('DELETE FROM password_reset_otp WHERE user_id=?').run(user.user_id);
  })();
  s.json({ message: 'Password updated. You can now sign in.' });
};
