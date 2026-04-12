const express = require('express');
const router = express.Router();
const { executeQuery, sql } = require('../config/js/db');
const { verifyToken, isStaff } = require('../middleware/authMiddleware');

router.use(verifyToken);
router.use(isStaff);

// Lấy tất cả đơn hàng (cho staff)
router.get('/', async (req, res) => {
    try {
        const result = await executeQuery(`
            SELECT 
                o.order_id,
                o.table_id,
                t.table_number,
                o.total_amount,
                o.status,
                o.created_at,
                o.note,
                u.full_name as customer_name
            FROM Orders o
            LEFT JOIN Tables t ON o.table_id = t.table_id
            LEFT JOIN Users u ON o.user_id = u.user_id
            ORDER BY o.created_at DESC
        `);
        
        res.json(result.recordset);
    } catch (error) {
        console.error('Lỗi lấy orders:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// Lấy chi tiết đơn hàng
router.get('/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        
        // Thông tin đơn hàng
        const orderResult = await executeQuery(`
            SELECT 
                o.order_id,
                o.table_id,
                t.table_number,
                o.total_amount,
                o.status,
                o.created_at,
                o.note,
                u.full_name as customer_name
            FROM Orders o
            LEFT JOIN Tables t ON o.table_id = t.table_id
            LEFT JOIN Users u ON o.user_id = u.user_id
            WHERE o.order_id = @orderId
        `, { orderId: orderId });
        
        if (orderResult.recordset.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
        }
        
        // Chi tiết món
        const itemsResult = await executeQuery(`
            SELECT 
                oi.item_id,
                mi.item_name,
                oi.quantity,
                oi.unit_price,
                (oi.quantity * oi.unit_price) as subtotal
            FROM Order_Items oi
            JOIN Menu_Items mi ON oi.item_id = mi.item_id
            WHERE oi.order_id = @orderId
        `, { orderId: orderId });
        
        res.json({
            ...orderResult.recordset[0],
            items: itemsResult.recordset
        });
        
    } catch (error) {
        console.error('Lỗi lấy chi tiết order:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// Xác nhận đơn hàng (chuyển từ pending -> paid)
router.put('/:orderId/confirm', async (req, res) => {
    try {
        const { orderId } = req.params;
        
        await executeQuery(`
            UPDATE Orders 
            SET status = 'paid', updated_at = GETDATE()
            WHERE order_id = @orderId AND status = 'pending'
        `, { orderId: orderId });
        
        res.json({ success: true, message: 'Đã xác nhận đơn hàng' });
        
    } catch (error) {
        console.error('Lỗi xác nhận order:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

module.exports = router;