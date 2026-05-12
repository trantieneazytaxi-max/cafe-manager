const express = require('express');
const router = express.Router();
const verificationController = require('../controllers/verification.controller');

router.post('/send-email', verificationController.sendOTP);
router.post('/verify', verificationController.verifyOTP);
router.post('/resend', verificationController.resendOTP);

module.exports = router;
