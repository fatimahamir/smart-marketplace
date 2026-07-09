const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
  createService, getServices, getService,
  updateService, deleteService, uploadPortfolioImages, getMyServices,
} = require('../controllers/serviceController');
const { protect } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');
const { serviceUpload } = require('../middleware/upload');

router.get('/', getServices);
router.get('/my/listings', protect, getMyServices);
router.get('/:id', getService);

router.post(
  '/',
  protect,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('category').notEmpty().withMessage('Category is required'),
    body('pricing.amount').isFloat({ min: 0 }).withMessage('Valid price is required'),
    body('deliveryTime').notEmpty().withMessage('Delivery time is required'),
  ],
  validateRequest,
  createService
);

router.put('/:id/images', protect, serviceUpload.multiple('images'), uploadPortfolioImages);
router.put('/:id', protect, updateService);
router.delete('/:id', protect, deleteService);

module.exports = router;
