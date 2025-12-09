import express from "express";
import multer from "multer";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";
import Message from "../models/Message.js";

const router = express.Router();
const upload = multer(); // memory storage

router.post("/image", upload.single("attachment"), async (req, res) => {
  try {
    const { roomId, senderId, text } = req.body;
    const file = req.file;

    if (!file && !text) {
      return res.status(400).json({ error: "Either text or attachment is required" });
    }

    let attachment = [];

    if (file) {
      const uploadResult = await new Promise((resolve, reject) => {
        let cld_upload_stream = cloudinary.uploader.upload_stream(
          {
            folder: "chatroom_uploads",
            resource_type: "image",
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );

        streamifier.createReadStream(file.buffer).pipe(cld_upload_stream);
      });

      attachment.push({
        url: uploadResult.secure_url,
        filename: uploadResult.original_filename,
        mime: file.mimetype,
      });
    }

    const message = new Message({
      room: roomId,
      sender: senderId,
      text: text || null,
      attachments: attachment,
    });

    await message.save();

    res.status(201).json(message);

  } catch (err) {
    console.error("Image upload error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

export default router;
