const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { executeQuery, sql } = require('../config/js/db');
const { verifyToken } = require('../middleware/authMiddleware');  // 🆕 THÊM IMPORT

// Đăng ký
router.post('/register', async (req, res) => {
    try {
        const { full_name, email, phone, password, role } = req.body;
        
        console.log('Register request:', { full_name, email, phone, role });
        
        // Kiểm tra email đã tồn tại
        const checkUser = await executeQuery(
            'SELECT * FROM Users WHERE email = @email',
            { email: email }
        );
        
        if (checkUser.recordset.length > 0) {
            return res.status(400).json({ message: 'Email đã tồn tại' });
        }
        
        // Mã hóa mật khẩu
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Tạo user mới
        const userResult = await executeQuery(
            `INSERT INTO Users (full_name, email, phone, password_hash, role, is_active) 
             OUTPUT INSERTED.user_id
             VALUES (@full_name, @email, @phone, @password_hash, @role, 1)`,
            {
                full_name: full_name,
                email: email,
                phone: phone,
                password_hash: hashedPassword,
                role: role || 'customer'
            }
        );

        const newUserId = userResult.recordset[0].user_id;

        // 🆕 Tặng mã giảm giá cho thành viên mới (nếu có)
        try {
            const welcomeCode = await executeQuery(`
                SELECT TOP 1 code_id FROM DiscountCodes 
                WHERE type = 'new_member' AND is_active = 1 
                AND (usage_limit IS NULL OR usage_count < usage_limit)
                AND (expiry_date IS NULL OR expiry_date > GETDATE())
            `);

            if (welcomeCode.recordset.length > 0) {
                await executeQuery(`
                    INSERT INTO UserDiscounts (user_id, code_id) 
                    VALUES (@userId, @codeId)
                `, { userId: newUserId, codeId: welcomeCode.recordset[0].code_id });
            }
        } catch (couponError) {
            console.error('Lỗi tặng coupon thành viên mới:', couponError);
        }
        
        res.json({ success: true, message: 'Đăng ký thành công' });
        
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'Lỗi server: ' + error.message });
    }
});

// Đăng nhập
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const result = await executeQuery(
            'SELECT * FROM Users WHERE email = @email',
            { email: email }
        );
        
        const user = result.recordset[0];
        
        if (!user) {
            return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
        }
        
        // Kiểm tra tài khoản có bị vô hiệu hóa không
        if (user.is_active === 0) {
            return res.status(403).json({ message: 'Tài khoản của bạn đã bị vô hiệu hóa! Vui lòng liên hệ quản trị viên để được hỗ trợ.' });
        }
        
        const isValid = await bcrypt.compare(password, user.password_hash);
        
        if (!isValid) {
            return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
        }
        
        const token = jwt.sign(
            { userId: user.user_id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'my_secret_key',
            { expiresIn: '7d' }
        );
        
        res.json({
            success: true,
            token: token,
            user: {
                user_id: user.user_id,
                full_name: user.full_name,
                email: user.email,
                role: user.role,
                avatar_url: user.avatar_url || null
            }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Lỗi server: ' + error.message });
    }
});

// Kiểm tra trạng thái tài khoản (cho staff)
router.get('/check-status', verifyToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        
        console.log('🔍 Check status for user ID:', userId);
        
        const result = await executeQuery(
            'SELECT is_active FROM Users WHERE user_id = @userId',
            { userId: userId }
        );
        
        console.log('📊 Query result:', result.recordset);
        
        if (result.recordset.length === 0) {
            console.log('❌ User not found');
            return res.status(403).json({ message: 'Tài khoản không tồn tại' });
        }
        
        const isActive = result.recordset[0].is_active;
        console.log('✅ is_active =', isActive, 'type:', typeof isActive);
        
        // 🆕 SỬA: So sánh đúng với false hoặc 0
        if (isActive === false || isActive === 0) {
            console.log('🚫 Account is deactivated!');
            return res.status(403).json({ message: 'Tài khoản đã bị vô hiệu hóa' });
        }
        
        res.json({ success: true, is_active: true });
        
    } catch (error) {
        console.error('Check status error:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

module.exports = router;