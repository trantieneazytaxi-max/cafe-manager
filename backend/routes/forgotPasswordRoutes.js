const express = require('express');
const router = express.Router();
const { executeQuery, sql } = require('../config/js/db');
const bcrypt = require('bcryptjs');
const { sendOTPEmail } = require('../utils/emailService');

// ========== 1. Gửi yêu cầu quên mật khẩu (Staff/Admin) ==========
router.post('/request', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ message: 'Vui lòng nhập email' });
        }
        
        // Kiểm tra email có tồn tại không
        const userResult = await executeQuery(
            'SELECT user_id, full_name, email, role FROM Users WHERE email = @email',
            { email: email }
        );
        
        if (userResult.recordset.length === 0) {
            return res.status(404).json({ message: 'Email không tồn tại trong hệ thống' });
        }
        
        const user = userResult.recordset[0];
        
        // Tạo yêu cầu reset trong bảng PasswordResets
        const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24); // Hết hạn sau 24 giờ
        
        await executeQuery(`
            INSERT INTO PasswordResets (user_id, token, status, created_at)
            VALUES (@userId, @token, 'pending', GETDATE())
        `, {
            userId: user.user_id,
            token: resetToken
        });
        
        // Gửi email thông báo cho Admin (hoặc gửi link reset)
        const adminEmail = 'admin@cafe.com'; // Email admin nhận thông báo
        
        const resetLink = `http://localhost:5500/frontend/admin/reset-password/html/reset-password.html?token=${resetToken}&email=${encodeURIComponent(email)}`;
        
        await sendOTPEmail(adminEmail, `
            <h3>Yêu cầu đặt lại mật khẩu</h3>
            <p>Nhân viên/Admin <strong>${user.full_name}</strong> (${email}) vừa yêu cầu đặt lại mật khẩu.</p>
            <p>Vui lòng click vào link bên dưới để đặt lại mật khẩu:</p>
            <a href="${resetLink}" style="background: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Đặt lại mật khẩu</a>
            <p>Link có hiệu lực trong 24 giờ.</p>
            <p>Nếu bạn không yêu cầu điều này, vui lòng bỏ qua email.</p>
        `, 'forgot_password');
        
        res.json({ 
            success: true, 
            message: 'Yêu cầu đặt lại mật khẩu đã được gửi đến quản trị viên. Vui lòng chờ xử lý.' 
        });
        
    } catch (error) {
        console.error('Lỗi request reset password:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// ========== 2. Reset mật khẩu (Admin thực hiện) ==========
router.post('/reset', async (req, res) => {
    try {
        const { token, email, new_password } = req.body;
        
        if (!token || !email || !new_password) {
            return res.status(400).json({ message: 'Thiếu thông tin' });
        }
        
        if (new_password.length < 6) {
            return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự' });
        }
        
        // Kiểm tra token
        const tokenResult = await executeQuery(`
            SELECT pr.* FROM PasswordResets pr
            JOIN Users u ON pr.user_id = u.user_id
            WHERE u.email = @email AND pr.token = @token AND pr.status = 'pending'
        `, { email: email, token: token });
        
        if (tokenResult.recordset.length === 0) {
            return res.status(400).json({ message: 'Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn' });
        }
        
        // Mã hóa mật khẩu mới
        const hashedPassword = await bcrypt.hash(new_password, 10);
        
        // Cập nhật mật khẩu
        await executeQuery(
            'UPDATE Users SET password_hash = @password WHERE email = @email',
            { password: hashedPassword, email: email }
        );
        
        // Đánh dấu token đã sử dụng
        await executeQuery(`
            UPDATE pr SET status = 'used', updated_at = GETDATE()
            FROM PasswordResets pr
            JOIN Users u ON pr.user_id = u.user_id
            WHERE u.email = @email AND pr.token = @token
        `, { email: email, token: token });
        
        // Gửi email thông báo cho user
        await sendOTPEmail(email, `
            <h3>Mật khẩu của bạn đã được thay đổi</h3>
            <p>Mật khẩu mới của bạn là: <strong style="color: #e94560; font-size: 18px;">${new_password}</strong></p>
            <p>Vui lòng đăng nhập lại và đổi mật khẩu để bảo mật hơn.</p>
            <p>Nếu bạn không thực hiện yêu cầu này, vui lòng liên hệ quản trị viên ngay lập tức.</p>
        `, 'forgot_password');
        
        res.json({ success: true, message: 'Mật khẩu đã được đặt lại thành công' });
        
    } catch (error) {
        console.error('Lỗi reset password:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// ========== 3. Admin lấy danh sách yêu cầu reset ==========
router.get('/requests', async (req, res) => {
    try {
        const result = await executeQuery(`
            SELECT pr.*, u.full_name, u.role, u.email
            FROM PasswordResets pr
            JOIN Users u ON pr.user_id = u.user_id
            WHERE pr.status = 'pending'
            ORDER BY pr.created_at DESC
        `);
        
        res.json(result.recordset);
    } catch (error) {
        console.error('Lỗi lấy requests:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

module.exports = router;