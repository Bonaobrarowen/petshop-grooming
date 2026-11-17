const { Appointment } = require('../models');
const { db } = require('../../config/database');
const app = require('../../config/app_config');
const { bad } = require('../middleware/auth');
const crud = require('./crud');

const validateDate = d => {
  if (d.price !== undefined && (Number(d.price) < 120 || !Number.isFinite(Number(d.price)))) {
    throw bad('Grooming price must be at least PHP 120');
  }
  if (!d.appointment_date) return;
  const appointment = new Date(d.appointment_date);
  if (Number.isNaN(appointment.getTime())) throw bad('Enter a valid appointment date and time');
  if (appointment.getTime() < Date.now()) throw bad('Appointment date and time cannot be in the past');
};

const base = crud(Appointment);

module.exports = {
  list: base.list,
  create(q, s) {
    validateDate(q.body);
    base.create(q, s);
  },
  update(q, s) {
    validateDate(q.body);
    base.update(q, s);
  },
  register(q, s) {
    const id = Number(q.params.id);
    if (!Number.isInteger(id) || id < 1) throw bad('Invalid appointment ID');
    const appt = db.prepare(`
      SELECT a.*, p.name AS pet_name, c.full_name AS customer_name
      FROM grooming_appointment a
      JOIN pet p ON p.pet_id=a.pet_id
      JOIN customer c ON c.customer_id=p.customer_id
      WHERE a.appointment_id=?
    `).get(id);
    if (!appt) throw bad('Appointment not found', 404);
    if (appt.status !== 'Pending') throw bad('Only pending appointment requests can be registered');

    db.prepare("UPDATE grooming_appointment SET status='Scheduled' WHERE appointment_id=?").run(id);
    app.log(`Appointment #${id} for ${appt.pet_name} (${appt.customer_name}) registered into schedule by ${q.user?.name || 'Staff'}`);
    s.json({
      ok: true,
      appointment_id: id,
      message: `Appointment #${id} for ${appt.pet_name} (${appt.customer_name}) successfully registered in grooming schedule.`
    });
  },
  complete(q, s) {
    const id = Number(q.params.id);
    if (!Number.isInteger(id) || id < 1) throw bad('Invalid appointment ID');
    const result = db.transaction(() => {
      const appt = db.prepare(`
        SELECT a.status, a.pet_id, p.name AS pet_name, c.full_name AS customer_name, c.phone AS customer_phone
        FROM grooming_appointment a
        JOIN pet p ON p.pet_id=a.pet_id
        JOIN customer c ON c.customer_id=p.customer_id
        WHERE a.appointment_id=?
      `).get(id);
      if (!appt) throw bad('Appointment not found', 404);
      if (appt.status !== 'Scheduled' && appt.status !== 'Done') {
        throw bad('Only scheduled appointments can be marked done');
      }

      let pickup = db.prepare('SELECT pickup_id FROM authorized_pet_pickup WHERE appointment_id=?').get(id);
      let pickupCreated = false;
      if (!pickup) {
        const pickupId = db.prepare(`
          INSERT INTO authorized_pet_pickup
            (appointment_id,pet_id,person_name,relationship,contact,id_presented,authorization_status)
          VALUES (?,?,?,'Owner',?,0,'Pending')
        `).run(id, appt.pet_id, appt.customer_name, appt.customer_phone).lastInsertRowid;
        pickup = { pickup_id: pickupId };
        pickupCreated = true;
      }
      if (appt.status !== 'Done') {
        db.prepare("UPDATE grooming_appointment SET status='Done' WHERE appointment_id=?").run(id);
      }
      return { pickup_id: pickup.pickup_id, pet_name: appt.pet_name, customer_name: appt.customer_name, was_done: appt.status === 'Done', pickup_created: pickupCreated };
    })();

    if (!result.was_done || result.pickup_created) {
      app.log(`Appointment #${id} for ${result.pet_name} marked done by ${q.user?.name || 'Staff'}; pickup #${result.pickup_id} created for ${result.customer_name}`);
    }
    s.json({
      ok: true,
      appointment_id: id,
      pickup_id: result.pickup_id,
      message: `${result.pet_name} is ready for pickup verification.`
    });
  },
  remove: base.remove
};
