const express = require('express');
const router = express.Router();
const { executeQuery, sql } = require('../config/js/db');
const { verifyToken, isStaff } = require('../middleware/authMiddleware');

router.use(verifyToken);
router.use(isStaff);

// 🆕 Thống kê đơn hàng cho dashboard (Move BEFORE /:orderId)
router.get('/stats', async (req, res) => {
    try {
        const stats = await executeQuery(`
            SELECT 
                (SELECT COUNT(*) FROM Orders WHERE status = 'pending') as pendingOrders,
                (SELECT COUNT(*) FROM Orders WHERE status = 'paid' AND CAST(created_at AS DATE) = CAST(GETDATE() AS DATE)) as completedOrders,
                (SELECT ISNULL(SUM(total_amount), 0) FROM Orders WHERE status = 'paid' AND CAST(created_at AS DATE) = CAST(GETDATE() AS DATE)) as todayRevenue
        `);
        
        res.json(stats.recordset[0]);
    } catch (error) {
        console.error('Lỗi lấy thống kê:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// 🆕 Lấy đơn hàng gần đây (giới hạn 5) (Move BEFORE /:orderId)
router.get('/recent', async (req, res) => {
    try {
        const result = await executeQuery(`
            SELECT TOP 5
                o.order_id,
                t.table_number,
                o.total_amount,
                o.status,
                o.created_at
            FROM Orders o
            LEFT JOIN Tables t ON o.table_id = t.table_id
            ORDER BY o.created_at DESC
        `);
        
        res.json(result.recordset);
    } catch (error) {
        console.error('Lỗi lấy orders gần đây:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// Lấy tất cả đơn hàng (cho staff)
router.get('/', async (req, res) => {
    try {
        const result = await executeQuery(`
            SELECT 
                o.order_id,
                o.order_code,
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
router.get('/:orderId(\\d+)', async (req, res) => {
    try {
        const { orderId } = req.params;
        
        // Thông tin đơn hàng
        const orderResult = await executeQuery(`
            SELECT 
                o.order_id,
                o.order_code,
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

// Xác nhận đơn hàng (chuyển từ pending -> paid) và tích điểm cho khách
router.put('/:orderId(\\d+)/confirm', async (req, res) => {
    try {
        const { orderId } = req.params;
        
        // 1. Lấy thông tin đơn hàng để biết user_id và total_amount
        const orderResult = await executeQuery(`
            SELECT user_id, total_amount, status FROM Orders WHERE order_id = @orderId
        `, { orderId: orderId });
        
        if (orderResult.recordset.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
        }
        
        const order = orderResult.recordset[0];
        
        if (order.status === 'paid') {
            return res.status(400).json({ message: 'Đơn hàng đã được thanh toán trước đó' });
        }

        // 2. Cập nhật trạng thái đơn hàng
        await executeQuery(`
            UPDATE Orders 
            SET status = 'paid', updated_at = GETDATE()
            WHERE order_id = @orderId AND status = 'pending'
        `, { orderId: orderId });
        
        // 3. Tích điểm cho khách hàng (1 điểm mỗi 10,000đ)
        if (order.user_id) {
            const pointsToAdd = Math.floor(order.total_amount / 10000);
            if (pointsToAdd > 0) {
                await executeQuery(`
                    UPDATE Users 
                    SET loyalty_points = ISNULL(loyalty_points, 0) + @points
                    WHERE user_id = @userId
                `, { points: pointsToAdd, userId: order.user_id });
            }
        }
        
        res.json({ success: true, message: 'Đã xác nhận đơn hàng và tích điểm thành công' });
        
    } catch (error) {
        console.error('Lỗi xác nhận order:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

module.exports = router;