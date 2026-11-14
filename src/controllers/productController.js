const { Product } = require('../models');
const { db } = require('../../config/database');
const crud = require('./crud');
const { bad } = require('../middleware/auth');
const PET_SHOP_CATEGORIES = ['Food', 'Grooming', 'Accessories', 'Treats', 'Health & Care', 'Toys', 'Cleaning & Hygiene', 'Pet Supplies'];

const validateName = (name, excludeId = null) => {
  const trimmed = String(name || '').trim();
  if (!trimmed) throw bad('Product item name is required');
  const existing = excludeId
    ? db.prepare('SELECT product_id, name FROM product_inventory WHERE lower(trim(name)) = lower(trim(?)) AND product_id != ?').get(trimmed, excludeId)
    : db.prepare('SELECT product_id, name FROM product_inventory WHERE lower(trim(name)) = lower(trim(?))').get(trimmed);
  if (existing) {
    throw bad(`An item named "${existing.name}" already exists. Duplicate item names cannot be input.`);
  }
};

const validate = d => {
  if (d.category !== undefined && !PET_SHOP_CATEGORIES.includes(String(d.category).trim())) {
    throw bad(`Category must be one of: ${PET_SHOP_CATEGORIES.join(', ')}`);
  }
  for (const field of ['price', 'stock_quantity', 'reorder_level']) {
    if (d[field] === undefined) continue;
    const value = Number(d[field]);
    if (!Number.isFinite(value) || value < (field === 'price' ? 0.01 : 0)) {
      throw bad(field === 'price' ? 'Price must be greater than zero' : `${field.replace(/_/g, ' ')} cannot be negative`);
    }
    if (field !== 'price' && !Number.isInteger(value)) throw bad(`${field.replace(/_/g, ' ')} must be a whole number`);
  }
};

const base = crud(Product);
module.exports = {
  list: base.list,
  create(q, s) {
    validateName(q.body.name);
    validate(q.body);
    base.create(q, s);
  },
  update(q, s) {
    if (q.body.name !== undefined) validateName(q.body.name, q.params.id);
    validate(q.body);
    base.update(q, s);
  },
  remove: base.remove
};
