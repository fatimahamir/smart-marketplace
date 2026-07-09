const asyncHandler = require('../middleware/asyncHandler');
const User = require('../models/User');
const Product = require('../models/Product');
const Service = require('../models/Service');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');

// @desc  Get a user's public profile
// @route GET /api/users/:id
exports.getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-favorites -resetPasswordToken -resetPasswordExpire');
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  const [products, services] = await Promise.all([
    Product.find({ seller: user._id, isActive: true }),
    Service.find({ provider: user._id, isActive: true }),
  ]);

  res.status(200).json({ success: true, user, activeListings: { products, services } });
});

// @desc  Update own profile
// @route PUT /api/users/profile
exports.updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = ['fullName', 'bio', 'phone', 'skills', 'location'];
  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true });
  res.status(200).json({ success: true, user });
});

// @desc  Upload/update profile picture
// @route PUT /api/users/profile-picture
exports.uploadProfilePicture = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No image uploaded' });

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { profilePicture: req.file.path },
    { new: true }
  );
  res.status(200).json({ success: true, user });
});

// @desc  Add product/service to favorites
// @route POST /api/users/favorites/:type/:id  (type = product | service)
exports.addFavorite = asyncHandler(async (req, res) => {
  const { type, id } = req.params;
  if (!['product', 'service'].includes(type)) {
    return res.status(400).json({ success: false, message: 'Invalid favorite type' });
  }

  const field = type === 'product' ? 'favorites.products' : 'favorites.services';
  const user = await User.findById(req.user.id);

  const list = type === 'product' ? user.favorites.products : user.favorites.services;
  if (list.some((itemId) => itemId.toString() === id)) {
    return res.status(400).json({ success: false, message: 'Already in favorites' });
  }
  list.push(id);
  await user.save();

  const Model = type === 'product' ? Product : Service;
  await Model.findByIdAndUpdate(id, { $inc: { favoritesCount: 1 } });

  res.status(200).json({ success: true, message: 'Added to favorites' });
});

// @desc  Remove from favorites
// @route DELETE /api/users/favorites/:type/:id
exports.removeFavorite = asyncHandler(async (req, res) => {
  const { type, id } = req.params;
  if (!['product', 'service'].includes(type)) {
    return res.status(400).json({ success: false, message: 'Invalid favorite type' });
  }

  const user = await User.findById(req.user.id);
  if (type === 'product') {
    user.favorites.products = user.favorites.products.filter((itemId) => itemId.toString() !== id);
  } else {
    user.favorites.services = user.favorites.services.filter((itemId) => itemId.toString() !== id);
  }
  await user.save();

  const Model = type === 'product' ? Product : Service;
  await Model.findByIdAndUpdate(id, { $inc: { favoritesCount: -1 } });

  res.status(200).json({ success: true, message: 'Removed from favorites' });
});

// @desc  Get favorites list
// @route GET /api/users/favorites
exports.getFavorites = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id)
    .populate('favorites.products')
    .populate('favorites.services');
  res.status(200).json({ success: true, favorites: user.favorites });
});

// @desc  Get personalized dashboard data
// @route GET /api/users/dashboard
exports.getDashboard = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const [products, services, bookingsAsBuyer, bookingsAsProvider, notifications] = await Promise.all([
    Product.find({ seller: userId }),
    Service.find({ provider: userId }),
    Booking.find({ buyer: userId }).populate('service', 'title'),
    Booking.find({ provider: userId }).populate('service', 'title'),
    Notification.find({ user: userId }).sort('-createdAt').limit(10),
  ]);

  const completedBookings = bookingsAsProvider.filter((b) => b.status === 'completed');
  const earnings = completedBookings.reduce((sum, b) => sum + b.price, 0); // dummy earnings calc

  res.status(200).json({
    success: true,
    dashboard: {
      activeListings: { products, services },
      serviceRequests: bookingsAsProvider.filter((b) => b.status === 'pending'),
      bookingHistory: { asBuyer: bookingsAsBuyer, asProvider: bookingsAsProvider },
      earnings,
      recentNotifications: notifications,
    },
  });
});
