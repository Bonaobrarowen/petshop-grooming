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
    if (!id) throw bad('Invalid appointment ID');
    const appt = db.prepare(`
      SELECT a.*, p.name AS pet_name, c.full_name AS customer_name
      FROM grooming_appointment a
      JOIN pet p ON p.pet_id=a.pet_id
      JOIN customer c ON c.customer_id=p.customer_id
      WHERE a.appointment_id=?
    `).get(id);
    if (!appt) throw bad('Appointment not found', 404);

    db.prepare("UPDATE grooming_appointment SET status='Scheduled' WHERE appointment_id=?").run(id);
    app.log(`Appointment #${id} for ${appt.pet_name} (${appt.customer_name}) registered into schedule by ${q.user?.name || 'Staff'}`);
    s.json({
      ok: true,
      appointment_id: id,
      message: `Appointment #${id} for ${appt.pet_name} (${appt.customer_name}) successfully registered in grooming schedule.`
    });
  },
  remove: base.remove
};
