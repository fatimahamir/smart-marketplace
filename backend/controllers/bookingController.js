const asyncHandler = require('../middleware/asyncHandler');
const Booking = require('../models/Booking');
const Service = require('../models/Service');
const Notification = require('../models/Notification');

// Helper: create notification + emit real-time event via socket.io
const notifyUser = async (req, userId, type, message, relatedId) => {
  const notification = await Notification.create({ user: userId, type, message, relatedId });
  const io = req.app.get('io');
  if (io) io.to(userId.toString()).emit('receiveNotification', notification);
  return notification;
};

// @desc  Request a service (create booking)
// @route POST /api/bookings
exports.createBooking = asyncHandler(async (req, res) => {
  const { serviceId, preferredDate, preferredTime, notes } = req.body;

  const service = await Service.findById(serviceId);
  if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
  if (!service.availability) {
    return res.status(400).json({ success: false, message: 'This service is currently unavailable' });
  }
  if (service.provider.toString() === req.user.id) {
    return res.status(400).json({ success: false, message: 'You cannot book your own service' });
  }

  const booking = await Booking.create({
    service: service._id,
    buyer: req.user.id,
    provider: service.provider,
    preferredDate,
    preferredTime,
    price: service.pricing.amount,
    notes,
  });

  await notifyUser(
    req,
    service.provider,
    'booking_request',
    `New booking request for "${service.title}"`,
    booking._id
  );

  res.status(201).json({ success: true, booking });
});

// @desc  Get bookings for logged-in user (as buyer or provider)
// @route GET /api/bookings/my?role=buyer|provider&status=pending
exports.getMyBookings = asyncHandler(async (req, res) => {
  const { role = 'buyer', status } = req.query;

  const query = role === 'provider' ? { provider: req.user.id } : { buyer: req.user.id };
  if (status) query.status = status;

  const bookings = await Booking.find(query)
    .populate('service', 'title category pricing images portfolioImages')
    .populate('buyer', 'fullName profilePicture')
    .populate('provider', 'fullName profilePicture')
    .sort('-createdAt');

  res.status(200).json({ success: true, count: bookings.length, bookings });
});

// @desc  Get single booking details
// @route GET /api/bookings/:id
exports.getBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('service')
    .populate('buyer', 'fullName profilePicture')
    .populate('provider', 'fullName profilePicture');

  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

  const isParticipant =
    booking.buyer._id.toString() === req.user.id || booking.provider._id.toString() === req.user.id;
  if (!isParticipant && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized to view this booking' });
  }

  res.status(200).json({ success: true, booking });
});

// @desc  Provider accepts a booking request
// @route PUT /api/bookings/:id/accept
exports.acceptBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

  if (booking.provider.toString() !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }
  if (booking.status !== 'pending') {
    return res.status(400).json({ success: false, message: `Cannot accept a booking that is ${booking.status}` });
  }

  booking.status = 'accepted';
  await booking.save();

  await notifyUser(req, booking.buyer, 'booking_status', 'Your booking request was accepted', booking._id);

  res.status(200).json({ success: true, booking });
});

// @desc  Provider rejects a booking request
// @route PUT /api/bookings/:id/reject
exports.rejectBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

  if (booking.provider.toString() !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }
  if (booking.status !== 'pending') {
    return res.status(400).json({ success: false, message: `Cannot reject a booking that is ${booking.status}` });
  }

  booking.status = 'rejected';
  booking.cancelReason = req.body.reason || '';
  await booking.save();

  await notifyUser(req, booking.buyer, 'booking_status', 'Your booking request was rejected', booking._id);

  res.status(200).json({ success: true, booking });
});

// @desc  Mark booking as completed (provider only)
// @route PUT /api/bookings/:id/complete
exports.completeBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

  if (booking.provider.toString() !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }
  if (booking.status !== 'accepted') {
    return res.status(400).json({ success: false, message: 'Only accepted bookings can be marked completed' });
  }

  booking.status = 'completed';
  await booking.save();

  await notifyUser(req, booking.buyer, 'booking_status', 'Your booking has been marked completed', booking._id);

  res.status(200).json({ success: true, booking });
});

// @desc  Cancel a booking (buyer or provider)
// @route PUT /api/bookings/:id/cancel
exports.cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

  const isParticipant =
    booking.buyer.toString() === req.user.id || booking.provider.toString() === req.user.id;
  if (!isParticipant) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }
  if (['completed', 'cancelled', 'rejected'].includes(booking.status)) {
    return res.status(400).json({ success: false, message: `Cannot cancel a booking that is ${booking.status}` });
  }

  booking.status = 'cancelled';
  booking.cancelReason = req.body.reason || '';
  await booking.save();

  const otherParty =
    booking.buyer.toString() === req.user.id ? booking.provider : booking.buyer;
  await notifyUser(req, otherParty, 'booking_status', 'A booking has been cancelled', booking._id);

  res.status(200).json({ success: true, booking });
});
