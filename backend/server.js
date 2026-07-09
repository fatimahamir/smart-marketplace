const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const http = require('http');
const { Server } = require('socket.io');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

connectDB();

const app = express();

// Security & parsing middleware
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(mongoSanitize());
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300 });
app.use('/api', limiter);

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/services', require('./routes/serviceRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

app.get('/api/health', (req, res) => res.json({ success: true, message: 'API is running' }));

app.use(errorHandler);

// HTTP + Socket.io server
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || '*', credentials: true },
});

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  // Each user joins a room based on their userId (sent from frontend after login)
  socket.on('join', (userId) => {
    socket.join(userId);
  });

  // Real-time chat message - persist to DB then relay to receiver
  socket.on('sendMessage', async (data) => {
    // data = { sender, receiver, content, image }
    try {
      const Message = require('./models/Message');
      const conversationId = [data.sender, data.receiver].sort().join('_');
      const saved = await Message.create({
        conversationId,
        sender: data.sender,
        receiver: data.receiver,
        content: data.content || '',
        image: data.image || '',
      });
      io.to(data.receiver).emit('receiveMessage', saved);
      io.to(data.sender).emit('messageSent', saved); // confirm delivery to sender's other tabs
    } catch (err) {
      console.error('Socket sendMessage error:', err.message);
    }
  });

  // Typing indicator
  socket.on('typing', ({ senderId, receiverId }) => {
    io.to(receiverId).emit('userTyping', { senderId });
  });
  socket.on('stopTyping', ({ senderId, receiverId }) => {
    io.to(receiverId).emit('userStopTyping', { senderId });
  });

  // Read receipts
  socket.on('markAsRead', ({ conversationId, readerId, receiverId }) => {
    io.to(receiverId).emit('messagesRead', { conversationId, readerId });
  });

  // Live notifications (booking updates, new reviews, etc.)
  socket.on('sendNotification', (notification) => {
    io.to(notification.user).emit('receiveNotification', notification);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

// Make io accessible in controllers via req.app.get('io')
app.set('io', io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
