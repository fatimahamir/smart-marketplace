const asyncHandler = require('../middleware/asyncHandler');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');
// Build a consistent conversationId regardless of who sends first
const getConversationId = (userA, userB) => [userA, userB].sort().join('_');

// @desc  Send a message (REST fallback; primary real-time path is Socket.io 'sendMessage' event)
// @route POST /api/messages
exports.sendMessage = asyncHandler(async (req, res) => {
  const { receiverId, content } = req.body;

  if (!content && !req.file) {
    return res.status(400).json({ success: false, message: 'Message content or image is required' });
  }

  const conversationId = getConversationId(req.user.id, receiverId);

  const message = await Message.create({
    conversationId,
    sender: req.user.id,
    receiver: receiverId,
    content: content || '',
    image: req.file ? req.file.path : '',
  });

  // Emit to receiver in real-time if they are connected
  const io = req.app.get('io');
  if (io) io.to(receiverId).emit('receiveMessage', message);

  // Create a notification for the receiver
  const notification = await Notification.create({
    user: receiverId,
    type: 'new_message',
    message: 'You have a new message',
    relatedId: message._id,
  });
  if (io) io.to(receiverId).emit('receiveNotification', notification);

  res.status(201).json({ success: true, message });
});

// @desc  Get full conversation history between logged-in user and another user
// @route GET /api/messages/:userId
exports.getConversation = asyncHandler(async (req, res) => {
  const conversationId = getConversationId(req.user.id, req.params.userId);

  const messages = await Message.find({ conversationId })
    .sort('createdAt')
    .populate('sender', 'fullName profilePicture')
    .populate('receiver', 'fullName profilePicture');

  res.status(200).json({ success: true, count: messages.length, messages });
});

// @desc  Get list of all conversations (inbox) for logged-in user, most recent first
// @route GET /api/messages
exports.getInbox = asyncHandler(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user.id);
  // Get latest message per conversation involving this user
  const conversations = await Message.aggregate([
    { $match: { $or: [{ sender: userId }, { receiver: userId }] } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: '$conversationId',
        lastMessage: { $first: '$$ROOT' },
        unreadCount: {
          $sum: {
            $cond: [{ $and: [{ $eq: ['$receiver', userId] }, { $eq: ['$isRead', false] }] }, 1, 0],
          },
        },
      },
    },
    { $sort: { 'lastMessage.createdAt': -1 } },
  ]);

  res.status(200).json({ success: true, conversations });
});

// @desc  Mark all messages in a conversation as read
// @route PUT /api/messages/:userId/read
exports.markAsRead = asyncHandler(async (req, res) => {
  const conversationId = getConversationId(req.user.id, req.params.userId);

  await Message.updateMany(
    { conversationId, receiver: req.user.id, isRead: false },
    { isRead: true }
  );

  const io = req.app.get('io');
  if (io) {
    io.to(req.params.userId).emit('messagesRead', { conversationId, readerId: req.user.id });
  }

  res.status(200).json({ success: true, message: 'Messages marked as read' });
});
