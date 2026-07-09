const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
  createBooking, getMyBookings, getBooking,
  acceptBooking, rejectBooking, completeBooking, cancelBooking,
} = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');

router.post(
  '/',
  protect,
  [
    body('serviceId').notEmpty().withMessage('Service is required'),
    body('preferredDate').notEmpty().withMessage('Preferred date is required'),
    body('preferredTime').notEmpty().withMessage('Preferred time is required'),
  ],
  validateRequest,
  createBooking
);

router.get('/my', protect, getMyBookings);
router.get('/:id', protect, getBooking);

router.put('/:id/accept', protect, acceptBooking);
router.put('/:id/reject', protect, rejectBooking);
router.put('/:id/complete', protect, completeBooking);
router.put('/:id/cancel', protect, cancelBooking);

module.exports = router;
