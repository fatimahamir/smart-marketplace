const asyncHandler = require('../middleware/asyncHandler');
const User = require('../models/User');
const Product = require('../models/Product');
const Service = require('../models/Service');
const Booking = require('../models/Booking');
const Review = require('../models/Review');

// ---------- USERS ----------

// @desc  Get all users (paginated, searchable)
// @route GET /api/admin/users?keyword=&page=&limit=
exports.getAllUsers = asyncHandler(async (req, res) => {
  const { keyword, page = 1, limit = 20 } = req.query;
  const query = {};
  if (keyword) {
    query.$or = [
      { fullName: new RegExp(keyword, 'i') },
      { email: new RegExp(keyword, 'i') },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [users, total] = await Promise.all([
    User.find(query).select('-password').sort('-createdAt').skip(skip).limit(Number(limit)),
    User.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    count: users.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: Number(page),
    users,
  });
});

// @desc  Suspend a user account
// @route PUT /api/admin/users/:id/suspend
exports.suspendUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { isSuspended: true }, { new: true }).select('-password');
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.status(200).json({ success: true, message: 'User suspended', user });
});

// @desc  Reinstate (unsuspend) a user account
// @route PUT /api/admin/users/:id/unsuspend
exports.unsuspendUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { isSuspended: false }, { new: true }).select('-password');
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.status(200).json({ success: true, message: 'User reinstated', user });
});

// @desc  Delete a user account permanently
// @route DELETE /api/admin/users/:id
exports.deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  await Promise.all([
    Product.deleteMany({ seller: user._id }),
    Service.deleteMany({ provider: user._id }),
    user.deleteOne(),
  ]);

  res.status(200).json({ success: true, message: 'User and their listings deleted' });
});

// ---------- LISTINGS ----------

// @desc  Get listings pending approval (products + services)
// @route GET /api/admin/listings/pending
exports.getPendingListings = asyncHandler(async (req, res) => {
  const [products, services] = await Promise.all([
    Product.find({ isApproved: false }).populate('seller', 'fullName email'),
    Service.find({ isApproved: false }).populate('provider', 'fullName email'),
  ]);
  res.status(200).json({ success: true, products, services });
});

// @desc  Approve a listing
// @route PUT /api/admin/listings/:type/:id/approve  (type = product | service)
exports.approveListing = asyncHandler(async (req, res) => {
  const { type, id } = req.params;
  if (!['product', 'service'].includes(type)) {
    return res.status(400).json({ success: false, message: 'Invalid listing type' });
  }
  const Model = type === 'product' ? Product : Service;
  const listing = await Model.findByIdAndUpdate(id, { isApproved: true }, { new: true });
  if (!listing) return res.status(404).json({ success: false, message: 'Listing not found' });
  res.status(200).json({ success: true, message: 'Listing approved', listing });
});

// @desc  Remove (deactivate) a listing
// @route PUT /api/admin/listings/:type/:id/remove
exports.removeListing = asyncHandler(async (req, res) => {
  const { type, id } = req.params;
  if (!['product', 'service'].includes(type)) {
    return res.status(400).json({ success: false, message: 'Invalid listing type' });
  }
  const Model = type === 'product' ? Product : Service;
  const listing = await Model.findByIdAndUpdate(id, { isActive: false, isApproved: false }, { new: true });
  if (!listing) return res.status(404).json({ success: false, message: 'Listing not found' });
  res.status(200).json({ success: true, message: 'Listing removed', listing });
});

// ---------- REPORTED CONTENT ----------

// @desc  Get all reported reviews
// @route GET /api/admin/reports/reviews
exports.getReportedReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ isReported: true })
    .populate('reviewer', 'fullName email')
    .populate('targetOwner', 'fullName email')
    .sort('-createdAt');
  res.status(200).json({ success: true, count: reviews.length, reviews });
});

// @desc  Dismiss a report (keep review, clear flag)
// @route PUT /api/admin/reports/reviews/:id/dismiss
exports.dismissReport = asyncHandler(async (req, res) => {
  const review = await Review.findByIdAndUpdate(
    req.params.id,
    { isReported: false, reportReason: '' },
    { new: true }
  );
  if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
  res.status(200).json({ success: true, message: 'Report dismissed', review });
});

// @desc  Remove a reported review
// @route DELETE /api/admin/reports/reviews/:id
exports.removeReportedReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
  await review.deleteOne();
  res.status(200).json({ success: true, message: 'Reported review removed' });
});

// ---------- PLATFORM STATISTICS ----------

// @desc  Get overall platform statistics for admin dashboard
// @route GET /api/admin/stats
exports.getPlatformStats = asyncHandler(async (req, res) => {
  const [
    totalUsers, suspendedUsers, totalProducts, activeProducts,
    totalServices, activeServices, totalBookings, completedBookings,
    pendingBookings, totalReviews, reportedReviews,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isSuspended: true }),
    Product.countDocuments(),
    Product.countDocuments({ isActive: true, isApproved: true }),
    Service.countDocuments(),
    Service.countDocuments({ isActive: true, isApproved: true }),
    Booking.countDocuments(),
    Booking.countDocuments({ status: 'completed' }),
    Booking.countDocuments({ status: 'pending' }),
    Review.countDocuments(),
    Review.countDocuments({ isReported: true }),
  ]);

  const revenueAgg = await Booking.aggregate([
    { $match: { status: 'completed' } },
    { $group: { _id: null, total: { $sum: '$price' } } },
  ]);
  const totalRevenue = revenueAgg.length ? revenueAgg[0].total : 0; // dummy platform revenue

  res.status(200).json({
    success: true,
    stats: {
      users: { total: totalUsers, suspended: suspendedUsers },
      products: { total: totalProducts, active: activeProducts },
      services: { total: totalServices, active: activeServices },
      bookings: { total: totalBookings, completed: completedBookings, pending: pendingBookings },
      reviews: { total: totalReviews, reported: reportedReviews },
      totalRevenue,
    },
  });
});

// @desc  Get recent platform activity feed (latest listings, bookings, reviews)
// @route GET /api/admin/activity
exports.getRecentActivity = asyncHandler(async (req, res) => {
  const [recentUsers, recentProducts, recentServices, recentBookings, recentReviews] = await Promise.all([
    User.find().select('fullName email createdAt').sort('-createdAt').limit(5),
    Product.find().select('title createdAt').populate('seller', 'fullName').sort('-createdAt').limit(5),
    Service.find().select('title createdAt').populate('provider', 'fullName').sort('-createdAt').limit(5),
    Booking.find().select('status createdAt').populate('buyer', 'fullName').sort('-createdAt').limit(5),
    Review.find().select('rating comment createdAt').populate('reviewer', 'fullName').sort('-createdAt').limit(5),
  ]);

  res.status(200).json({
    success: true,
    activity: { recentUsers, recentProducts, recentServices, recentBookings, recentReviews },
  });
});
