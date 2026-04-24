const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/js/db');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);

// Lấy thông tin cá nhân
router.get('/profile', async (req, res) => {
    try {
        const userId = req.user.userId;
        const result = await executeQuery(`
            SELECT user_id, full_name, email, phone, role, is_active, created_at, loyalty_points 
            FROM Users 
            WHERE user_id = @userId
        `, { userId: userId });
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }
        res.json(result.recordset[0]);
    } catch (error) {
        console.error('Lỗi lấy profile:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// Lấy lịch sử đơn hàng của chính mình
router.get('/orders', async (req, res) => {
    try {
        const userId = req.user.userId;
        
        const result = await executeQuery(`
            SELECT 
                o.order_id,
                o.order_code,
                o.table_id,
                t.table_number,
                o.total_amount,
                o.status,
                o.created_at,
                o.note
            FROM Orders o
            LEFT JOIN Tables t ON o.table_id = t.table_id
            WHERE o.user_id = @userId
            ORDER BY o.created_at DESC
        `, { userId: userId });
        
        res.json(result.recordset);
    } catch (error) {
        console.error('Lỗi lấy lịch sử orders:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// Lấy thông tin điểm tích lũy
router.get('/loyalty', async (req, res) => {
    try {
        const userId = req.user.userId;
        
        const result = await executeQuery(`
            SELECT loyalty_points FROM Users WHERE user_id = @userId
        `, { userId: userId });
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }
        
        res.json({ loyalty_points: result.recordset[0].loyalty_points || 0 });
    } catch (error) {
        console.error('Lỗi lấy điểm tích lũy:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

module.exports = router;
