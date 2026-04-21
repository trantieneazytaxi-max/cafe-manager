const express = require('express');
const router = express.Router();   // ← Phải có dòng này ở đầu

// ✅ Import đúng cho phiên bản @payos/node mới
const { PayOS } = require('@payos/node');

const payos = new PayOS({
    clientId: process.env.PAYOS_CLIENT_ID,
    apiKey: process.env.PAYOS_API_KEY,
    checksumKey: process.env.PAYOS_CHECKSUM_KEY
});

// ==================== TẠO LINK THANH TOÁN ====================
router.post('/create', async (req, res) => {
    try {
        const { amount, items, description } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ 
                success: false, 
                message: "Số tiền không hợp lệ" 
            });
        }

        // ✅ SỬA ORDER CODE - Không được vượt 9007199254740991
        const timestamp = Math.floor(Date.now() / 1000);
        const randomPart = Math.floor(Math.random() * 999999);   // 0 - 999999
        const orderCode = timestamp * 1000000 + randomPart;      // Luôn an toàn

        const paymentData = {
            orderCode,
            amount: Math.round(amount),
            // ✅ BUỘC description ngắn (an toàn tuyệt đối)
            description: (req.body.description || `Cafe ${orderCode}`).slice(0, 25),
            items: items || [],
            cancelUrl: `${process.env.BASE_URL}/user/payment/html/payment.html`,
            returnUrl: `${process.env.BASE_URL}/user/payment/html/payment.html`,
        };

        console.log('Creating PayOS payment with orderCode:', orderCode);

        const paymentLink = await payos.paymentRequests.create(paymentData);

        console.log('PayOS response:', paymentLink);

        res.json({
            success: true,
            checkoutUrl: paymentLink.checkoutUrl || paymentLink.data?.checkoutUrl,
            orderCode
        });

    } catch (error) {
        console.error('PayOS create error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || "Không thể tạo link thanh toán" 
        });
    }
});

// ==================== KIỂM TRA TRẠNG THÁI ====================
router.get('/status/:orderCode', async (req, res) => {
    try {
        const orderCode = Number(req.params.orderCode);
        const data = await payos.paymentRequests.get(orderCode);

        res.json({ 
            success: true, 
            status: data.status || data.data?.status, 
            data 
        });
    } catch (error) {
        console.error('PayOS status error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ==================== WEBHOOK ====================
router.post('/webhook', async (req, res) => {
    try {
        const data = payos.verifyPaymentWebhookData(req.body);
        console.log("PayOS Webhook received:", data);

        // TODO: Cập nhật trạng thái đơn hàng trong Database tại đây
        // Ví dụ: if (data.status === "PAID") { updateOrder(orderCode, "paid"); }

        res.json({ success: true });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(400).json({ success: false });
    }
});

module.exports = router;