const { PayOS } = require('@payos/node');

const payos = new PayOS({
    clientId: process.env.PAYOS_CLIENT_ID,
    apiKey: process.env.PAYOS_API_KEY,
    checksumKey: process.env.PAYOS_CHECKSUM_KEY
});

exports.createPaymentLink = async (req, res) => {
    try {
        const { amount, items } = req.body;
        if (!amount || amount <= 0) return res.status(400).json({ success: false, message: "Số tiền không hợp lệ" });
        
        const timestamp = Math.floor(Date.now() / 1000);
        const orderCode = timestamp * 1000000 + Math.floor(Math.random() * 999999);
        const paymentData = {
            orderCode, amount: Math.round(amount),
            description: `Cafe ${orderCode}`.slice(0, 25),
            items: items || [],
            cancelUrl: `${process.env.BASE_URL}/user/payment/html/payment.html`,
            returnUrl: `${process.env.BASE_URL}/user/payment/html/payment.html`,
        };
        const paymentLink = await payos.paymentRequests.create(paymentData);
        res.json({ success: true, checkoutUrl: paymentLink.checkoutUrl || paymentLink.data?.checkoutUrl, orderCode });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getPaymentStatus = async (req, res) => {
    try {
        const orderCode = Number(req.params.orderCode);
        const data = await payos.paymentRequests.get(orderCode);
        res.json({ success: true, status: data.status || data.data?.status, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.handleWebhook = async (req, res) => {
    try {
        const data = payos.verifyPaymentWebhookData(req.body);
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ success: false });
    }
};
