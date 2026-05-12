const express = require('express');
const router = express.Router();
const discountController = require('../controllers/discount.controller');
const { verifyToken, isAdmin, optionalToken } = require('../middleware/authMiddleware');

router.post('/apply', optionalToken, discountController.applyDiscount);
router.post('/redeem', verifyToken, discountController.redeemDiscount);
router.get('/redeemable', optionalToken, discountController.getRedeemableDiscounts);

router.get('/admin/list', verifyToken, isAdmin, discountController.getAdminDiscounts);
router.post('/admin/create', verifyToken, isAdmin, discountController.createDiscount);
router.put('/admin/update/:id', verifyToken, isAdmin, discountController.updateDiscount);
router.delete('/admin/delete/:id', verifyToken, isAdmin, discountController.deleteDiscount);

module.exports = router;
