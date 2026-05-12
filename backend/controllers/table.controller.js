const { executeQuery } = require('../config/js/db');

exports.getAllTables = async (req, res) => {
    try {
        const result = await executeQuery(`SELECT table_id, table_number, capacity, status, location FROM Tables ORDER BY table_number`);
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.createTable = async (req, res) => {
    try {
        const { table_number, capacity, location } = req.body;
        const check = await executeQuery('SELECT table_id FROM Tables WHERE table_number = @num', { num: table_number });
        if (check.recordset.length > 0) return res.status(400).json({ message: 'Số bàn này đã tồn tại' });
        await executeQuery(`INSERT INTO Tables (table_number, capacity, location, status) VALUES (@num, @cap, @loc, 'available')`, { num: table_number, cap: capacity, loc: location || 'Tầng 1' });
        res.json({ success: true, message: 'Thêm bàn thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.updateTable = async (req, res) => {
    try {
        const { id } = req.params;
        const { table_number, capacity, location, status } = req.body;
        await executeQuery(`UPDATE Tables SET table_number=@num, capacity=@cap, location=@loc, status=@status WHERE table_id=@id`, { id, num: table_number, cap: capacity, loc: location, status: status || 'available' });
        res.json({ success: true, message: 'Cập nhật bàn thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.deleteTable = async (req, res) => {
    try {
        const { id } = req.params;
        const check = await executeQuery("SELECT TOP 1 order_id FROM Orders WHERE table_id = @id AND status = 'pending'", { id });
        if (check.recordset.length > 0) return res.status(400).json({ message: 'Không thể xóa bàn đang có đơn hàng' });
        await executeQuery('DELETE FROM Tables WHERE table_id = @id', { id });
        res.json({ success: true, message: 'Xóa bàn thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        await executeQuery('UPDATE Tables SET status = @status WHERE table_id = @table_id', { table_id: id, status });
        res.json({ success: true, message: 'Cập nhật trạng thái thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};
