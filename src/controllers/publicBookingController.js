const jwt = require('jsonwebtoken');
const { db } = require('../../config/database');
const { bad } = require('../middleware/auth');
const app = require('../../config/app_config');
const cfg = require('../../config/auth');

const prices = {
  'Full Grooming Package': 850,
  'Basic Shower & Blow Dry': 450,
  'Nail Trimming & Filing': 150,
  'Ear Cleaning & Plucking': 150,
  'Anti-Flea & Tick Treatment': 350,
  'De-Shedding & De-Matting': 300,
  'Teeth Brushing & Breath Care': 120,
  'Puppy / Kitten First Bath': 300
};

exports.create = (q, s) => {
  const fullName = String(q.body.full_name || '').trim();
  const phone = String(q.body.phone || '').trim();
  const petName = String(q.body.pet_name || '').trim();
  const breed = String(q.body.breed || '').trim();
  const age = Number(q.body.age);
  const service = String(q.body.service || '').trim();
  const rawDate = String(q.body.appointment_date || '').trim();
  const appointmentDate = new Date(rawDate);

  if (!fullName || !phone || !petName || !service) throw bad('Complete all required fields');
  if (!/^09\d{9}$/.test(phone)) throw bad('Enter a valid 11-digit Philippine mobile number');
  if (!prices[service]) throw bad('Select a valid grooming service');
  if (!Number.isFinite(age) || age < 0) throw bad('Enter a valid dog age');
  if (!rawDate || Number.isNaN(appointmentDate.getTime()) || appointmentDate.getTime() <= Date.now()) {
    throw bad('Appointment date and time cannot be in the past');
  }

  // Format local date representation YYYY-MM-DD HH:mm without UTC skew
  const formattedDate = rawDate.replace('T', ' ').slice(0, 16);

  // Check auth user if available or passed via token
  let userId = q.user?.id;
  if (!userId && q.headers.authorization) {
    try {
      const decoded = jwt.verify(q.headers.authorization.replace('Bearer ', ''), cfg.secret);
      if (decoded?.id) userId = decoded.id;
    } catch {}
  }

  const booking = db.transaction(() => {
    let customer = null;
    if (userId) {
      const userAcc = db.prepare('SELECT customer_id FROM user_account WHERE user_id=?').get(userId);
      if (userAcc?.customer_id) {
        customer = db.prepare('SELECT * FROM customer WHERE customer_id=?').get(userAcc.customer_id);
      }
    }

    if (!customer) {
      customer = db.prepare(
        'SELECT * FROM customer WHERE lower(full_name)=lower(?) AND phone=? LIMIT 1'
      ).get(fullName, phone);
    }

    if (!customer) {
      const next = db.prepare('SELECT COALESCE(MAX(customer_id), 0) + 1 AS id FROM customer').get().id;
      const result = db.prepare(
        'INSERT INTO customer(customer_identity, full_name, phone, email, address) VALUES (?, ?, ?, ?, ?)'
      ).run(`CUST-${String(next).padStart(4, '0')}`, fullName, phone,
        String(q.body.email || '').trim(), String(q.body.address || '').trim());
      customer = db.prepare('SELECT * FROM customer WHERE customer_id=?').get(result.lastInsertRowid);
    } else {
      db.prepare(`
        UPDATE customer SET
          full_name=COALESCE(NULLIF(?, ''), full_name),
          phone=COALESCE(NULLIF(?, ''), phone),
          email=COALESCE(NULLIF(?, ''), email),
          address=COALESCE(NULLIF(?, ''), address)
        WHERE customer_id=?
      `).run(fullName, phone, String(q.body.email || '').trim(), String(q.body.address || '').trim(), customer.customer_id);
    }

    if (userId) {
      db.prepare('UPDATE user_account SET customer_id=? WHERE user_id=?').run(customer.customer_id, userId);
    }

    let pet = db.prepare(
      'SELECT * FROM pet WHERE customer_id=? AND lower(name)=lower(?) LIMIT 1'
    ).get(customer.customer_id, petName);

    if (!pet) {
      const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      const used = new Set(db.prepare('SELECT pet_code FROM pet WHERE pet_code IS NOT NULL').all().map(p => p.pet_code));
      let code;
      do {
        code = `P${Array.from({ length: 4 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('')}`;
      } while (used.has(code));

      const result = db.prepare(
        'INSERT INTO pet(customer_id, pet_code, name, species, breed, age) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(customer.customer_id, code, petName, 'Dog', breed, age);
      pet = db.prepare('SELECT * FROM pet WHERE pet_id=?').get(result.lastInsertRowid);
    }

    const result = db.prepare(
      `INSERT INTO grooming_appointment(pet_id, service, appointment_date, price, status)
       VALUES (?, ?, ?, ?, 'Pending')`
    ).run(pet.pet_id, service, formattedDate, prices[service]);

    const apptId = result.lastInsertRowid;
    app.log(`Appointment request #${apptId} (${pet.name} - ${service}) submitted for ${customer.full_name}`);

    return { appointment_id: apptId, customer_id: customer.customer_id, pet_id: pet.pet_id };
  });

  const res = booking();
  s.status(201).json({
    ...res,
    message: 'Appointment request submitted. Waiting for staff to register your schedule in the system.'
  });
};
