const express = require('express');
const router = express.Router();
const { executeQuery, sql, getConnection } = require('../config/js/db');
const { verifyToken, isStaff, optionalToken } = require('../middleware/authMiddleware');
const { sendInvoiceEmail } = require('../services/emailService');


// Middleware xác thực (tất cả API order đều cần đăng nhập, TRỪ create)
// router.use(verifyToken); // Đã bị comment vì create dùng optionalToken

// Helper function to generate order code #CM-XXXX
function generateOrderCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `#CM-${code}`;
}

// ========== 1. Tạo đơn hàng mới ==========
router.post('/create', optionalToken, async (req, res) => {
    try {
        const { 
            table_id, 
            items,           
            payment_method,  
            total_amount,
            discount_id,     
            discount_amount, 
            order_type,      // 🆕 'dine-in', 'takeaway', 'delivery'
            guest_name,      
            guest_phone,     
            guest_email,     // 🆕 Thêm email để gửi hóa đơn
            delivery_address,
            lat,             // 🆕 Tọa độ vĩ độ
            lng,             // 🆕 Tọa độ kinh độ
            distance_km,     // 🆕 Khoảng cách
            shipping_fee,    // 🆕 Phí giao hàng
            note 
        } = req.body;

        
        const user_id = req.user ? req.user.userId : null;
        

        
        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'Giỏ hàng trống' });
        }
        
        // Bắt đầu transaction
        const transaction = new sql.Transaction(await getConnection());
        await transaction.begin();
        
        try {
            // Generate unique order code
            let orderCode = generateOrderCode();
            
            // Check if code exists (simple retry once)
            const checkCode = await transaction.request()
                .input('code', sql.NVarChar, orderCode)
                .query('SELECT 1 FROM Orders WHERE order_code = @code');
            
            if (checkCode.recordset.length > 0) {
                orderCode = generateOrderCode();
            }

            // Trạng thái đơn hàng: Nếu tiền mặt thì chờ xác nhận (pending), nếu khác thì tạm coi là paid (hoặc xử lý riêng)
            const status = payment_method === 'cash' ? 'pending' : 'paid';
            
            // 1. Tạo đơn hàng
            const orderResult = await transaction.request()
                .input('table_id', sql.Int, table_id || null)
                .input('user_id', sql.Int, user_id)
                .input('total_amount', sql.Decimal(10,2), total_amount)
                .input('status', sql.NVarChar(20), status)
                .input('note', sql.NVarChar(255), note || null)
                .input('order_code', sql.NVarChar(20), orderCode)
                .input('discount_id', sql.Int, discount_id || null)
                .input('discount_amount', sql.Decimal(10,2), discount_amount || 0)
                .input('order_type', sql.NVarChar(20), order_type || 'dine-in')
                .input('guest_name', sql.NVarChar(100), guest_name || null)
                .input('guest_phone', sql.NVarChar(20), guest_phone || null)
                .input('guest_email', sql.NVarChar(100), guest_email || null)
                .input('delivery_address', sql.NVarChar(255), delivery_address || null)
                .input('lat', sql.Decimal(10, 8), lat || null)
                .input('lng', sql.Decimal(11, 8), lng || null)
                .input('distance_km', sql.Decimal(10, 2), distance_km || 0)
                .input('shipping_fee', sql.Decimal(10, 2), shipping_fee || 0)

                .query(`
                    INSERT INTO Orders (
                        table_id, user_id, total_amount, status, note, created_at, 
                        order_code, discount_id, discount_amount, order_type, 
                        guest_name, guest_phone, guest_email, delivery_address,
                        lat, lng, distance_km, shipping_fee
                    )

                    OUTPUT INSERTED.order_id, INSERTED.order_code
                    VALUES (
                        @table_id, @user_id, @total_amount, @status, @note, GETDATE(), 
                        @order_code, @discount_id, @discount_amount, @order_type, 
                        @guest_name, @guest_phone, @guest_email, @delivery_address,
                        @lat, @lng, @distance_km, @shipping_fee
                    )

                `);
            
            const orderId = orderResult.recordset[0].order_id;
            const finalOrderCode = orderResult.recordset[0].order_code;
            
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

            // 🆕 2.1 Cập nhật lượt dùng mã giảm giá (chỉ khi có user đăng nhập hoặc mã hợp lệ)
            if (discount_id) {
                await transaction.request()
                    .input('code_id', sql.Int, discount_id)
                    .input('userId', sql.Int, user_id)
                    .query(`
                        UPDATE DiscountCodes SET usage_count = usage_count + 1 WHERE code_id = @code_id;
                        IF @userId IS NOT NULL
                        BEGIN
                            IF EXISTS (SELECT 1 FROM UserDiscounts WHERE user_id = @userId AND code_id = @code_id)
                                UPDATE UserDiscounts SET used_at = GETDATE() WHERE user_id = @userId AND code_id = @code_id;
                            ELSE
                                INSERT INTO UserDiscounts (user_id, code_id, used_at) VALUES (@userId, @code_id, GETDATE());
                        END
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
            
            // 4. Cập nhật trạng thái bàn (nếu có)
            if (table_id) {
                await transaction.request()
                    .input('table_id', sql.Int, table_id)
                    .query(`
                        UPDATE Tables SET status = 'occupied' WHERE table_id = @table_id
                    `);
            }
            
            // 5. Cập nhật điểm tích lũy (nếu có user)
            let earnedPoints = 0;
            if (user_id) {
                earnedPoints = Math.floor(total_amount / 10000); // 1 điểm cho mỗi 10.000 VNĐ
                if (earnedPoints > 0) {
                    await transaction.request()
                        .input('user_id', sql.Int, user_id)
                        .input('points', sql.Int, earnedPoints)
                        .query(`
                            UPDATE Users SET loyalty_points = ISNULL(loyalty_points, 0) + @points WHERE user_id = @user_id
                        `);
                }
            }

            // Commit transaction
            await transaction.commit();
            
            // 🆕 6. Gửi hóa đơn qua email (nếu có email) - Bọc trong try-catch riêng để không làm hỏng flow chính
            try {
                if (guest_email || (req.user && req.user.email)) {
                    const emailData = {
                        order_id: orderId,
                        order_code: finalOrderCode,
                        total_amount: total_amount,
                        discount_amount: discount_amount,
                        shipping_fee: shipping_fee,
                        guest_name: guest_name,
                        guest_email: guest_email || req.user.email,
                        created_at: new Date()
                    };
                    
                    // Lấy thông tin user (nếu đã đăng nhập) để có full_name
                    if (req.user) {
                        const userResult = await executeQuery('SELECT full_name, email FROM Users WHERE user_id = @uid', { uid: user_id });
                        if (userResult.recordset.length > 0) {
                            emailData.full_name = userResult.recordset[0].full_name;
                            emailData.email = userResult.recordset[0].email;
                        }
                    }

                    sendInvoiceEmail(emailData, items.map(i => ({
                        item_name: i.item_name || 'Món ăn',
                        quantity: i.quantity,
                        unit_price: i.price
                    })));
                }
            } catch (emailError) {
                console.error('Lỗi gửi email hóa đơn:', emailError);
                // Không throw error ở đây vì đơn hàng đã thành công
            }

            return res.json({ 
                success: true, 
                message: 'Đặt hàng thành công', 
                order_id: orderId,
                order_code: finalOrderCode,
                earned_points: earnedPoints
            });
            
        } catch (error) {
            if (transaction && transaction.active) {
                await transaction.rollback();
            }
            throw error;
        }
        
    } catch (error) {
        console.error('Lỗi tạo đơn hàng:', error);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Lỗi server: ' + error.message });
        }
    }
});

// ========== 2. Lấy lịch sử đơn hàng của user hiện tại ==========
router.get('/history', verifyToken, async (req, res) => {
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
                o.order_code,
                o.order_type,
                p.payment_method,
                p.paid_at
            FROM Orders o
            LEFT JOIN Tables t ON o.table_id = t.table_id
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
router.get('/:orderId', verifyToken, async (req, res) => {
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
                o.order_code,
                o.order_type,
                o.delivery_address,
                p.payment_method,
                p.amount as paid_amount,
                p.paid_at
            FROM Orders o
            LEFT JOIN Tables t ON o.table_id = t.table_id
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

// ========== 4. Theo dõi đơn hàng (Công khai - Cho phép Guest tra cứu) ==========
router.get('/track/:query', async (req, res) => {
    try {
        const { query } = req.params; 
        
        if (!query || query === 'undefined') {
            return res.status(400).json({ message: 'Thiếu mã đơn hàng' });
        }
        
        const result = await executeQuery(`
            SELECT 
                o.order_id,
                o.order_code,
                o.table_id,
                t.table_number,
                o.total_amount,
                o.status,
                o.order_type,
                o.guest_name,
                o.note,
                o.created_at,
                o.updated_at
            FROM Orders o
            LEFT JOIN Tables t ON o.table_id = t.table_id
            WHERE CAST(o.order_id AS NVARCHAR) = @query OR o.order_code = @query
        `, { query: query });
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
        }
        
        res.json(result.recordset[0]);
    } catch (error) {
        console.error('Lỗi theo dõi đơn hàng:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

module.exports = router;