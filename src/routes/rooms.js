const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const User = require('../models/User');
const Message = require('../models/Message');
const authMiddleware = require('../middleware/auth'); // assumes JWT auth

// Get all rooms user is part of
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const rooms = await Room.find({ members: userId }).sort({ createdAt: 1 }).lean();
    res.json(rooms);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new group room
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, members } = req.body;
    if (!name || !members || !Array.isArray(members)) {
      return res.status(400).json({ message: 'Invalid data' });
    }

    const room = await Room.create({
      name,
      members: [...members, req.user.id], // include creator
      isPrivate: false
    });

    res.status(201).json(room);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get or create a 1:1 private chat (Direct Message)
router.post('/direct/:friendId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const friendId = req.params.friendId;

    // Check if a private room exists
    let room = await Room.findOne({
      isPrivate: true,
      members: { $all: [userId, friendId] },
      $expr: { $eq: [{ $size: "$members" }, 2] } // exactly 2 members
    });

    // If not, create it
    if (!room) {
      room = await Room.create({
        isPrivate: true,
        members: [userId, friendId]
      });
    }

    res.json(room);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
