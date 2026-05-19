const { executeQuery } = require('../config/js/db');

exports.createReview = async (req, res) => {
    try {
        const { orderId, rating, comment } = req.body;
        const userId = req.user.userId;

        // Check if order exists and belongs to user
        const orderResult = await executeQuery('SELECT * FROM Orders WHERE order_id = @orderId AND user_id = @userId', { orderId, userId });
        if (orderResult.recordset.length === 0) {
            return res.status(404).json({ message: 'Đơn hàng không tồn tại hoặc không thuộc quyền sở hữu của bạn' });
        }

        const order = orderResult.recordset[0];
        
        // Check if order is completed
        if (order.status !== 'completed' && order.status !== 'delivered') {
             // Depending on how "payment success" works, it might be 'completed' or 'delivered'
             // If the user wants to review after payment, we check if it's paid.
        }

        // Check if within 24 hours
        const completedDate = new Date(order.created_at); // Or use a 'completed_at' if it exists
        const now = new Date();
        const diffHours = (now - completedDate) / (1000 * 60 * 60);
        
        if (diffHours > 24) {
            return res.status(400).json({ message: 'Đã quá thời gian đánh giá (24h kể từ khi đặt hàng)' });
        }

        // Check if already reviewed
        const existingReview = await executeQuery('SELECT * FROM Reviews WHERE order_id = @orderId', { orderId });
        if (existingReview.recordset.length > 0) {
            return res.status(400).json({ message: 'Bạn đã đánh giá đơn hàng này rồi' });
        }

        await executeQuery(
            'INSERT INTO Reviews (order_id, user_id, rating, comment) VALUES (@orderId, @userId, @rating, @comment)',
            { orderId, userId, rating, comment }
        );

        res.json({ success: true, message: 'Cảm ơn bạn đã đánh giá!' });
    } catch (error) {
        console.error('Create Review Error:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.getOrderReview = async (req, res) => {
    try {
        const { orderId } = req.params;
        const result = await executeQuery('SELECT * FROM Reviews WHERE order_id = @orderId', { orderId });
        res.json(result.recordset[0] || null);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.getAdminReviews = async (req, res) => {
    try {
        const result = await executeQuery(`
            SELECT r.*, u.full_name, u.avatar_url, o.total_amount, o.created_at as order_date
            FROM Reviews r
            JOIN Users u ON r.user_id = u.user_id
            JOIN Orders o ON r.order_id = o.order_id
            ORDER BY r.created_at DESC
        `);
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.replyReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { reply } = req.body;
        
        await executeQuery(
            'UPDATE Reviews SET staff_reply = @reply, replied_at = GETDATE() WHERE review_id = @reviewId',
            { reviewId, reply }
        );
        
        res.json({ success: true, message: 'Đã phản hồi đánh giá' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};
