const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET || 'changeme';

module.exports = function (req, res, next) {
  // Check cookie first
  const token = req.cookies?.token || req.header('Authorization')?.replace('Bearer ', '') || req.query?.token;
  if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('JWT error', err.message);
    return res.status(401).json({ message: 'Token is not valid' });
  }
};