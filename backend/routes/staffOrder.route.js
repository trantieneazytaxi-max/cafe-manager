const express = require('express');
const router = express.Router();
const staffOrderController = require('../controllers/staffOrder.controller');
const { verifyToken, isStaff } = require('../middleware/authMiddleware');

router.use(verifyToken);
router.use(isStaff);

router.get('/stats', staffOrderController.getStats);
router.get('/recent', staffOrderController.getRecentOrders);
router.get('/', staffOrderController.getAllOrders);
router.get('/:orderId', staffOrderController.getOrderDetail);
router.put('/:orderId/confirm', staffOrderController.confirmOrder);
router.put('/:orderId/status', staffOrderController.updateStatus);

module.exports = router;
