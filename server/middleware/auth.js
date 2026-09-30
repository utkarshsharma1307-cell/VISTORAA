const jwt = require('jsonwebtoken');

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('JWT_SECRET is missing or too short. Set it in .env.');
  }
  return secret;
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    getSecret(),
    { expiresIn: process.env.JWT_EXPIRES || '7d' }
  );
}

function auth(req, res, next) {
  const header = req.header('Authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  try {
    req.user = jwt.verify(token, getSecret());
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Token is not valid.' });
  }
}

function optionalAuth(req, res, next) {
  const header = req.header('Authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) return next();
  try {
    req.user = jwt.verify(token, getSecret());
  } catch (err) {
    req.user = null;
  }
  return next();
}

function requireRole() {
  const roles = Array.prototype.slice.call(arguments);
  return function roleGuard(req, res, next) {
    auth(req, res, function afterAuth() {
      if (res.headersSent) return;
      if (!req.user || roles.indexOf(req.user.role) === -1) {
        return res.status(403).json({ error: 'You do not have permission for this action.' });
      }
      return next();
    });
  };
}

module.exports = { auth, optionalAuth, requireRole, signToken, getSecret };
