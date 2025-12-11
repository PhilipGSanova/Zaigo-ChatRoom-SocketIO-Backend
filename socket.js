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

  // Auth middleware
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

    // Join personal room
    socket.join(socket.user.id);

    // Join chatroom
    socket.on("join_room", ({ roomId }) => {
      socket.join(roomId);
    });

    // Leave chatroom
    socket.on("leave_room", ({ roomId }) => {
      socket.leave(roomId);
    });

    // ---------------- TEXT MESSAGE ----------------
    socket.on("send_message", async ({ roomId, text }) => {
      if (!roomId || !text) return;

      try {
        const message = await Message.create({
          room: roomId,
          sender: socket.user.id,
          text,
        });

        io.to(roomId).emit("new_message", {
          ...message.toObject(),
          sender: socket.user,
        });
      } catch (err) {
        console.error("Text message error:", err);
      }
    });

    // ---------------- VOICE MESSAGE ----------------
    socket.on("send_voice_message", async ({ roomId, audio }) => {
      if (!roomId || !audio) return;

      try {
        const message = await Message.create({
          room: roomId,
          sender: socket.user.id,
          audio,
        });

        io.to(roomId).emit("new_voice_message", {
          ...message.toObject(),
          sender: socket.user,
        });
      } catch (err) {
        console.error("Voice message error:", err);
      }
    });

    // ---------------- IMAGE MESSAGE ----------------
    socket.on("send_image_message", async ({ roomId, fileData }) => {
      if (!roomId || !fileData) return;

      try {
        const message = await Message.create({
          room: roomId,
          sender: socket.user.id,
          attachments: [fileData],
        });

        io.to(roomId).emit("new_image_message", {
          ...message.toObject(),
          sender: socket.user,
        });
      } catch (err) {
        console.error("Image message error:", err);
      }
    });

    socket.on("disconnect", () => {
      console.log("Disconnected:", socket.user.username);
    });
  });
}

module.exports = { initSocket, getIO: () => io };
