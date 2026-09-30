const express = require('express');
const db = require('../utils/db');
const { requireRole } = require('../middleware/auth');
const { asString, isEmail, sanitizePlain } = require('../utils/validate');

const router = express.Router();

router.post('/', (req, res) => {
  const name = sanitizePlain(req.body && req.body.name, 80);
  const email = asString(req.body && req.body.email, 120).toLowerCase();
  const subject = sanitizePlain(req.body && req.body.subject, 120);
  const message = sanitizePlain(req.body && req.body.message, 2000);

  if (name.length < 2) return res.status(400).json({ error: 'Please tell us your name.' });
  if (!isEmail(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
  if (message.length < 10) return res.status(400).json({ error: 'Message should be at least 10 characters.' });

  const contacts = db.read('contacts');
  contacts.push({
    id: db.nextId('contacts'),
    name,
    email,
    subject: subject || 'Editorial note',
    message,
    createdAt: new Date().toISOString()
  });
  db.write('contacts', contacts);
  res.status(201).json({ ok: true });
});

router.get('/', requireRole('admin'), (req, res) => {
  res.json({ contacts: db.read('contacts') });
});

module.exports = router;
