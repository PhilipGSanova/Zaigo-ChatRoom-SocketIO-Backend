const express = require("express");
const multer = require("multer");
const Message = require("../models/Message");
const path = require("path");

const router = express.Router();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.round(Math.random() * 1e9));
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});

const upload = multer({ storage });

router.post("/image", upload.single("attachment"), async (req, res) => {
    try {
        const { roomId, senderId } = req.body;
        const file = req.file;

        if (!file) return res.status(400).json ({error: "No file uploaded"});
        
        const message = new Message({
            room: roomId,
            sender: senderId,
            attachments: [{
                url: `/uploads/${file.filename}`,
                filename: file.originalname,
                mime: file.mimetype
            },
        ],
        });

        await message.save();

        res.status(201).json(message);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;