const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');

router.post('/create', paymentController.createPaymentLink);
router.get('/status/:orderCode', paymentController.getPaymentStatus);
router.post('/webhook', paymentController.handleWebhook);

module.exports = router;
