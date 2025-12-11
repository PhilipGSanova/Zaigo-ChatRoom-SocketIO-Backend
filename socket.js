const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const Message = require("./src/models/Message");

const jwtSecret = process.env.JWT_SECRET || "changeme";
let io;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "https://zaigo-chatroom-socketio-frontend.onrender.com",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Auth
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication error"));

    try {
      socket.user = jwt.verify(token, jwtSecret);
      next();
    } catch {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    console.log("Connected:", socket.user.username);

    socket.join(socket.user.id);

    // Join Room
    socket.on("join_room", ({ roomId }) => {
      socket.join(roomId);
    });

    // Text Message
    socket.on("send_message", async ({ roomId, text }) => {
      if (!roomId || !text) return;

      const message = await Message.create({
        room: roomId,
        sender: socket.user.id,
        text,
      });

      io.to(roomId).emit("new_message", {
        ...message.toObject(),
        sender: socket.user,
      });
    });

    // Voice
    socket.on("send_voice_message", async ({ roomId, audio }) => {
      const message = await Message.create({
        room: roomId,
        sender: socket.user.id,
        audio,
      });

      io.to(roomId).emit("new_voice_message", {
        ...message.toObject(),
        sender: socket.user,
      });
    });

    // Image (NEW)
    socket.on("send_image_message", async ({ roomId, fileData }) => {
      const message = await Message.create({
        room: roomId,
        sender: socket.user.id,
        attachments: [fileData],
      });

      io.to(roomId).emit("new_image_message", {
        ...message.toObject(),
        sender: socket.user,
      });
    });

    socket.on("disconnect", () => {
      console.log("Disconnected:", socket.user.username);
    });
  });
}

module.exports = { initSocket, getIO: () => io };
