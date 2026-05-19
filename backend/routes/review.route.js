const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

router.post('/create', verifyToken, reviewController.createReview);
router.get('/order/:orderId', verifyToken, reviewController.getOrderReview);

// Admin/Staff routes
router.get('/admin/list', verifyToken, isAdmin, reviewController.getAdminReviews);
router.post('/admin/reply/:reviewId', verifyToken, isAdmin, reviewController.replyReview);

module.exports = router;
