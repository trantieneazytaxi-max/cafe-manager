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
            SELECT user_id, full_name, email, phone, role, is_active, created_at, loyalty_points,
                   delivery_address, delivery_lat, delivery_lng, auto_fill_address

            FROM Users 
            WHERE user_id = @userId
        `, { userId: userId });
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }
        const row = result.recordset[0];
        res.json({
            ...row,
            delivery_lat: row.delivery_lat != null ? Number(row.delivery_lat) : null,
            delivery_lng: row.delivery_lng != null ? Number(row.delivery_lng) : null
        });
    } catch (error) {
        console.error('Lỗi lấy profile:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// Cập nhật địa chỉ giao hàng (Google Places)
router.put('/profile/address', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { delivery_address, delivery_lat, delivery_lng, auto_fill_address } = req.body;
        await executeQuery(`
            UPDATE Users SET
                delivery_address = @delivery_address,
                delivery_lat = @delivery_lat,
                delivery_lng = @delivery_lng,
                auto_fill_address = @auto_fill,
                updated_at = GETDATE()
            WHERE user_id = @userId
        `, {
            userId,
            delivery_address: delivery_address || null,
            delivery_lat: delivery_lat != null && delivery_lat !== '' ? Number(delivery_lat) : null,
            delivery_lng: delivery_lng != null && delivery_lng !== '' ? Number(delivery_lng) : null,
            auto_fill: auto_fill_address === false ? 0 : 1
        });

        res.json({ success: true, message: 'Đã lưu địa chỉ' });
    } catch (error) {
        console.error('Lỗi cập nhật địa chỉ:', error);
        res.status(500).json({ message: 'Lỗi server (chạy node migrate_user_address.js nếu thiếu cột)' });
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
