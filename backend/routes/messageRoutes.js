const express = require('express');
const router = express.Router();
const { sendMessage, getConversation, getInbox, markAsRead } = require('../controllers/messageController');
const { protect } = require('../middleware/auth');
const { chatUpload } = require('../middleware/upload');

router.get('/', protect, getInbox);
router.get('/:userId', protect, getConversation);
router.post('/', protect, chatUpload.single('image'), sendMessage);
router.put('/:userId/read', protect, markAsRead);

module.exports = router;
