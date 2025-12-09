const express = require("express");
const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");
const Message = require("../models/Message");

const router = express.Router();

const upload = multer(); // memoryStorage

router.post("/image", upload.single("attachment"), async (req, res) => {
  try {
    console.log("BODY =", req.body);
    console.log("FILE =", req.file);
    console.log("HEADERS =", req.headers);
    const { roomId, senderId, text } = req.body;
    const file = req.file;
    console.log("REQ FILE:", req.file);
    console.log("BODY:", req.body);


    if (!file && !text) {
      return res.status(400).json({ error: "Either text or attachment is required" });
    }

    let attachments = [];

    if (file) {
      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "chatroom_uploads",
            resource_type: "image", // ❗ must not be "auto"
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );

        streamifier.createReadStream(file.buffer).pipe(stream);
      });

      attachments.push({
        url: uploadResult.secure_url,
        filename: uploadResult.original_filename,
        mime: file.mimetype,
      });
    }

    const message = new Message({
      room: roomId,
      sender: senderId,
      text: text || null,
      attachments,
    });

    await message.save();

    res.status(201).json(message);

  } catch (err) {
    console.error("Image upload error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

module.exports = router;
