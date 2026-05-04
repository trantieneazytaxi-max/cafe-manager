const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

/**
 * Gửi hóa đơn qua email
 * @param {Object} orderInfo - Thông tin đơn hàng
 * @param {Array} items - Danh sách món
 */
async function sendInvoiceEmail(orderInfo, items) {
    try {
        if (!orderInfo.email && !orderInfo.guest_email) {
            console.log('No email provided for order:', orderInfo.order_id);
            return;
        }

        const targetEmail = orderInfo.email || orderInfo.guest_email;
        const storeName = process.env.STORE_NAME || 'Cà Phê Thông Minh';
        
        const itemsHtml = items.map(item => `
            <tr>
                <td style="padding: 10px; border-bottom: 1px dashed #eee;">${item.item_name} x ${item.quantity}</td>
                <td style="padding: 10px; border-bottom: 1px dashed #eee; text-align: right;">${(item.unit_price * item.quantity).toLocaleString('vi-VN')}đ</td>
            </tr>
        `).join('');

        const total = orderInfo.total_amount || 0;
        const discount = orderInfo.discount_amount || 0;
        const shipping = orderInfo.shipping_fee || 0;
        const finalTotal = total + shipping;

        const html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #6f4e37; margin-bottom: 5px;">${storeName}</h1>
                <p style="color: #888; font-size: 14px;">Cảm ơn bạn đã ủng hộ chúng tôi!</p>
            </div>
            
            <div style="background: #fdfaf8; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="margin-top: 0; color: #333;">Hóa đơn #${orderInfo.order_code}</h3>
                <p style="margin: 5px 0; font-size: 14px;">Ngày: ${new Date(orderInfo.created_at).toLocaleString('vi-VN')}</p>
                <p style="margin: 5px 0; font-size: 14px;">Khách hàng: ${orderInfo.full_name || orderInfo.guest_name || 'Khách hàng'}</p>
            </div>

            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: #f8f8f8;">
                        <th style="padding: 10px; text-align: left;">Món đã gọi</th>
                        <th style="padding: 10px; text-align: right;">Giá</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>

            <div style="margin-top: 20px; text-align: right; line-height: 1.8;">
                <p style="margin: 0;">Tạm tính: <b>${total.toLocaleString('vi-VN')}đ</b></p>
                ${discount > 0 ? `<p style="margin: 0; color: #d9534f;">Giảm giá: <b>-${discount.toLocaleString('vi-VN')}đ</b></p>` : ''}
                ${shipping > 0 ? `<p style="margin: 0;">Phí giao hàng: <b>+${shipping.toLocaleString('vi-VN')}đ</b></p>` : ''}
                <hr style="border: none; border-top: 2px solid #6f4e37; margin: 10px 0 10px auto; width: 50%;">
                <h2 style="margin: 0; color: #6f4e37;">Tổng cộng: ${finalTotal.toLocaleString('vi-VN')}đ</h2>
            </div>

            <div style="margin-top: 30px; text-align: center; color: #888; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px;">
                <p>Mọi thắc mắc vui lòng liên hệ hotline: ${process.env.STORE_PHONE || '0123.456.789'}</p>
                <p>Hẹn gặp lại bạn sớm!</p>
            </div>
        </div>
        `;

        await transporter.sendMail({
            from: `"${storeName}" <${process.env.EMAIL_USER}>`,
            to: targetEmail,
            subject: `Hóa đơn đơn hàng #${orderInfo.order_code} - ${storeName}`,
            html: html
        });

        console.log('Invoice email sent to:', targetEmail);
    } catch (error) {
        console.error('Error sending invoice email:', error);
    }
}

module.exports = { sendInvoiceEmail };
