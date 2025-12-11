const express = require("express");
const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");
const Message = require("../models/Message");
const { getIO } = require("../../socket");

const router = express.Router();
const upload = multer(); // memory storage

router.post("/image", upload.single("attachment"), async (req, res) => {
  try {
    const io = getIO();
    console.log("req.body:", req.body);
    console.log("req.file:", req.file);
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
      let cloudUpload;
      try {
        cloudUpload = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "chatroom_uploads", resource_type: "image" },
            (err, result) => {
              if (err) reject(err);
              else resolve(result);
            }
          );
          streamifier.createReadStream(file.buffer).pipe(stream);
        });

        attachments.push({
          url: cloudUpload.secure_url,
          filename: file.originalname || "image.jpg",
          mime: file.mimetype,
        });
      } catch (err) {
        console.error("Cloudinary upload failed:", err);
        return res.status(500).json({ error: "Cloudinary upload failed", details: err.message });
      }
    }

    // --- Create Message in DB ---
    const message = await Message.create({
      room: roomId,
      sender: senderId,
      text: text || null,
      attachments,
      createdAt: new Date(),
    });

    const populatedMessage = await message.populate("sender", "fullName email username");

    // --- Broadcast to all users in the room ---
    io.to(roomId).emit("new_image_message", populatedMessage);

    // --- Send response to uploader ---
    res.status(201).json(populatedMessage);

  } catch (err) {
    console.error("Image upload error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

module.exports = router;
