const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/js/db');

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

// Lấy chi tiết một bàn
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await executeQuery(`
            SELECT table_id, table_number, capacity, status, location 
            FROM Tables 
            WHERE table_id = @table_id
        `, { table_id: id });
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy bàn' });
        }
        
        res.json(result.recordset[0]);
    } catch (error) {
        console.error('Lỗi lấy chi tiết bàn:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// Cập nhật trạng thái bàn
router.put('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        await executeQuery(`
            UPDATE Tables 
            SET status = @status 
            WHERE table_id = @table_id
        `, { 
            table_id: id,
            status: status 
        });
        
        res.json({ success: true, message: 'Cập nhật trạng thái thành công' });
    } catch (error) {
        console.error('Lỗi cập nhật trạng thái bàn:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

module.exports = router;