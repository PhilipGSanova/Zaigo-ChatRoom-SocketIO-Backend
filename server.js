require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/auth');
const { initSocket } = require('./socket');

const app = express();
const server = http.createServer(app);

// --- Security & parsing ---
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(cors({
  origin: 'https://zaigo-chatroom-socketio-frontend.onrender.com',
  credentials: true
}));


app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// --- Routes ---
app.use('/api/auth', authRoutes);
app.get('/', (req, res) => res.send({ ok: true, message: 'Chat backend running' }));

// --- DB & Socket ---
connectDB().then(() => {
  initSocket(server);
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => console.log(`Server running on ${PORT}`));
}).catch(err => console.error('DB connection error', err));
