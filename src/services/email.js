const nodemailer = require('nodemailer');
const { bad } = require('../middleware/auth');

function settings() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;
  const otpSecret = process.env.OTP_SECRET;
  const port = Number(process.env.SMTP_PORT || 587);
  if (!host || !user || !pass || !from || !otpSecret || otpSecret.length < 32 ||
      !Number.isInteger(port) || port < 1 || port > 65535) {
    throw bad('Password reset email is not configured. Contact the administrator.', 503);
  }
  return {
    host,
    port,
    secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true',
    auth: { user, pass },
    from
  };
}

exports.assertConfigured = () => settings();
exports.sendPasswordResetCode = async (email, code) => {
  const config = settings();
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000
  });
  await transporter.sendMail({
    from: config.from,
    to: email,
    subject: 'Your Pet Shop Grooming password reset code',
    text: `Your password reset code is ${code}. It expires in 10 minutes. If you did not request this, you can ignore this email.`,
    html: `<p>Your password reset code is <strong>${code}</strong>.</p><p>It expires in 10 minutes. If you did not request this, you can ignore this email.</p>`
  });
};
