const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const jwtSecret = process.env.JWT_SECRET || 'changeme';
const jwtExpires = process.env.JWT_EXPIRES_IN || '7d';

// helper to sign token
function signToken(user) {
  return jwt.sign({ id: user._id, username: user.username }, jwtSecret, { expiresIn: jwtExpires });
}

exports.register = async (req, res) => {
  try {
    const { fullName, username, email, password } = req.body;
    if (!fullName || !username || !email || !password) return res.status(400).json({ message: 'Missing fields' });

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) return res.status(409).json({ message: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const user = await User.create({ fullName, username, email, password: hashed });

    const token = signToken(user);

    // set httpOnly cookie
    res.cookie('token', token, { httpOnly: true, secure: false, maxAge: 1000 * 60 * 60 * 24 * 7 });

    return res.status(201).json({ user: { id: user._id, username: user.username, email: user.email, fullName: user.fullName }, token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    return res.json({ user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier = email or username
    if (!identifier || !password) return res.status(400).json({ message: 'Missing fields' });

    const user = await User.findOne({ $or: [{ email: identifier }, { username: identifier }] });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = signToken(user);
    res.cookie('token', token, { httpOnly: true, secure: false, maxAge: 1000 * 60 * 60 * 24 * 7 });

    return res.json({ user: { id: user._id, username: user.username, email: user.email, fullName: user.fullName }, token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.logout = async (req, res) => {
    try {
    res.clearCookie('token');
    return res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};