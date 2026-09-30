const express = require('express');
const db = require('../utils/db');
const { requireRole } = require('../middleware/auth');
const { asString, isEmail } = require('../utils/validate');

const router = express.Router();

router.post('/', (req, res) => {
  const email = asString(req.body && req.body.email, 120).toLowerCase();
  if (!isEmail(email)) return res.status(400).json({ error: 'Enter a valid email address.' });

  const list = db.read('newsletter');
  if (list.some((item) => item.email === email)) {
    return res.json({ ok: true, alreadySubscribed: true });
  }
  list.push({
    id: db.nextId('newsletter'),
    email,
    status: 'active',
    subscribedAt: new Date().toISOString()
  });
  db.write('newsletter', list);
  return res.status(201).json({ ok: true, alreadySubscribed: false });
});

router.get('/', requireRole('admin'), (req, res) => {
  const list = db.read('newsletter').map((item) => ({
    id: item.id,
    status: item.status,
    subscribedAt: item.subscribedAt
  }));
  res.json({ count: list.length, subscribers: list });
});

module.exports = router;
