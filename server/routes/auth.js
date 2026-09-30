const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../utils/db');
const { signToken, auth } = require('../middleware/auth');
const { asString, isEmail, sanitizePlain } = require('../utils/validate');

const router = express.Router();

router.post('/register', (req, res) => {
  const name = sanitizePlain(req.body && req.body.name, 80);
  const email = asString(req.body && req.body.email, 120).toLowerCase();
  const password = asString(req.body && req.body.password, 128);
  const bio = sanitizePlain(req.body && req.body.bio, 280);

  if (name.length < 2) return res.status(400).json({ error: 'Name must be at least 2 characters.' });
  if (!isEmail(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });

  const users = db.read('users');
  if (users.some((user) => user.email === email)) {
    return res.status(409).json({ error: 'An account with that email already exists.' });
  }

  const user = {
    id: db.nextId('users'),
    name,
    email,
    passwordHash: bcrypt.hashSync(password, 10),
    role: 'reader',
    bio,
    createdAt: new Date().toISOString()
  };
  users.push(user);
  db.write('users', users);

  return res.status(201).json({
    token: signToken(user),
    user: db.publicUser(user)
  });
});

router.post('/login', (req, res) => {
  const email = asString(req.body && req.body.email, 120).toLowerCase();
  const password = asString(req.body && req.body.password, 128);
  if (!isEmail(email) || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = db.read('users').find((item) => item.email === email);
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Email or password is incorrect.' });
  }

  return res.json({
    token: signToken(user),
    user: db.publicUser(user)
  });
});

router.get('/me', auth, (req, res) => {
  const user = db.read('users').find((item) => item.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'Account not found.' });
  return res.json({ user: db.publicUser(user) });
});

module.exports = router;