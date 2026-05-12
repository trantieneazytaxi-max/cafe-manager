const { executeQuery } = require('../config/js/db');
const bcrypt = require('bcryptjs');
const { sendOTPEmail } = require('../utils/emailService');

exports.requestReset = async (req, res) => {
    try {
        const { email } = req.body;
        const userResult = await executeQuery('SELECT user_id, full_name, email FROM Users WHERE email = @email', { email });
        if (userResult.recordset.length === 0) return res.status(404).json({ message: 'Email không tồn tại' });
        const user = userResult.recordset[0];
        const token = Math.random().toString(36).substring(2, 15);
        await executeQuery(`INSERT INTO PasswordResets (user_id, token, status, created_at) VALUES (@userId, @token, 'pending', GETDATE())`, { userId: user.user_id, token });
        const resetLink = `http://localhost:5000/admin/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
        await sendOTPEmail('admin@cafe.com', `<h3>Yêu cầu reset mật khẩu</h3><p>${user.full_name} (${email}) yêu cầu reset mật khẩu.</p><a href="${resetLink}">Reset ngay</a>`, 'forgot_password');
        res.json({ success: true, message: 'Đã gửi yêu cầu tới Admin' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { token, email, new_password } = req.body;
        const tokenResult = await executeQuery(`SELECT pr.* FROM PasswordResets pr JOIN Users u ON pr.user_id = u.user_id WHERE u.email = @email AND pr.token = @token AND pr.status = 'pending'`, { email, token });
        if (tokenResult.recordset.length === 0) return res.status(400).json({ message: 'Token không hợp lệ' });
        const hashedPassword = await bcrypt.hash(new_password, 10);
        await executeQuery('UPDATE Users SET password_hash = @password WHERE email = @email', { password: hashedPassword, email });
        await executeQuery(`UPDATE pr SET status = 'used', updated_at = GETDATE() FROM PasswordResets pr JOIN Users u ON pr.user_id = u.user_id WHERE u.email = @email AND pr.token = @token`, { email, token });
        await sendOTPEmail(email, `<h3>Mật khẩu mới</h3><p>Mật khẩu mới: <strong>${new_password}</strong></p>`, 'forgot_password');
        res.json({ success: true, message: 'Đã reset mật khẩu' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.getRequests = async (req, res) => {
    try {
        const result = await executeQuery(`SELECT pr.*, u.full_name, u.role, u.email FROM PasswordResets pr JOIN Users u ON pr.user_id = u.user_id WHERE pr.status = 'pending' ORDER BY pr.created_at DESC`);
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};
