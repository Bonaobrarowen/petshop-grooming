const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { db } = require('../../config/database');
const { bad } = require('../middleware/auth');

const roles = ['Staff', 'Administrator'];
const statuses = ['Active', 'Inactive'];
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function emailFor(value, excludeId) {
  const email = String(value || '').trim().toLowerCase();
  if (!email || email.length > 254 || !emailPattern.test(email)) throw bad('Enter a valid recovery email');
  const existing = excludeId
    ? db.prepare('SELECT user_id FROM user_account WHERE lower(trim(email))=? AND user_id!=?').get(email, excludeId)
    : db.prepare('SELECT user_id FROM user_account WHERE lower(trim(email))=?').get(email);
  if (existing) throw bad('This email is already assigned to another staff or administrator account');
  return email;
}

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
      email: emailFor(body.email),
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
    if (body.email !== undefined) updates.email = emailFor(body.email, q.params.id);
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
    if (!User.get(q.params.id)) throw bad('User not found', 404);
    User.remove(q.params.id);
    s.json({ ok: true });
  }
};
