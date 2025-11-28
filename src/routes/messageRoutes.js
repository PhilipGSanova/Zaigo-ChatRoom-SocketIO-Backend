const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const auth = require("../middleware/auth");

router.get("/:roomId", auth, async (req, res) => {
  try {
    const messages = await Message.find({ room: req.params.roomId })
      .populate("sender", "username fullName")
      .sort({ createdAt: 1 });

    res.json({ messages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post('/:roomId', auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Message text is required' });

    const message = await Message.create({
      room: req.params.roomId,
      sender: req.user.id,
      text
    });

    res.status(201).json(message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;
