const { executeQuery } = require('../config/js/db');

exports.getRecommendations = async (req, res) => {
    try {
        const userId = req.user ? req.user.userId : null;
        let personal = [];
        if (userId) {
            const resPersonal = await executeQuery(`SELECT TOP 4 mi.item_id, mi.item_name, mi.price, mi.image_url, mi.description, COUNT(oi.item_id) as order_count FROM Order_Items oi JOIN Orders o ON oi.order_id = o.order_id JOIN Menu_Items mi ON oi.item_id = mi.item_id WHERE o.user_id = @userId AND mi.status = 'available' AND mi.is_paused = 0 GROUP BY mi.item_id, mi.item_name, mi.price, mi.image_url, mi.description ORDER BY order_count DESC`, { userId });
            personal = resPersonal.recordset;
        }
        const trending = await executeQuery(`SELECT TOP 8 mi.item_id, mi.item_name, mi.price, mi.image_url, mi.description, COUNT(oi.item_id) as total_sold FROM Order_Items oi JOIN Menu_Items mi ON oi.item_id = mi.item_id WHERE mi.status = 'available' AND mi.is_paused = 0 GROUP BY mi.item_id, mi.item_name, mi.price, mi.image_url, mi.description ORDER BY total_sold DESC`);
        const editorsChoice = await executeQuery(`SELECT TOP 4 * FROM Menu_Items WHERE is_recommended = 1 AND status = 'available' AND is_paused = 0`);
        res.json({ success: true, personal, trending: trending.recordset, editorsChoice: editorsChoice.recordset });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};
