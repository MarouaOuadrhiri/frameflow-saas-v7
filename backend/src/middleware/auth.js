const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'lh4fcvytpChdk31YVBJeRJW8UhYU6o6JSJfXWn713n2dlFhb';

// Verifies the Bearer JWT and exposes the demo-user-safe identity as
// req.user = { id, name, email }. Rejects with 401 when missing/invalid.
const auth = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;

  if (!token) {
    return res.status(401).json({ error: { message: 'Authentication required' } });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.id, name: payload.name, email: payload.email };
    return next();
  } catch (_e) {
    return res.status(401).json({ error: { message: 'Invalid or expired token' } });
  }
};

module.exports = auth;
