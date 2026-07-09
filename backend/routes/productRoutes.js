const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
  createProduct, getProducts, getProduct,
  updateProduct, deleteProduct, uploadProductImages, getMyProducts,
} = require('../controllers/productController');
const { protect } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');
const { productUpload } = require('../middleware/upload');

router.get('/', getProducts);
router.get('/my/listings', protect, getMyProducts);
router.get('/:id', getProduct);

router.post(
  '/',
  protect,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('category').notEmpty().withMessage('Category is required'),
    body('price').isFloat({ min: 0 }).withMessage('Valid price is required'),
  ],
  validateRequest,
  createProduct
);

router.put('/:id/images', protect, productUpload.multiple('images'), uploadProductImages);
router.put('/:id', protect, updateProduct);
router.delete('/:id', protect, deleteProduct);

module.exports = router;
