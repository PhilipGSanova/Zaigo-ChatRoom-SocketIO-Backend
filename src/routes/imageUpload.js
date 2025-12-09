// src/routes/imageUpload.js
const express = require("express");
const multer = require("multer");
const streamifier = require("streamifier");
const cloudinary = require("../config/cloudinary");
const Message = require("../models/Message");
const auth = require("../middleware/auth"); // optional: protect route

const router = express.Router();

// multer memory storage (no disk files)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB limit
});

// POST /api/image-upload/image
// Protected route: you can add auth middleware if you want (e.g. auth)
router.post("/image", /* auth, */ upload.single("attachment"), async (req, res) => {
  try {
    const { roomId, senderId, text } = req.body;

    // Validate: need either text or file
    if (!req.file && !text) {
      return res.status(400).json({ error: "Either text or attachment is required" });
    }

    let attachments = [];

    if (req.file) {
      // Upload buffer to Cloudinary via upload_stream
      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "chat_app_uploads",
            resource_type: "image",
            transformation: [{ width: 1280, crop: "limit" }], // optional limits
            format: "auto" // auto convert to modern format when possible
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });

      attachments.push({
        url: uploadResult.secure_url,
        filename: req.file.originalname,
        mime: req.file.mimetype,
        provider_id: uploadResult.public_id // optional: for deletes
      });
    }

    // Create message in DB
    const message = await Message.create({
      room: roomId,
      sender: senderId,
      text: text || null,
      attachments,
      audio: null
    });

    // Return saved message (populated if you want)
    res.status(201).json(message);
  } catch (err) {
    console.error("Image upload error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
