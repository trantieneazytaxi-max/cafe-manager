const { executeQuery } = require('../config/js/db');

exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const result = await executeQuery(`SELECT u.user_id, u.full_name, u.email, u.phone, u.role, u.is_active, u.created_at, u.loyalty_points, u.delivery_address, u.delivery_lat, u.delivery_lng, u.auto_fill_address, u.avatar_url, sp.position, sp.salary, sp.bank_account, sp.bank_name, sp.address as work_address, sp.date_of_birth, sp.identity_number, sp.hire_date FROM Users u LEFT JOIN StaffProfile sp ON u.user_id = sp.user_id WHERE u.user_id = @userId`, { userId });
        if (result.recordset.length === 0) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        const row = result.recordset[0];
        res.json({ ...row, delivery_lat: row.delivery_lat != null ? Number(row.delivery_lat) : null, delivery_lng: row.delivery_lng != null ? Number(row.delivery_lng) : null });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { full_name, phone, avatar_url } = req.body;
        await executeQuery(`UPDATE Users SET full_name = COALESCE(@full_name, full_name), phone = COALESCE(@phone, phone), avatar_url = COALESCE(@avatar_url, avatar_url), updated_at = GETDATE() WHERE user_id = @userId`, { userId, full_name: full_name || null, phone: phone || null, avatar_url: avatar_url || null });
        res.json({ success: true, message: 'Đã cập nhật profile' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.updateAddress = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { delivery_address, delivery_lat, delivery_lng, auto_fill_address } = req.body;
        await executeQuery(`UPDATE Users SET delivery_address = @delivery_address, delivery_lat = @delivery_lat, delivery_lng = @delivery_lng, auto_fill_address = @auto_fill, updated_at = GETDATE() WHERE user_id = @userId`, { userId, delivery_address: delivery_address || null, delivery_lat: delivery_lat || null, delivery_lng: delivery_lng || null, auto_fill: auto_fill_address === false ? 0 : 1 });
        res.json({ success: true, message: 'Đã lưu địa chỉ' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.getOrders = async (req, res) => {
    try {
        const userId = req.user.userId;
        const result = await executeQuery(`SELECT o.order_id, o.order_code, o.table_id, t.table_number, o.total_amount, o.status, o.created_at, o.note FROM Orders o LEFT JOIN Tables t ON o.table_id = t.table_id WHERE o.user_id = @userId ORDER BY o.created_at DESC`, { userId });
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.getLoyaltyPoints = async (req, res) => {
    try {
        const userId = req.user.userId;
        const result = await executeQuery(`SELECT loyalty_points FROM Users WHERE user_id = @userId`, { userId });
        if (result.recordset.length === 0) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        res.json({ loyalty_points: result.recordset[0].loyalty_points || 0 });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};
