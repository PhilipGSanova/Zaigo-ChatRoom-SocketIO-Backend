# Chat Backend Starter

## Quick start

1. Copy `.env.example` to `.env` and fill the values.
2. `npm install`
3. `npm run dev` (requires nodemon) or `npm start`

Server runs on `http://localhost:5000` by default.

Socket.IO endpoint is attached to the same server.

## Features

- User registration & login (JWT)
- Socket.IO JWT handshake validation
- Message & Room Mongoose models
- Basic security middlewares

## Next steps

- Add message saving on socket events
- Add file upload support (Cloudinary/S3)
- Add tests and CI