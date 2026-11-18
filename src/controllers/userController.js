const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { db } = require('../../config/database');
const { bad } = require('../middleware/auth');

const roles = ['Staff', 'Administrator'];
const statuses = ['Active', 'Inactive'];

function usernameFor(value, excludeId) {
  const username = String(value || '').trim();
  if (username.length < 3) throw bad('Username must be at least 3 characters');
  const existing = excludeId
    ? db.prepare('SELECT user_id FROM user_account WHERE lower(username)=lower(?) AND user_id!=?').get(username, excludeId)
    : db.prepare('SELECT user_id FROM user_account WHERE lower(username)=lower(?)').get(username);
  if (existing) throw bad('Username is already taken');
  return username;
}

module.exports = {
  list: (q, s) => s.json(User.all()),
  create(q, s) {
    const body = q.body || {};
    const username = usernameFor(body.username);
    const fullName = String(body.full_name || '').trim();
    const password = String(body.password || '');
    if (!fullName) throw bad('Full name is required');
    if (password.length < 8) throw bad('Password must be at least 8 characters');
    if (!roles.includes(body.role)) throw bad('Role must be Staff or Administrator');
    if (!statuses.includes(body.status)) throw bad('Select a valid account status');
    const id = User.create({
      username,
      password_hash: bcrypt.hashSync(password, 10),
      full_name: fullName,
      role: body.role,
      status: body.status
    });
    s.status(201).json(User.get(id));
  },
  update(q, s) {
    const existing = User.get(q.params.id);
    if (!existing) throw bad('User not found', 404);
    const body = q.body || {};
    const updates = {};
    if (body.username !== undefined) updates.username = usernameFor(body.username, q.params.id);
    if (body.full_name !== undefined) {
      updates.full_name = String(body.full_name).trim();
      if (!updates.full_name) throw bad('Full name is required');
    }
    if (body.role !== undefined) {
      if (!roles.includes(body.role)) throw bad('Role must be Staff or Administrator');
      updates.role = body.role;
    }
    if (body.status !== undefined) {
      if (!statuses.includes(body.status)) throw bad('Select a valid account status');
      updates.status = body.status;
    }
    if (body.password !== undefined) {
      const password = String(body.password);
      if (password.length < 8) throw bad('Password must be at least 8 characters');
      updates.password_hash = bcrypt.hashSync(password, 10);
    }
    User.update(q.params.id, updates);
    s.json(User.get(q.params.id));
  },
  remove(q, s) {
    const user = User.get(q.params.id);
    if (!user) throw bad('User not found', 404);
    if (Number(q.params.id) === Number(q.user.id)) throw bad('You cannot delete your own account');
    if (user.role === 'Administrator' && user.status === 'Active') {
      const activeAdmins = db.prepare(
        "SELECT COUNT(*) AS count FROM user_account WHERE role='Administrator' AND status='Active'"
      ).get().count;
      if (activeAdmins <= 1) throw bad('Cannot delete the last active administrator');
    }

    const hasHistory = db.prepare(`
      SELECT
        EXISTS(SELECT 1 FROM sales WHERE user_id=?) OR
        EXISTS(SELECT 1 FROM authorized_pet_pickup WHERE verified_by=?) AS has_history
    `).get(q.params.id, q.params.id).has_history;
    if (hasHistory) {
      db.prepare("UPDATE user_account SET status='Inactive' WHERE user_id=?").run(q.params.id);
      return s.json({
        ok: true,
        deactivated: true,
        message: 'This account has historical records, so it was deactivated to preserve audit history.'
      });
    }

    User.remove(q.params.id);
    s.json({ ok: true });
  }
};
