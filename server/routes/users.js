const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../utils/db');
const { auth, signToken } = require('../middleware/auth');
const { asString, sanitizePlain } = require('../utils/validate');

const router = express.Router();

router.get('/me', auth, (req, res) => {
  const user = db.read('users').find((item) => item.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'Account not found.' });
  return res.json({ user: db.publicUser(user) });
});

router.patch('/me', auth, (req, res) => {
  const users = db.read('users');
  const index = users.findIndex((item) => item.id === req.user.id);
  if (index === -1) return res.status(404).json({ error: 'Account not found.' });

  const name = sanitizePlain(req.body && req.body.name, 80);
  const bio = sanitizePlain(req.body && req.body.bio, 280);
  const currentPassword = asString(req.body && req.body.currentPassword, 128);
  const nextPassword = asString(req.body && req.body.newPassword, 128);

  if (name && name.length < 2) {
    return res.status(400).json({ error: 'Name must be at least 2 characters.' });
  }
  if (name) users[index].name = name;
  if (typeof req.body.bio === 'string') users[index].bio = bio;

  if (nextPassword) {
    if (nextPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters.' });
    }
    if (!bcrypt.compareSync(currentPassword, users[index].passwordHash)) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }
    users[index].passwordHash = bcrypt.hashSync(nextPassword, 10);
  }

  db.write('users', users);
  const user = users[index];
  return res.json({ user: db.publicUser(user), token: signToken(user) });
});

module.exports = router;
