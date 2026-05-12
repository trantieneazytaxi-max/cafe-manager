const { executeQuery, sql, getConnection } = require('../config/js/db');
const { sendInvoiceEmail } = require('../services/emailService');

function generateOrderCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 4; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    return `#CM-${code}`;
}

exports.createOrder = async (req, res) => {
    try {
        const { table_id, items, payment_method, total_amount, discount_id, discount_amount, order_type, guest_name, guest_phone, guest_email, delivery_address, lat, lng, distance_km, shipping_fee, note } = req.body;
        const user_id = req.user ? req.user.userId : null;
        if (!items || items.length === 0) return res.status(400).json({ message: 'Giỏ hàng trống' });
        
        const pool = await getConnection();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        try {
            let orderCode = generateOrderCode();
            const status = payment_method === 'cash' ? 'pending' : 'paid';
            const orderResult = await transaction.request()
                .input('table_id', sql.Int, table_id || null).input('user_id', sql.Int, user_id)
                .input('total_amount', sql.Decimal(10,2), total_amount).input('status', sql.NVarChar(20), status)
                .input('note', sql.NVarChar(255), note || null).input('order_code', sql.NVarChar(20), orderCode)
                .input('discount_id', sql.Int, discount_id || null).input('discount_amount', sql.Decimal(10,2), discount_amount || 0)
                .input('order_type', sql.NVarChar(20), order_type || 'dine-in').input('guest_name', sql.NVarChar(100), guest_name || null)
                .input('guest_phone', sql.NVarChar(20), guest_phone || null).input('guest_email', sql.NVarChar(100), guest_email || null)
                .input('delivery_address', sql.NVarChar(255), delivery_address || null).input('lat', sql.Decimal(10, 8), lat || null)
                .input('lng', sql.Decimal(11, 8), lng || null).input('distance_km', sql.Decimal(10, 2), distance_km || 0).input('shipping_fee', sql.Decimal(10, 2), shipping_fee || 0)
                .query(`INSERT INTO Orders (table_id, user_id, total_amount, status, note, created_at, order_code, discount_id, discount_amount, order_type, guest_name, guest_phone, guest_email, delivery_address, lat, lng, distance_km, shipping_fee) OUTPUT INSERTED.order_id, INSERTED.order_code VALUES (@table_id, @user_id, @total_amount, @status, @note, GETDATE(), @order_code, @discount_id, @discount_amount, @order_type, @guest_name, @guest_phone, @guest_email, @delivery_address, @lat, @lng, @distance_km, @shipping_fee)`);
            
            const orderId = orderResult.recordset[0].order_id;
            const finalOrderCode = orderResult.recordset[0].order_code;
            
            for (const item of items) {
                const customizations = (item.size_id || item.temp_id) ? JSON.stringify({ size_id: item.size_id, temp_id: item.temp_id }) : null;
                await transaction.request().input('order_id', sql.Int, orderId).input('item_id', sql.Int, item.item_id).input('quantity', sql.Int, item.quantity).input('unit_price', sql.Decimal(10,2), item.price).input('cust', sql.NVarChar, customizations).query(`INSERT INTO Order_Items (order_id, item_id, quantity, unit_price, customizations) VALUES (@order_id, @item_id, @quantity, @unit_price, @cust)`);
            }

            const discount_ids = req.body.discount_ids || (discount_id ? [discount_id] : []);
            for (const dId of discount_ids) {
                await transaction.request().input('code_id', sql.Int, dId).input('userId', sql.Int, user_id).query(`UPDATE DiscountCodes SET usage_count = usage_count + 1 WHERE code_id = @code_id; IF @userId IS NOT NULL BEGIN IF EXISTS (SELECT 1 FROM UserDiscounts WHERE user_id = @userId AND code_id = @code_id) UPDATE UserDiscounts SET used_at = GETDATE() WHERE user_id = @userId AND code_id = @code_id; ELSE INSERT INTO UserDiscounts (user_id, code_id, used_at) VALUES (@userId, @code_id, GETDATE()); END`);
            }
            
            let actualPaymentMethod = payment_method === 'payos' ? 'vietqr' : payment_method;
            await transaction.request().input('order_id', sql.Int, orderId).input('payment_method', sql.NVarChar(20), actualPaymentMethod).input('amount', sql.Decimal(10,2), total_amount).query(`INSERT INTO Payments (order_id, payment_method, amount, paid_at) VALUES (@order_id, @payment_method, @amount, GETDATE())`);
            if (table_id) await transaction.request().input('table_id', sql.Int, table_id).query(`UPDATE Tables SET status = 'occupied' WHERE table_id = @table_id`);
            
            let earnedPoints = 0;
            if (user_id) {
                earnedPoints = Math.floor(total_amount / 10000);
                if (earnedPoints > 0) await transaction.request().input('user_id', sql.Int, user_id).input('points', sql.Int, earnedPoints).query(`UPDATE Users SET loyalty_points = ISNULL(loyalty_points, 0) + @points WHERE user_id = @user_id`);
            }
            await transaction.commit();
            
            // 🆕 Emit Socket.io event
            try {
                const io = require('../utils/socket').getIO();
                io.to('admin-room').to('staff-room').emit('new-order', {
                    order_id: orderId,
                    order_code: finalOrderCode,
                    total_amount: total_amount,
                    guest_name: guest_name || 'Khách vãng lai',
                    created_at: new Date()
                });
            } catch (socketError) {
                console.error('Socket emit error:', socketError);
            }

            res.json({ success: true, message: 'Đặt hàng thành công', order_id: orderId, order_code: finalOrderCode, earned_points: earnedPoints });
        } catch (error) {
            if (transaction && transaction.active) await transaction.rollback();
            throw error;
        }
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.getOrderHistory = async (req, res) => {
    try {
        const user_id = req.user.userId;
        const result = await executeQuery(`SELECT o.order_id, o.table_id, t.table_number, o.total_amount, o.status, o.created_at, o.order_code, o.order_type, p.payment_method, p.paid_at FROM Orders o LEFT JOIN Tables t ON o.table_id = t.table_id LEFT JOIN Payments p ON o.order_id = p.order_id WHERE o.user_id = @user_id ORDER BY o.created_at DESC`, { user_id });
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.getOrderDetail = async (req, res) => {
    try {
        const { orderId } = req.params;
        const user_id = req.user.userId;
        const orderResult = await executeQuery(`SELECT o.order_id, o.table_id, t.table_number, o.total_amount, o.status, o.note, o.created_at, o.order_code, o.order_type, o.delivery_address, p.payment_method, p.amount as paid_amount, p.paid_at FROM Orders o LEFT JOIN Tables t ON o.table_id = t.table_id LEFT JOIN Payments p ON o.order_id = p.order_id WHERE o.order_id = @orderId AND o.user_id = @user_id`, { orderId, user_id });
        if (orderResult.recordset.length === 0) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
        const itemsResult = await executeQuery(`SELECT oi.item_id, mi.item_name, oi.quantity, oi.unit_price, (oi.quantity * oi.unit_price) as subtotal FROM Order_Items oi JOIN Menu_Items mi ON oi.item_id = mi.item_id WHERE oi.order_id = @orderId`, { orderId });
        res.json({ order: orderResult.recordset[0], items: itemsResult.recordset });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.trackOrder = async (req, res) => {
    try {
        const { query } = req.params;
        const result = await executeQuery(`SELECT o.order_id, o.order_code, o.table_id, t.table_number, o.total_amount, o.status, o.order_type, o.guest_name, o.note, o.created_at, o.updated_at, (SELECT ISNULL(SUM(oi.quantity), 0) FROM Order_Items oi JOIN Orders oo ON oi.order_id = oo.order_id WHERE oo.status IN ('paid', 'confirmed', 'preparing')) as total_items_in_queue FROM Orders o LEFT JOIN Tables t ON o.table_id = t.table_id WHERE CAST(o.order_id AS NVARCHAR) = @query OR o.order_code = @query`, { query });
        if (result.recordset.length === 0) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
        res.json(result.recordset[0]);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};
