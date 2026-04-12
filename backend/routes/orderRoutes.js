const express = require('express');
const router = express.Router();
const { executeQuery, sql, getConnection } = require('../config/js/db');
const { verifyToken, isStaff } = require('../middleware/authMiddleware');

// Middleware xác thực (tất cả API order đều cần đăng nhập)
router.use(verifyToken);
router.use(isStaff);

// ========== 1. Tạo đơn hàng mới ==========
router.post('/create', async (req, res) => {
    try {
        const { 
            table_id, 
            items,           // Array các món: [{ item_id, quantity, price, size_id, temp_id }]
            payment_method,  // 'cash' hoặc 'bank_transfer'
            total_amount,
            note 
        } = req.body;
        
        const user_id = req.user.userId;
        
        if (!table_id) {
            return res.status(400).json({ message: 'Vui lòng chọn bàn' });
        }
        
        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'Giỏ hàng trống' });
        }
        
        // Bắt đầu transaction
        const transaction = new sql.Transaction(await getConnection());
        await transaction.begin();
        
        try {
            // 1. Tạo đơn hàng
            const orderResult = await transaction.request()
                .input('table_id', sql.Int, table_id)
                .input('user_id', sql.Int, user_id)
                .input('total_amount', sql.Decimal(10,2), total_amount)
                .input('status', sql.NVarChar(20), 'pending')
                .input('note', sql.NVarChar(255), note || null)
                .query(`
                    INSERT INTO Orders (table_id, user_id, total_amount, status, note, created_at)
                    OUTPUT INSERTED.order_id
                    VALUES (@table_id, @user_id, @total_amount, @status, @note, GETDATE())
                `);
            
            const orderId = orderResult.recordset[0].order_id;
            
            // 2. Thêm chi tiết đơn hàng
            for (const item of items) {
                await transaction.request()
                    .input('order_id', sql.Int, orderId)
                    .input('item_id', sql.Int, item.item_id)
                    .input('quantity', sql.Int, item.quantity)
                    .input('unit_price', sql.Decimal(10,2), item.price)
                    .query(`
                        INSERT INTO Order_Items (order_id, item_id, quantity, unit_price)
                        VALUES (@order_id, @item_id, @quantity, @unit_price)
                    `);
            }
            
            // 3. Tạo thanh toán
            await transaction.request()
                .input('order_id', sql.Int, orderId)
                .input('payment_method', sql.NVarChar(20), payment_method)
                .input('amount', sql.Decimal(10,2), total_amount)
                .query(`
                    INSERT INTO Payments (order_id, payment_method, amount, paid_at)
                    VALUES (@order_id, @payment_method, @amount, GETDATE())
                `);
            
            // 4. Cập nhật trạng thái bàn thành 'occupied'
            await transaction.request()
                .input('table_id', sql.Int, table_id)
                .query(`
                    UPDATE Tables SET status = 'occupied' WHERE table_id = @table_id
                `);
            
            // Commit transaction
            await transaction.commit();
            
            res.json({ 
                success: true, 
                message: 'Đặt hàng thành công', 
                order_id: orderId 
            });
            
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
        
    } catch (error) {
        console.error('Lỗi tạo đơn hàng:', error);
        res.status(500).json({ message: 'Lỗi server: ' + error.message });
    }
});

// ========== 2. Lấy lịch sử đơn hàng của user hiện tại ==========
router.get('/history', async (req, res) => {
    try {
        const user_id = req.user.userId;
        
        const result = await executeQuery(`
            SELECT 
                o.order_id,
                o.table_id,
                t.table_number,
                o.total_amount,
                o.status,
                o.created_at,
                p.payment_method,
                p.paid_at
            FROM Orders o
            JOIN Tables t ON o.table_id = t.table_id
            LEFT JOIN Payments p ON o.order_id = p.order_id
            WHERE o.user_id = @user_id
            ORDER BY o.created_at DESC
        `, { user_id: user_id });
        
        res.json(result.recordset);
        
    } catch (error) {
        console.error('Lỗi lấy lịch sử đơn hàng:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// ========== 3. Lấy chi tiết đơn hàng ==========
router.get('/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        const user_id = req.user.userId;
        
        // Lấy thông tin đơn hàng
        const orderResult = await executeQuery(`
            SELECT 
                o.order_id,
                o.table_id,
                t.table_number,
                o.total_amount,
                o.status,
                o.note,
                o.created_at,
                p.payment_method,
                p.amount as paid_amount,
                p.paid_at
            FROM Orders o
            JOIN Tables t ON o.table_id = t.table_id
            LEFT JOIN Payments p ON o.order_id = p.order_id
            WHERE o.order_id = @orderId AND o.user_id = @user_id
        `, { orderId: orderId, user_id: user_id });
        
        if (orderResult.recordset.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
        }
        
        // Lấy chi tiết món
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
            order: orderResult.recordset[0],
            items: itemsResult.recordset
        });
        
    } catch (error) {
        console.error('Lỗi lấy chi tiết đơn hàng:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

module.exports = router;