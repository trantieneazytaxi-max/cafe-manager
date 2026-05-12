const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { verifyToken, optionalToken } = require('../middleware/authMiddleware');

router.post('/create', optionalToken, orderController.createOrder);
router.get('/history', verifyToken, orderController.getOrderHistory);
router.get('/track/:query', orderController.trackOrder);
router.get('/:orderId', verifyToken, orderController.getOrderDetail);

module.exports = router;
