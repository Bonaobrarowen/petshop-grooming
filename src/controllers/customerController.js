const { Customer } = require('../models');
const { db } = require('../../config/database');
const { bad } = require('../middleware/auth');
const crud = require('./crud');
const base = crud(Customer);
const prepare = d => {
  const result = { ...d };
  if (result.customer_identity) {
    result.customer_identity = String(result.customer_identity).trim().toUpperCase();
  } else {
    const next = db.prepare('SELECT COALESCE(MAX(customer_id), 0) + 1 AS id FROM customer').get().id;
    result.customer_identity = `CUST-${String(next).padStart(4, '0')}`;
  }
  if (!result.customer_identity) throw bad('Customer ID is required');
  if (!String(result.customer_identity).startsWith('CUST-')) result.customer_identity = `CUST-${result.customer_identity}`;
  return result;
};
module.exports = {
  list: base.list,
  create(q, s) { base.create({ ...q, body: prepare(q.body) }, s); },
  update(q, s) { base.update({ ...q, body: prepare(q.body) }, s); },
  remove(q, s) {
    const customer = Customer.get(q.params.id);
    if (!customer) throw bad('Customer not found', 404);
    db.transaction(() => {
      db.prepare('UPDATE sales SET customer_id=NULL WHERE customer_id=?').run(q.params.id);
      db.prepare("UPDATE user_account SET customer_id=NULL, status='Inactive' WHERE customer_id=?").run(q.params.id);
      Customer.remove(q.params.id);
    })();
    s.json({ ok: true });
  }
};
