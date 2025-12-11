const express = require("express");
const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");
const Message = require("../models/Message");
const { getIO } = require("../../socket"); // <-- IMPORTANT

const router = express.Router();

const upload = multer(); // memoryStorage

router.post("/image", upload.single("attachment"), async (req, res) => {
  try {
    const io = getIO(); // get socket instance

    const { roomId, senderId, text } = req.body;
    const file = req.file;

    if (!roomId || !senderId) {
      return res.status(400).json({ error: "roomId and senderId are required" });
    }

    if (!file && !text) {
      return res.status(400).json({ error: "Either text or image is required" });
    }

    let attachments = [];

    // --- Upload image to Cloudinary ---
    if (file) {
      const cloudUpload = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "chatroom_uploads",
            resource_type: "image",
          },
          (err, result) => {
            if (err) reject(err);
            else resolve(result);
          }
        );
        streamifier.createReadStream(file.buffer).pipe(stream);
      });

      attachments.push({
        url: cloudUpload.secure_url,
        filename: cloudUpload.original_filename,
        mime: file.mimetype,
      });
    }

    // --- Create Message ---
    const message = await Message.create({
      room: roomId,
      sender: senderId,
      text: text || null,
      attachments,
      createdAt: new Date(),
    });

    // --- Populate sender (because frontend expects fullName) ---
    const populatedMessage = await message.populate("sender", "fullName email username");

    // --- Broadcast to room instantly ---
    io.to(roomId).emit("new_image_message", populatedMessage);

    // Send back to uploader
    res.status(201).json(populatedMessage);

  } catch (err) {
    console.error("Image upload error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

module.exports = router;
