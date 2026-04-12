const nodemailer = require('nodemailer');

// Cấu hình transporter với SMTP
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false, // false cho port 587, true cho port 465
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Kiểm tra kết nối
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ Lỗi kết nối email:', error);
    } else {
        console.log('✅ Email service sẵn sàng!');
    }
});

/**
 * Gửi OTP qua email thật
 * @param {string} to - Email người nhận
 * @param {string} otp - Mã OTP
 * @param {string} purpose - Mục đích
 */
async function sendOTPEmail(to, otp, purpose = 'register') {
    let subject = '';
    let html = '';
    
    switch (purpose) {
        case 'register':
            subject = '🔐 Xác thực đăng ký tài khoản - Cà Phê Thông Minh';
            html = generateRegisterEmail(otp);
            break;
        case 'login':
            subject = '🔐 Mã xác thực đăng nhập - Cà Phê Thông Minh';
            html = generateLoginEmail(otp);
            break;
        case 'forgot_password':
            subject = '🔐 Khôi phục mật khẩu - Cà Phê Thông Minh';
            html = generateForgotPasswordEmail(otp);
            break;
        default:
            subject = '🔐 Mã xác thực - Cà Phê Thông Minh';
            html = generateDefaultEmail(otp);
    }
    
    const mailOptions = {
        from: `"Cà Phê Thông Minh" <${process.env.EMAIL_USER}>`,
        to: to,
        subject: subject,
        html: html
    };
    
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`📧 Email đã gửi đến ${to}: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Lỗi gửi email:', error);
        return { success: false, error: error.message };
    }
}

// Template email đăng ký
function generateRegisterEmail(otp) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Xác thực đăng ký</title>
        </head>
        <body style="font-family: 'Inter', Arial, sans-serif; background: #FFF8F0; padding: 40px;">
            <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 24px; padding: 32px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 24px;">
                    <div style="background: #F5E6D3; width: 60px; height: 60px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                        <span style="font-size: 30px;">☕</span>
                    </div>
                    <h1 style="color: #5C3A21; margin-top: 16px;">Cà Phê Thông Minh</h1>
                    <p style="color: #8B7355;">Xác thực đăng ký tài khoản</p>
                </div>
                
                <div style="background: #F5E6D3; border-radius: 16px; padding: 24px; text-align: center;">
                    <p style="color: #5C3A21; margin-bottom: 16px;">Mã xác thực của bạn là:</p>
                    <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #E67E22; background: white; padding: 16px; border-radius: 12px; display: inline-block;">
                        ${otp}
                    </div>
                    <p style="color: #8B7355; margin-top: 16px; font-size: 14px;">Mã có hiệu lực trong <strong>5 phút</strong></p>
                </div>
                
                <div style="margin-top: 24px; text-align: center;">
                    <p style="color: #8B7355; font-size: 12px;">Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.</p>
                    <p style="color: #8B7355; font-size: 12px;">© 2026 Cà Phê Thông Minh - Nơi tinh hoa cà phê hội tụ</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

function generateLoginEmail(otp) {
    return `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; background: #FFF8F0; border-radius: 16px;">
            <div style="text-align: center;">
                <div style="font-size: 48px;">☕</div>
                <h2 style="color: #5C3A21;">Cà Phê Thông Minh</h2>
            </div>
            <p>Mã xác thực đăng nhập của bạn là:</p>
            <div style="font-size: 32px; font-weight: bold; color: #E67E22; background: #F5E6D3; padding: 15px; text-align: center; border-radius: 12px;">${otp}</div>
            <p>Mã có hiệu lực trong 5 phút.</p>
            <hr>
            <p style="color: #999; font-size: 12px; text-align: center;">Cà Phê Thông Minh - Nơi tinh hoa cà phê hội tụ</p>
        </div>
    `;
}

function generateForgotPasswordEmail(otp) {
    return `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; background: #FFF8F0; border-radius: 16px;">
            <div style="text-align: center;">
                <div style="font-size: 48px;">🔑</div>
                <h2 style="color: #5C3A21;">Cà Phê Thông Minh</h2>
            </div>
            <p>Mã xác thực khôi phục mật khẩu của bạn là:</p>
            <div style="font-size: 32px; font-weight: bold; color: #E67E22; background: #F5E6D3; padding: 15px; text-align: center; border-radius: 12px;">${otp}</div>
            <p>Mã có hiệu lực trong 5 phút.</p>
            <hr>
            <p style="color: #999; font-size: 12px; text-align: center;">Cà Phê Thông Minh</p>
        </div>
    `;
}

function generateDefaultEmail(otp) {
    return `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #E67E22;">☕ Cà Phê Thông Minh</h2>
            <p>Mã xác thực của bạn là:</p>
            <div style="font-size: 32px; font-weight: bold; color: #E67E22; background: #f4f4f4; padding: 15px; text-align: center;">${otp}</div>
            <p>Mã có hiệu lực trong 5 phút.</p>
        </div>
    `;
}

module.exports = { sendOTPEmail };