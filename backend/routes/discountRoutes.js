const express = require('express');
const router = express.Router();
const { executeQuery, sql, getConnection } = require('../config/js/db');
const { verifyToken, isAdmin, optionalToken } = require('../middleware/authMiddleware');

// 1. Kiểm tra mã giảm giá
router.post('/apply', optionalToken, async (req, res) => {
    try {
        const { code, orderAmount } = req.body;
        const userId = req.user ? req.user.userId : null;

        const result = await executeQuery(`
            SELECT * FROM DiscountCodes 
            WHERE code = @code AND is_active = 1 
            AND (expiry_date IS NULL OR expiry_date > GETDATE())
            AND (usage_limit IS NULL OR usage_count < usage_limit)
        `, { code: code });

        if (result.recordset.length === 0) {
            return res.status(400).json({ message: 'Mã giảm giá không hợp lệ hoặc đã hết hạn' });
        }

        const discount = result.recordset[0];

        // Kiểm tra số tiền tối thiểu
        if (orderAmount < discount.min_order_amount) {
            return res.status(400).json({ 
                message: `Đơn hàng tối thiểu ${discount.min_order_amount.toLocaleString()}đ để sử dụng mã này` 
            });
        }

        // Kiểm tra xem user đã dùng mã này chưa (nếu giới hạn 1 lần mỗi user)
        const usedResult = await executeQuery(`
            SELECT * FROM UserDiscounts WHERE user_id = @userId AND code_id = @codeId AND used_at IS NOT NULL
        `, { userId: userId, codeId: discount.code_id });

        if (usedResult.recordset.length > 0) {
            return res.status(400).json({ message: 'Bạn đã sử dụng mã giảm giá này rồi' });
        }

        let discountAmount = 0;
        if (discount.discount_type === 'percentage') {
            discountAmount = (orderAmount * discount.discount_value) / 100;
            if (discount.max_discount_amount && discountAmount > discount.max_discount_amount) {
                discountAmount = discount.max_discount_amount;
            }
        } else {
            discountAmount = discount.discount_value;
        }

        res.json({
            success: true,
            discount: {
                code: discount.code,
                code_id: discount.code_id,
                discountAmount: discountAmount
            }
        });

    } catch (error) {
        console.error('Lỗi apply discount:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// 2. Đổi điểm lấy mã giảm giá
router.post('/redeem', verifyToken, async (req, res) => {
    try {
        const { codeId } = req.body;
        const userId = req.user.userId;

        // Lấy thông tin mã
        const discountResult = await executeQuery(`
            SELECT * FROM DiscountCodes WHERE code_id = @codeId AND type = 'loyalty' AND is_active = 1
        `, { codeId: codeId });

        if (discountResult.recordset.length === 0) {
            return res.status(400).json({ message: 'Mã không khả dụng để đổi' });
        }

        const discount = discountResult.recordset[0];

        // Kiểm tra điểm của user
        const userResult = await executeQuery('SELECT loyalty_points FROM Users WHERE user_id = @userId', { userId: userId });
        const userPoints = userResult.recordset[0].loyalty_points || 0;

        if (userPoints < discount.points_required) {
            return res.status(400).json({ message: 'Bạn không đủ điểm để đổi mã này' });
        }

        // Thực hiện đổi (trừ điểm và gán mã)
        await executeQuery(`
            BEGIN TRANSACTION
            UPDATE Users SET loyalty_points = loyalty_points - @points WHERE user_id = @userId
            IF NOT EXISTS (SELECT 1 FROM UserDiscounts WHERE user_id = @userId AND code_id = @codeId)
                INSERT INTO UserDiscounts (user_id, code_id) VALUES (@userId, @codeId)
            COMMIT
        `, { points: discount.points_required, userId: userId, codeId: codeId });

        res.json({ success: true, message: 'Đổi mã thành công! Bạn có thể xem trong kho ưu đãi.' });

    } catch (error) {
        console.error('Lỗi redeem discount:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// 3. Admin: Lấy tất cả mã
router.get('/admin/list', verifyToken, isAdmin, async (req, res) => {
    try {
        const result = await executeQuery('SELECT * FROM DiscountCodes ORDER BY created_at DESC');
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// 🆕 Khách hàng: Lấy danh sách mã giảm giá khả dụng (Public/Private)
router.get('/redeemable', optionalToken, async (req, res) => {
    try {
        const userId = req.user ? req.user.userId : null;
        
        let query = `
            SELECT code_id, code, description, discount_type, discount_value, min_order_amount, points_required, type 
            FROM DiscountCodes 
            WHERE is_active = 1 AND is_public = 1
            AND (expiry_date IS NULL OR expiry_date > GETDATE())
            AND (usage_limit IS NULL OR usage_count < usage_limit)
        `;

        // Nếu đã đăng nhập, ẩn các mã user đã dùng (nếu có logic giới hạn 1 lần)
        if (userId) {
            query += ` AND code_id NOT IN (
                SELECT code_id FROM UserDiscounts 
                WHERE user_id = @userId AND used_at IS NOT NULL
            )`;
        }

        query += ` ORDER BY discount_value DESC`;

        const result = await executeQuery(query, { userId });
        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching redeemable coupons:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// 4. Admin: Tạo mã mới
router.post('/admin/create', verifyToken, isAdmin, async (req, res) => {
    try {
        const { 
            code, description, discount_type, discount_value, 
            min_order_amount, max_discount_amount, usage_limit, 
            expiry_date, type, points_required, is_public 
        } = req.body;

        await executeQuery(`
            INSERT INTO DiscountCodes (
                code, description, discount_type, discount_value, 
                min_order_amount, max_discount_amount, usage_limit, 
                expiry_date, type, points_required, is_public
            ) VALUES (
                @code, @description, @discount_type, @discount_value, 
                @min_order_amount, @max_discount_amount, @usage_limit, 
                @expiry_date, @type, @points_required, @is_public
            )
        `, {
            code, description, discount_type, discount_value,
            min_order_amount: min_order_amount || 0,
            max_discount_amount: max_discount_amount || null,
            usage_limit: usage_limit || null,
            expiry_date: expiry_date || null,
            type: type || 'manual',
            points_required: points_required || 0,
            is_public: is_public !== undefined ? is_public : 1
        });

        res.json({ success: true, message: 'Tạo mã giảm giá thành công' });
    } catch (error) {
        console.error('Lỗi tạo discount:', error);
        res.status(500).json({ message: 'Lỗi: ' + error.message });
    }
});

// 5. Admin: Cập nhật mã giảm giá
router.put('/admin/update/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            code, description, discount_type, discount_value, 
            min_order_amount, max_discount_amount, usage_limit, 
            expiry_date, type, points_required, is_active, is_public 
        } = req.body;

        await executeQuery(`
            UPDATE DiscountCodes SET
                code = @code,
                description = @description,
                discount_type = @discount_type,
                discount_value = @discount_value,
                min_order_amount = @min_order_amount,
                max_discount_amount = @max_discount_amount,
                usage_limit = @usage_limit,
                expiry_date = @expiry_date,
                type = @type,
                points_required = @points_required,
                is_active = @is_active,
                is_public = @is_public,
                updated_at = GETDATE()
            WHERE code_id = @id
        `, {
            id, code, description, discount_type, discount_value,
            min_order_amount, max_discount_amount, usage_limit,
            expiry_date, type, points_required, is_active, is_public
        });

        res.json({ success: true, message: 'Cập nhật thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi: ' + error.message });
    }
});

// 6. Admin: Xóa mã giảm giá
router.delete('/admin/delete/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await executeQuery('DELETE FROM DiscountCodes WHERE code_id = @id', { id });
        res.json({ success: true, message: 'Xóa thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi: ' + error.message });
    }
});

module.exports = router;
