const express = require('express');
const router = express.Router();
const tableController = require('../controllers/table.controller');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

router.get('/', tableController.getAllTables);
router.post('/', verifyToken, isAdmin, tableController.createTable);
router.put('/:id', verifyToken, isAdmin, tableController.updateTable);
router.delete('/:id', verifyToken, isAdmin, tableController.deleteTable);
router.put('/:id/status', tableController.updateStatus);

module.exports = router;
