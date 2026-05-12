const { executeQuery } = require('../config/js/db');

exports.getStats = async (req, res) => {
    try {
        const stats = await executeQuery(`SELECT (SELECT COUNT(*) FROM Orders WHERE status = 'pending') as pendingOrders, (SELECT COUNT(*) FROM Orders WHERE status IN ('paid', 'completed') AND CAST(created_at AS DATE) = CAST(GETDATE() AS DATE)) as completedOrders, (SELECT ISNULL(SUM(total_amount), 0) FROM Orders WHERE status IN ('paid', 'completed') AND CAST(created_at AS DATE) = CAST(GETDATE() AS DATE)) as todayRevenue`);
        res.json(stats.recordset[0]);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.getRecentOrders = async (req, res) => {
    try {
        const result = await executeQuery(`SELECT TOP 5 o.order_id, t.table_number, o.total_amount, o.status, o.created_at FROM Orders o LEFT JOIN Tables t ON o.table_id = t.table_id ORDER BY o.created_at DESC`);
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.getAllOrders = async (req, res) => {
    try {
        const result = await executeQuery(`SELECT o.order_id, o.order_code, o.table_id, t.table_number, o.total_amount, o.status, o.created_at, o.note, o.order_type, o.guest_name, o.guest_phone, o.delivery_address, o.discount_amount, u.full_name as customer_name FROM Orders o LEFT JOIN Tables t ON o.table_id = t.table_id LEFT JOIN Users u ON o.user_id = u.user_id ORDER BY o.created_at DESC`);
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.getOrderDetail = async (req, res) => {
    try {
        const { orderId } = req.params;
        const orderResult = await executeQuery(`SELECT o.order_id, o.order_code, o.table_id, t.table_number, o.total_amount, o.status, o.created_at, o.note, o.order_type, o.guest_name, o.guest_phone, o.delivery_address, o.discount_amount, u.full_name as customer_name FROM Orders o LEFT JOIN Tables t ON o.table_id = t.table_id LEFT JOIN Users u ON o.user_id = u.user_id WHERE o.order_id = @orderId`, { orderId });
        if (orderResult.recordset.length === 0) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
        const itemsResult = await executeQuery(`SELECT oi.item_id, mi.item_name, oi.quantity, oi.unit_price, (oi.quantity * oi.unit_price) as subtotal FROM Order_Items oi JOIN Menu_Items mi ON oi.item_id = mi.item_id WHERE oi.order_id = @orderId`, { orderId });
        res.json({ ...orderResult.recordset[0], items: itemsResult.recordset });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.confirmOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const orderResult = await executeQuery(`SELECT user_id, total_amount, status FROM Orders WHERE order_id = @orderId`, { orderId });
        if (orderResult.recordset.length === 0) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
        const order = orderResult.recordset[0];
        if (order.status === 'paid') return res.status(400).json({ message: 'Đã thanh toán trước đó' });
        
        await executeQuery(`UPDATE Orders SET status = 'paid', updated_at = GETDATE() WHERE order_id = @orderId AND status = 'pending'`, { orderId });
        if (order.user_id) {
            const pointsToAdd = Math.floor(order.total_amount / 10000);
            if (pointsToAdd > 0) await executeQuery(`UPDATE Users SET loyalty_points = ISNULL(loyalty_points, 0) + @points WHERE user_id = @userId`, { points: pointsToAdd, userId: order.user_id });
        }
        res.json({ success: true, message: 'Đã xác nhận đơn hàng' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;
        await executeQuery(`UPDATE Orders SET status = @status, updated_at = GETDATE() WHERE order_id = @orderId`, { status, orderId });
        res.json({ success: true, message: 'Cập nhật trạng thái thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};
