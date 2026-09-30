const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'vistora_super_secret_key_123';

const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token, authorization denied' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token is not valid' });
  }
};

const adminAuth = (req, res, next) => {
  auth(req, res, () => {
    if (req.user.role !== 'admin' && req.user.role !== 'author') {
      return res.status(403).json({ error: 'Require admin/author privileges' });
    }
    next();
  });
};

module.exports = { auth, adminAuth, JWT_SECRET };
