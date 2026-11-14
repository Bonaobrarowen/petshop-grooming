const { Pet } = require('../models');
const { db } = require('../../config/database');
const crud = require('./crud');
const base = crud(Pet);

const generatePetCode = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const used = new Set(db.prepare('SELECT pet_code FROM pet WHERE pet_code IS NOT NULL').all().map(p => p.pet_code));
  let code;
  do {
    code = `P${Array.from({ length: 4 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('')}`;
  } while (used.has(code));
  return code;
};

module.exports = {
  list: base.list,
  create(q, s) {
    const data = { ...q.body };
    if (!data.pet_code) data.pet_code = generatePetCode();
    base.create({ ...q, body: data }, s);
  },
  update(q, s) { base.update(q, s); },
  remove: base.remove
};
