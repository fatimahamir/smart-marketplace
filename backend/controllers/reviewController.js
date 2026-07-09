const asyncHandler = require('../middleware/asyncHandler');
const Review = require('../models/Review');
const Product = require('../models/Product');
const Service = require('../models/Service');
const User = require('../models/User');
const Notification = require('../models/Notification');

// Recalculate and update average rating on the target (Product/Service) and its owner (User)
const recalculateRatings = async (targetType, targetId, ownerId) => {
  const filter = targetType === 'product' ? { product: targetId } : { service: targetId };
  const stats = await Review.aggregate([
    { $match: filter },
    { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  const avgRating = stats.length ? Math.round(stats[0].avgRating * 10) / 10 : 0;
  const count = stats.length ? stats[0].count : 0;

  const Model = targetType === 'product' ? Product : Service;
  await Model.findByIdAndUpdate(targetId, { averageRating: avgRating, totalReviews: count });

  // Recalculate the owner's overall reputation across all their products + services
  const ownerFilter = { targetOwner: ownerId };
  const ownerStats = await Review.aggregate([
    { $match: ownerFilter },
    { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const ownerAvg = ownerStats.length ? Math.round(ownerStats[0].avgRating * 10) / 10 : 0;
  const ownerCount = ownerStats.length ? ownerStats[0].count : 0;
  await User.findByIdAndUpdate(ownerId, { averageRating: ownerAvg, totalReviews: ownerCount });
};

// @desc  Submit a review for a product or service
// @route POST /api/reviews
exports.createReview = asyncHandler(async (req, res) => {
  const { targetType, targetId, rating, comment } = req.body;

  if (!['product', 'service'].includes(targetType)) {
    return res.status(400).json({ success: false, message: 'Invalid target type' });
  }

  const Model = targetType === 'product' ? Product : Service;
  const target = await Model.findById(targetId);
  if (!target) return res.status(404).json({ success: false, message: `${targetType} not found` });

  const ownerId = targetType === 'product' ? target.seller : target.provider;
  if (ownerId.toString() === req.user.id) {
    return res.status(400).json({ success: false, message: 'You cannot review your own listing' });
  }

  const existing = await Review.findOne({
    reviewer: req.user.id,
    ...(targetType === 'product' ? { product: targetId } : { service: targetId }),
  });
  if (existing) {
    return res.status(400).json({ success: false, message: 'You have already reviewed this listing' });
  }

  const review = await Review.create({
    reviewer: req.user.id,
    targetType,
    [targetType]: targetId,
    targetOwner: ownerId,
    rating,
    comment,
  });

  await recalculateRatings(targetType, targetId, ownerId);

  const notification = await Notification.create({
    user: ownerId,
    type: 'new_review',
    message: `You received a new ${rating}-star review`,
    relatedId: review._id,
  });
  const io = req.app.get('io');
  if (io) io.to(ownerId.toString()).emit('receiveNotification', notification);

  res.status(201).json({ success: true, review });
});

// @desc  Get all reviews for a product or service
// @route GET /api/reviews/:targetType/:targetId
exports.getReviews = asyncHandler(async (req, res) => {
  const { targetType, targetId } = req.params;
  if (!['product', 'service'].includes(targetType)) {
    return res.status(400).json({ success: false, message: 'Invalid target type' });
  }

  const filter = targetType === 'product' ? { product: targetId } : { service: targetId };
  const reviews = await Review.find(filter)
    .populate('reviewer', 'fullName profilePicture')
    .sort('-createdAt');

  res.status(200).json({ success: true, count: reviews.length, reviews });
});

// @desc  Get reviews received by a user (seller/provider reputation)
// @route GET /api/reviews/user/:userId
exports.getUserReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ targetOwner: req.params.userId })
    .populate('reviewer', 'fullName profilePicture')
    .populate('product', 'title')
    .populate('service', 'title')
    .sort('-createdAt');

  res.status(200).json({ success: true, count: reviews.length, reviews });
});

// @desc  Report a review as fake/inappropriate
// @route PUT /api/reviews/:id/report
exports.reportReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

  review.isReported = true;
  review.reportReason = req.body.reason || 'No reason provided';
  await review.save();

  res.status(200).json({ success: true, message: 'Review reported for admin review' });
});

// @desc  Delete own review
// @route DELETE /api/reviews/:id
exports.deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

  if (review.reviewer.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized to delete this review' });
  }

  const { targetType, targetOwner } = review;
  const targetId = targetType === 'product' ? review.product : review.service;

  await review.deleteOne();
  await recalculateRatings(targetType, targetId, targetOwner);

  res.status(200).json({ success: true, message: 'Review deleted successfully' });
});
