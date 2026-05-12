const nodemailer = require('nodemailer');
const { executeQuery } = require('../config/js/db');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

function generateOTP() { return Math.floor(100000 + Math.random() * 900000).toString(); }

async function sendEmail(to, otp) {
    const mailOptions = {
        from: `"Cà Phê Thông Minh" <${process.env.EMAIL_USER}>`,
        to: to,
        subject: '🔐 Mã xác thực đăng ký - Cà Phê Thông Minh',
        html: `<div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; background: #FFF8F0; border-radius: 16px;"><div style="text-align: center;"><div style="font-size: 48px;">☕</div><h2 style="color: #5C3A21;">Cà Phê Thông Minh</h2></div><p>Mã xác thực đăng ký tài khoản của bạn là:</p><div style="font-size: 32px; font-weight: bold; color: #E67E22; background: #F5E6D3; padding: 15px; text-align: center; border-radius: 12px;">${otp}</div><p>Mã có hiệu lực trong <strong>5 phút</strong>.</p><p style="color: #999; font-size: 12px; text-align: center;">© 2026 Cà Phê Thông Minh</p></div>`
    };
    try { await transporter.sendMail(mailOptions); return true; } catch (e) { return false; }
}

exports.sendOTP = async (req, res) => {
    try {
        const { email, purpose } = req.body;
        if (!email) return res.status(400).json({ message: 'Vui lòng nhập email' });
        const otpCode = generateOTP();
        await executeQuery(`INSERT INTO Otps (email, otp_code, purpose, expires_at, is_used, is_verified) VALUES (@email, @otp_code, @purpose, DATEADD(MINUTE, 5, GETDATE()), 0, 0)`, { email, otp_code: otpCode, purpose: purpose || 'register' });
        const sent = await sendEmail(email, otpCode);
        if (!sent) return res.status(500).json({ message: 'Gửi email thất bại' });
        res.json({ success: true, message: 'OTP đã được gửi' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.verifyOTP = async (req, res) => {
    try {
        const { email, otp_code, purpose } = req.body;
        const result = await executeQuery(`SELECT * FROM Otps WHERE email=@email AND otp_code=@otp_code AND purpose=@purpose AND is_used=0 AND expires_at > GETDATE()`, { email, otp_code, purpose: purpose || 'register' });
        if (result.recordset.length === 0) return res.status(400).json({ message: 'Mã không đúng hoặc hết hạn' });
        await executeQuery(`UPDATE Otps SET is_verified=1, is_used=1 WHERE email=@email AND otp_code=@otp_code`, { email, otp_code });
        res.json({ success: true, message: 'Xác thực thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.resendOTP = async (req, res) => {
    try {
        const { email, purpose } = req.body;
        const otpCode = generateOTP();
        await executeQuery(`INSERT INTO Otps (email, otp_code, purpose, expires_at, is_used, is_verified) VALUES (@email, @otp_code, @purpose, DATEADD(MINUTE, 5, GETDATE()), 0, 0)`, { email, otp_code: otpCode, purpose: purpose || 'register' });
        const sent = await sendEmail(email, otpCode);
        if (!sent) return res.status(500).json({ message: 'Gửi email thất bại' });
        res.json({ success: true, message: 'Đã gửi lại OTP' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};
