const express = require('express');
const router = express.Router();
const forgotPasswordController = require('../controllers/forgotPassword.controller');

router.post('/request', forgotPasswordController.requestReset);
router.post('/reset', forgotPasswordController.resetPassword);
router.get('/requests', forgotPasswordController.getRequests);

module.exports = router;
