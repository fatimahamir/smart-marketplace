const express = require('express');
const router = express.Router();
const {
  getAllUsers, suspendUser, unsuspendUser, deleteUser,
  getPendingListings, approveListing, removeListing,
  getReportedReviews, dismissReport, removeReportedReview,
  getPlatformStats, getRecentActivity,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// All admin routes require login + admin role
router.use(protect, authorize('admin'));

router.get('/stats', getPlatformStats);
router.get('/activity', getRecentActivity);

router.get('/users', getAllUsers);
router.put('/users/:id/suspend', suspendUser);
router.put('/users/:id/unsuspend', unsuspendUser);
router.delete('/users/:id', deleteUser);

router.get('/listings/pending', getPendingListings);
router.put('/listings/:type/:id/approve', approveListing);
router.put('/listings/:type/:id/remove', removeListing);

router.get('/reports/reviews', getReportedReviews);
router.put('/reports/reviews/:id/dismiss', dismissReport);
router.delete('/reports/reviews/:id', removeReportedReview);

module.exports = router;
