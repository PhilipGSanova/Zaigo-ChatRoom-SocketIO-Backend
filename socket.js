const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Message = require('./src/models/Message');
const Room = require('./src/models/Room');

const jwtSecret = process.env.JWT_SECRET || 'changeme';
let io;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: 'https://zaigo-chatroom-socketio-backend.onrender.com',
      methods: ['GET','POST'],
      credentials: true
    }
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication error'));

    try {
      socket.user = jwt.verify(token, jwtSecret);
      next();
    } catch {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log('Connected:', socket.user.username);
    socket.join(socket.user.id); // personal room

    socket.on('join_room', ({ roomId }) => {
      socket.join(roomId);
      socket.to(roomId).emit('user_joined', { userId: socket.user.id, username: socket.user.username });
    });

    socket.on('leave_room', ({ roomId }) => {
      socket.leave(roomId);
      socket.to(roomId).emit('user_left', { userId: socket.user.id, username: socket.user.username });
    });

    socket.on('send_message', async ({ roomId, text }) => {
      if (!roomId || !text) return;
      try {
        const message = await Message.create({ room: roomId, sender: socket.user.id, text });
        io.to(roomId).emit('new_message', { _id: message._id, text, roomId, sender: socket.user, createdAt: message.createdAt });
      } catch (err) {
        console.error(err);
      }
    });

    socket.on('typing', ({ roomId, isTyping }) => {
      socket.to(roomId).emit('typing_status', { roomId, userId: socket.user.id, username: socket.user.username, isTyping });
    });

    socket.on('disconnect', () => console.log('Disconnected:', socket.user?.username || socket.id));
  });
}

module.exports = { initSocket };
