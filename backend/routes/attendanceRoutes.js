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

        // Tự động tìm Ca làm việc dựa trên thời gian hiện tại
        const now = new Date();
        const timeStr = now.toTimeString().split(' ')[0]; // HH:MM:SS
        
        const shiftResult = await pool.request()
            .input('nowTime', sql.Time, now)
            .query("SELECT TOP 1 shift_id FROM Shifts WHERE @nowTime >= start_time AND @nowTime <= end_time");
        
        const shiftId = shiftResult.recordset.length > 0 ? shiftResult.recordset[0].shift_id : null;
        
        await pool.request()
            .input('uid', sql.Int, userId)
            .input('ip', sql.NVarChar, ip)
            .input('sid', sql.Int, shiftId)
            .query("INSERT INTO Attendance (user_id, check_in, ip_address, shift_id) VALUES (@uid, GETDATE(), @ip, @sid)");
            
        res.json({ success: true, message: 'Check-in thành công', time: new Date(), shift_id: shiftId });
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
            .query(`
                SELECT TOP 1 a.check_in, a.attendance_id, s.name as shift_name 
                FROM Attendance a
                LEFT JOIN Shifts s ON a.shift_id = s.shift_id
                WHERE a.user_id = @uid AND a.check_out IS NULL AND a.status = 'active'
            `);
            
        if (result.recordset.length > 0) {
            res.json({ 
                active: true, 
                check_in: result.recordset[0].check_in,
                shift_name: result.recordset[0].shift_name
            });
        } else {
            res.json({ active: false });
        }
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// 4. Lấy lịch sử chấm công cá nhân
router.get('/my-history', verifyToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const pool = await getConnection();
        
        const result = await pool.request()
            .input('uid', sql.Int, userId)
            .query(`
                SELECT a.*, s.name as shift_name 
                FROM Attendance a
                LEFT JOIN Shifts s ON a.shift_id = s.shift_id
                WHERE a.user_id = @uid
                ORDER BY a.check_in DESC
            `);
            
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// 5. Lấy lịch làm việc cá nhân
router.get('/my-schedule', verifyToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const pool = await getConnection();
        
        const result = await pool.request()
            .input('uid', sql.Int, userId)
            .query(`
                SELECT w.*, s.name as shift_name, s.start_time, s.end_time, s.color
                FROM WorkSchedules w
                JOIN Shifts s ON w.shift_id = s.shift_id
                WHERE w.user_id = @uid AND w.work_date >= CAST(GETDATE() AS DATE)
                ORDER BY w.work_date ASC
            `);
            
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// 6. Lấy danh sách ca làm việc
router.get('/shifts', verifyToken, async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query("SELECT * FROM Shifts");
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// 7. Admin: Phân lịch làm việc
router.post('/schedule', verifyToken, isAdmin, async (req, res) => {
    try {
        const { user_id, shift_id, work_date, note } = req.body;
        const pool = await getConnection();
        
        await pool.request()
            .input('uid', sql.Int, user_id)
            .input('sid', sql.Int, shift_id)
            .input('date', sql.Date, work_date)
            .input('note', sql.NVarChar, note)
            .query(`
                IF EXISTS (SELECT 1 FROM WorkSchedules WHERE user_id = @uid AND work_date = @date)
                BEGIN
                    UPDATE WorkSchedules SET shift_id = @sid, note = @note WHERE user_id = @uid AND work_date = @date
                END
                ELSE
                BEGIN
                    INSERT INTO WorkSchedules (user_id, shift_id, work_date, note) VALUES (@uid, @sid, @date, @note)
                END
            `);
            
        res.json({ success: true, message: 'Đã cập nhật lịch làm việc' });
    } catch (error) {
        console.error('Schedule update error:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// 8. Admin/Staff: Lấy tất cả chấm công
router.get('/all', verifyToken, async (req, res) => {
    try {
        // Chỉ admin hoặc staff mới có quyền xem cái này (Middleware isAdmin có thể hơi chặt nếu staff cũng cần xem)
        const { date, user_id } = req.query;
        const pool = await getConnection();
        
        let query = `
            SELECT a.*, u.full_name, s.name as shift_name 
            FROM Attendance a
            JOIN Users u ON a.user_id = u.user_id
            LEFT JOIN Shifts s ON a.shift_id = s.shift_id
            WHERE 1=1
        `;
        
        if (date) query += ` AND CAST(a.check_in AS DATE) = @date`;
        if (user_id) query += ` AND a.user_id = @uid`;
        
        query += ` ORDER BY a.check_in DESC`;
        
        const request = pool.request();
        if (date) request.input('date', sql.Date, date);
        if (user_id) request.input('uid', sql.Int, user_id);
        
        const result = await request.query(query);
        res.json(result.recordset);
    } catch (error) {
        console.error('Admin attendance fetch error:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

module.exports = router;
