const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/js/db');
const { optionalToken } = require('../middleware/authMiddleware');

/**
 * Gợi ý món ăn
 * 1. Gợi ý cá nhân (Dựa trên lịch sử gọi món của user)
 * 2. Gợi ý xu hướng (Món bán chạy nhất quán)
 */
router.get('/', optionalToken, async (req, res) => {
    try {
        const userId = req.user ? req.user.userId : null;
        let personalRecommendations = [];
        
        // 1. Lấy món cá nhân hay gọi (nếu đã đăng nhập)
        if (userId) {
            const personalResult = await executeQuery(`
                SELECT TOP 4 
                    mi.item_id, mi.item_name, mi.price, mi.image_url, mi.description,
                    COUNT(oi.item_id) as order_count
                FROM Order_Items oi
                JOIN Orders o ON oi.order_id = o.order_id
                JOIN Menu_Items mi ON oi.item_id = mi.item_id
                WHERE o.user_id = @userId AND mi.status = 'available' AND mi.is_paused = 0
                GROUP BY mi.item_id, mi.item_name, mi.price, mi.image_url, mi.description
                ORDER BY order_count DESC
            `, { userId });
            personalRecommendations = personalResult.recordset;
        }

        // 2. Lấy món xu hướng (bán chạy nhất toàn quán)
        const trendingResult = await executeQuery(`
            SELECT TOP 8
                mi.item_id, mi.item_name, mi.price, mi.image_url, mi.description,
                COUNT(oi.item_id) as total_sold
            FROM Order_Items oi
            JOIN Menu_Items mi ON oi.item_id = mi.item_id
            WHERE mi.status = 'available' AND mi.is_paused = 0
            GROUP BY mi.item_id, mi.item_name, mi.price, mi.image_url, mi.description
            ORDER BY total_sold DESC
        `);

        // 3. Lấy món Admin đánh dấu là "is_recommended"
        const editorChoiceResult = await executeQuery(`
            SELECT TOP 4 * FROM Menu_Items 
            WHERE is_recommended = 1 AND status = 'available' AND is_paused = 0
        `);

        res.json({
            success: true,
            personal: personalRecommendations,
            trending: trendingResult.recordset,
            editorsChoice: editorChoiceResult.recordset
        });

    } catch (error) {
        console.error('Recommendation error:', error);
        res.status(500).json({ success: false, message: 'Lỗi lấy gợi ý' });
    }
});

module.exports = router;
