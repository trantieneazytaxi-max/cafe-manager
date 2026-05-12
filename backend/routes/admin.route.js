const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { verifyToken, isAdmin, isStaff } = require('../middleware/authMiddleware');

router.use(verifyToken);

// Thống kê
router.get('/stats', isStaff, adminController.getStats);
router.get('/category-stats', isStaff, adminController.getCategoryStats);
router.get('/top-items', isStaff, adminController.getTopItems);

// Nhân viên
router.get('/staff', isAdmin, adminController.getStaffList);
router.post('/staff', isAdmin, adminController.createStaff);
router.put('/staff/:id', isAdmin, adminController.updateStaff);
router.put('/staff/:id/toggle-status', isAdmin, adminController.toggleStaffStatus);

// Cài đặt
router.get('/store-settings', isAdmin, adminController.getStoreSettings);
router.put('/store-settings', isAdmin, adminController.updateStoreSettings);

module.exports = router;
