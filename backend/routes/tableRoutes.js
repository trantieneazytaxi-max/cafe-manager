const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/js/db');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Lấy tất cả bàn
router.get('/', async (req, res) => {
    try {
        const result = await executeQuery(`
            SELECT table_id, table_number, capacity, status, location 
            FROM Tables 
            ORDER BY table_number
        `);
        res.json(result.recordset);
    } catch (error) {
        console.error('Lỗi lấy danh sách bàn:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// 🆕 Thêm bàn mới (Admin)
router.post('/', verifyToken, isAdmin, async (req, res) => {
    try {
        const { table_number, capacity, location } = req.body;
        // Kiểm tra số bàn đã tồn tại chưa
        const check = await executeQuery('SELECT table_id FROM Tables WHERE table_number = @num', { num: table_number });
        if (check.recordset.length > 0) {
            return res.status(400).json({ message: 'Số bàn này đã tồn tại' });
        }
        await executeQuery(`
            INSERT INTO Tables (table_number, capacity, location, status)
            VALUES (@num, @cap, @loc, 'available')
        `, { num: table_number, cap: capacity, loc: location || 'Tầng 1' });
        res.json({ success: true, message: 'Thêm bàn thành công' });
    } catch (error) {
        console.error('Lỗi thêm bàn:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// 🆕 Cập nhật thông tin bàn (Admin)
router.put('/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { table_number, capacity, location, status } = req.body;
        await executeQuery(`
            UPDATE Tables 
            SET table_number = @num, capacity = @cap, location = @loc, status = @status
            WHERE table_id = @id
        `, { id, num: table_number, cap: capacity, loc: location, status: status || 'available' });
        res.json({ success: true, message: 'Cập nhật bàn thành công' });
    } catch (error) {
        console.error('Lỗi cập nhật bàn:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// 🆕 Xóa bàn (Admin)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        // Kiểm tra xem bàn có đơn hàng chưa hoàn thành không
        const check = await executeQuery("SELECT TOP 1 order_id FROM Orders WHERE table_id = @id AND status = 'pending'", { id });
        if (check.recordset.length > 0) {
            return res.status(400).json({ message: 'Không thể xóa bàn đang có đơn hàng chưa xử lý' });
        }
        await executeQuery('DELETE FROM Tables WHERE table_id = @id', { id });
        res.json({ success: true, message: 'Xóa bàn thành công' });
    } catch (error) {
        console.error('Lỗi xóa bàn:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// Cập nhật trạng thái bàn (Staff/Admin)
router.put('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        await executeQuery('UPDATE Tables SET status = @status WHERE table_id = @table_id', { table_id: id, status });
        res.json({ success: true, message: 'Cập nhật trạng thái thành công' });
    } catch (error) {
        console.error('Lỗi cập nhật trạng thái bàn:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

module.exports = router;