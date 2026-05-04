const express = require('express');
const router = express.Router();
const { getConnection, sql } = require('../config/js/db');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// 1. Check-in
router.post('/check-in', verifyToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        
        const pool = await getConnection();
        
        // Kiểm tra xem đã check-in chưa
        const check = await pool.request()
            .input('uid', sql.Int, userId)
            .query("SELECT TOP 1 attendance_id FROM Attendance WHERE user_id = @uid AND check_out IS NULL AND status = 'active'");
        
        if (check.recordset.length > 0) {
            return res.status(400).json({ message: 'Bạn chưa check-out đơn cũ' });
        }
        
        await pool.request()
            .input('uid', sql.Int, userId)
            .input('ip', sql.NVarChar, ip)
            .query("INSERT INTO Attendance (user_id, check_in, ip_address) VALUES (@uid, GETDATE(), @ip)");
            
        res.json({ success: true, message: 'Check-in thành công', time: new Date() });
    } catch (error) {
        console.error('Check-in error:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// 2. Check-out
router.post('/check-out', verifyToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const pool = await getConnection();
        
        const check = await pool.request()
            .input('uid', sql.Int, userId)
            .query("SELECT TOP 1 attendance_id FROM Attendance WHERE user_id = @uid AND check_out IS NULL AND status = 'active'");
            
        if (check.recordset.length === 0) {
            return res.status(400).json({ message: 'Bạn chưa check-in' });
        }
        
        const attendanceId = check.recordset[0].attendance_id;
        
        await pool.request()
            .input('aid', sql.Int, attendanceId)
            .query("UPDATE Attendance SET check_out = GETDATE() WHERE attendance_id = @aid");
            
        res.json({ success: true, message: 'Check-out thành công', time: new Date() });
    } catch (error) {
        console.error('Check-out error:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// 3. Lấy trạng thái hiện tại
router.get('/status', verifyToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const pool = await getConnection();
        
        const result = await pool.request()
            .input('uid', sql.Int, userId)
            .query("SELECT TOP 1 check_in, attendance_id FROM Attendance WHERE user_id = @uid AND check_out IS NULL AND status = 'active'");
            
        if (result.recordset.length > 0) {
            res.json({ active: true, check_in: result.recordset[0].check_in });
        } else {
            res.json({ active: false });
        }
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// 4. Admin lấy tất cả (Dành cho Admin/Staff)
router.get('/all', verifyToken, isAdmin, async (req, res) => {
    try {
        const { date } = req.query;
        const pool = await getConnection();
        
        let query = `
            SELECT a.*, u.full_name 
            FROM Attendance a
            JOIN Users u ON a.user_id = u.user_id
        `;
        
        if (date) {
            query += ` WHERE CAST(a.check_in AS DATE) = @date`;
        }
        
        query += ` ORDER BY a.check_in DESC`;
        
        const request = pool.request();
        if (date) request.input('date', sql.Date, date);
        
        const result = await request.query(query);
        res.json(result.recordset);
    } catch (error) {
        console.error('Admin attendance fetch error:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

module.exports = router;
