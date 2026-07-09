const asyncHandler = require('../middleware/asyncHandler');
const Notification = require('../models/Notification');

// @desc  Get logged-in user's notifications (paginated)
// @route GET /api/notifications?page=1&limit=20
exports.getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find({ user: req.user.id }).sort('-createdAt').skip(skip).limit(Number(limit)),
    Notification.countDocuments({ user: req.user.id }),
    Notification.countDocuments({ user: req.user.id, isRead: false }),
  ]);

  res.status(200).json({
    success: true,
    count: notifications.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: Number(page),
    unreadCount,
    notifications,
  });
});

// @desc  Get just the unread notification count (for a badge/bell icon)
// @route GET /api/notifications/unread-count
exports.getUnreadCount = asyncHandler(async (req, res) => {
  const unreadCount = await Notification.countDocuments({ user: req.user.id, isRead: false });
  res.status(200).json({ success: true, unreadCount });
});

// @desc  Mark a single notification as read
// @route PUT /api/notifications/:id/read
exports.markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });

  if (notification.user.toString() !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  notification.isRead = true;
  await notification.save();

  res.status(200).json({ success: true, notification });
});

// @desc  Mark all notifications as read
// @route PUT /api/notifications/read-all
exports.markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user.id, isRead: false }, { isRead: true });
  res.status(200).json({ success: true, message: 'All notifications marked as read' });
});

// @desc  Delete a notification
// @route DELETE /api/notifications/:id
exports.deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });

  if (notification.user.toString() !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  await notification.deleteOne();
  res.status(200).json({ success: true, message: 'Notification deleted' });
});
