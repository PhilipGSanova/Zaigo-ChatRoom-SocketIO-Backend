const express = require("express");
const multer = require("multer");
const Message = require("../models/Message");
const path = require("path");

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Save files inside backend/src/uploads
    cb(null, path.join(__dirname, "..", "uploads"));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix =
      Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

router.post("/image", upload.single("attachment"), async (req, res) => {
  try {
    const { roomId, senderId, text } = req.body;
    const file = req.file;

    // ❗ Allow EITHER text OR file
    if (!file && !text) {
      return res.status(400).json({
        error: "Either text or attachment is required",
      });
    }

    const attachment = file
      ? [
          {
            url: `/uploads/${file.filename}`,
            filename: file.originalname,
            mime: file.mimetype,
          },
        ]
      : [];

    const message = new Message({
      room: roomId,
      sender: senderId,
      text: text || null, // ✔ Only add text if provided
      attachments: attachment, // ✔ Add attachment only if file exists
    });

    await message.save();

    res.status(201).json(message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
