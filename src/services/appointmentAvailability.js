const { db } = require('../../config/database');
const { bad } = require('../middleware/auth');

const DAILY_CAPACITY = 3;
const MINIMUM_NOTICE_HOURS = 4;
const MANILA_OFFSET = '+08:00';

function parseLocalDateTime(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;

  const [, yearText, monthText, dayText, hourText, minuteText] = match;
  const year = Number(yearText), month = Number(monthText), day = Number(dayText);
  const hour = Number(hourText), minute = Number(minuteText);
  const components = new Date(Date.UTC(year, month - 1, day, hour, minute));
  if (components.getUTCFullYear() !== year || components.getUTCMonth() !== month - 1 ||
      components.getUTCDate() !== day || components.getUTCHours() !== hour ||
      components.getUTCMinutes() !== minute) return null;

  return {
    date: value.slice(0, 10),
    hour,
    timestamp: new Date(`${value}:00${MANILA_OFFSET}`).getTime()
  };
}

function validateAppointmentTime(value, now = Date.now()) {
  const appointment = parseLocalDateTime(value);
  if (!appointment) throw bad('Choose a valid appointment date and time');
  if (appointment.timestamp < now + MINIMUM_NOTICE_HOURS * 60 * 60 * 1000) {
    throw bad('Appointments must be booked at least 4 hours in advance');
  }
  if (appointment.hour >= 1 && appointment.hour < 8) {
    throw bad('Appointments are available from 8:00 AM until 1:00 AM');
  }
  return appointment;
}

function getDailyAvailability(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !parseLocalDateTime(`${date}T00:00`)) {
    throw bad('Choose a valid appointment date');
  }

  const booked = db.prepare(
    'SELECT COUNT(*) AS count FROM grooming_appointment WHERE substr(appointment_date, 1, 10)=?'
  ).get(date).count;

  return {
    date,
    capacity: DAILY_CAPACITY,
    booked,
    remaining: Math.max(0, DAILY_CAPACITY - booked),
    available: booked < DAILY_CAPACITY
  };
}

module.exports = { getDailyAvailability, validateAppointmentTime };
