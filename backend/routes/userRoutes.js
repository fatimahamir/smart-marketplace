const express = require('express');
const router = express.Router();
const {
  getProfile, updateProfile, uploadProfilePicture,
  addFavorite, removeFavorite, getFavorites, getDashboard,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { profileUpload } = require('../middleware/upload');

router.get('/dashboard', protect, getDashboard);
router.get('/favorites', protect, getFavorites);
router.post('/favorites/:type/:id', protect, addFavorite);
router.delete('/favorites/:type/:id', protect, removeFavorite);

router.put('/profile', protect, updateProfile);
router.put('/profile-picture', protect, profileUpload.single('image'), uploadProfilePicture);

router.get('/:id', getProfile);

module.exports = router;
