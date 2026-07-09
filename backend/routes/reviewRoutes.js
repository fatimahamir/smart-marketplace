const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
  createReview, getReviews, getUserReviews, reportReview, deleteReview,
} = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');

router.post(
  '/',
  protect,
  [
    body('targetType').isIn(['product', 'service']).withMessage('Invalid target type'),
    body('targetId').notEmpty().withMessage('Target id is required'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  ],
  validateRequest,
  createReview
);

router.get('/user/:userId', getUserReviews);
router.get('/:targetType/:targetId', getReviews);

router.put('/:id/report', protect, reportReview);
router.delete('/:id', protect, deleteReview);

module.exports = router;
