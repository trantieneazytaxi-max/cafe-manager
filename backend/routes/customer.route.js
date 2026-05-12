const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customer.controller');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/profile', customerController.getProfile);
router.put('/profile', customerController.updateProfile);
router.put('/profile/address', customerController.updateAddress);
router.get('/orders', customerController.getOrders);
router.get('/loyalty', customerController.getLoyaltyPoints);

module.exports = router;
