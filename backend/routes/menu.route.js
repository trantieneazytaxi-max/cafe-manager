const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menu.controller');
const { verifyToken, isAdmin, isStaff } = require('../middleware/authMiddleware');

router.get('/categories', menuController.getCategories);
router.post('/categories', verifyToken, isAdmin, menuController.createCategory);

router.get('/items', menuController.getItems);
router.get('/admin/items', verifyToken, isStaff, menuController.getAdminItems);
router.get('/staff/items', verifyToken, isStaff, menuController.getStaffItems);
router.put('/staff/items/:id/pause', verifyToken, isStaff, menuController.togglePause);

router.get('/items/:id/options', menuController.getItemOptions);
router.post('/items/:id/calculate-price', menuController.calculatePrice);

router.post('/items', verifyToken, isAdmin, menuController.createItem);
router.put('/items/:id', verifyToken, isAdmin, menuController.updateItem);
router.delete('/items/:id', verifyToken, isAdmin, menuController.deleteItem);
router.get('/items/:id', menuController.getItemDetail);

module.exports = router;
