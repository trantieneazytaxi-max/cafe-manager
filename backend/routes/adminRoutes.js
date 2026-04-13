const bcrypt = require('bcryptjs');
const express = require('express');
const router = express.Router();
const { executeQuery, sql } = require('../config/js/db');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Middleware kiểm tra admin
router.use(verifyToken);
router.use(isAdmin);

// ========== Lấy danh sách nhân viên ==========
router.get('/staff', async (req, res) => {
    try {
        const result = await executeQuery(`
            SELECT 
                u.user_id, 
                u.full_name, 
                u.email, 
                u.phone, 
                u.is_active, 
                u.created_at,
                sp.position,
                sp.salary
            FROM Users u
            LEFT JOIN StaffProfile sp ON u.user_id = sp.user_id
            WHERE u.role = 'staff'
            ORDER BY u.created_at DESC
        `);
        
        res.json(result.recordset);
    } catch (error) {
        console.error('Lỗi lấy staff:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// ========== 1. Lấy thống kê tổng quan + dữ liệu biểu đồ ==========
router.get('/stats', async (req, res) => {
    try {
        const { range = 'week' } = req.query;
        
        const now = new Date();
        let startDate, compareStartDate;
        let groupBy = '';
        let labels = [];
        
        // Xác định khoảng thời gian
        switch(range) {
            case 'day':
                startDate = new Date(now.setHours(0, 0, 0, 0));
                compareStartDate = new Date(now);
                compareStartDate.setDate(compareStartDate.getDate() - 1);
                compareStartDate.setHours(0, 0, 0, 0);
                groupBy = 'HOUR';
                // Tạo labels cho 24 giờ
                for (let i = 0; i <= 23; i++) labels.push(`${i}h`);
                break;
            case 'week':
                startDate = new Date(now);
                startDate.setDate(now.getDate() - 7);
                compareStartDate = new Date(now);
                compareStartDate.setDate(now.getDate() - 14);
                groupBy = 'DAY';
                // Labels cho 7 ngày
                labels = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                compareStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                groupBy = 'DAY';
                // Labels cho 4 tuần
                labels = ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4'];
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                compareStartDate = new Date(now.getFullYear() - 1, 0, 1);
                groupBy = 'MONTH';
                // Labels cho 12 tháng
                for (let i = 1; i <= 12; i++) labels.push(`Tháng ${i}`);
                break;
            default:
                startDate = new Date(now.setHours(0, 0, 0, 0));
                compareStartDate = new Date(now);
                compareStartDate.setDate(compareStartDate.getDate() - 1);
        }
        
        // 1. Tổng doanh thu và khách hàng kỳ hiện tại
        const currentStats = await executeQuery(`
            SELECT 
                ISNULL(SUM(total_amount), 0) as totalRevenue,
                COUNT(DISTINCT user_id) as totalCustomers,
                COUNT(*) as totalOrders
            FROM Orders 
            WHERE status = 'paid' AND created_at >= @startDate
        `, { startDate: startDate });
        
        // 2. Tổng doanh thu và khách hàng kỳ trước (để so sánh)
        const prevStats = await executeQuery(`
            SELECT 
                ISNULL(SUM(total_amount), 0) as totalRevenue,
                COUNT(DISTINCT user_id) as totalCustomers
            FROM Orders 
            WHERE status = 'paid' AND created_at >= @compareStartDate AND created_at < @startDate
        `, { compareStartDate: compareStartDate, startDate: startDate });
        
        // 3. Dữ liệu chi tiết cho biểu đồ (theo ngày/tuần/tháng)
        let revenueData = [];
        let customerData = [];
        
        if (range === 'week') {
            // Lấy dữ liệu 7 ngày gần nhất
            for (let i = 0; i < 7; i++) {
                const date = new Date();
                date.setDate(date.getDate() - (6 - i));
                const dayStart = new Date(date);
                dayStart.setHours(0, 0, 0, 0);
                const dayEnd = new Date(date);
                dayEnd.setHours(23, 59, 59, 999);
                
                const dayResult = await executeQuery(`
                    SELECT 
                        ISNULL(SUM(total_amount), 0) as revenue,
                        COUNT(DISTINCT user_id) as customers
                    FROM Orders 
                    WHERE status = 'paid' AND created_at BETWEEN @start AND @end
                `, { start: dayStart, end: dayEnd });
                
                revenueData.push(dayResult.recordset[0].revenue);
                customerData.push(dayResult.recordset[0].customers);
            }
        } else if (range === 'month') {
            // Lấy dữ liệu 4 tuần
            for (let week = 1; week <= 4; week++) {
                const weekStart = (week - 1) * 7 + 1;
                const weekEnd = week * 7;
                
                const weekResult = await executeQuery(`
                    SELECT 
                        ISNULL(SUM(total_amount), 0) as revenue,
                        COUNT(DISTINCT user_id) as customers
                    FROM Orders 
                    WHERE status = 'paid' 
                        AND DAY(created_at) BETWEEN @startDay AND @endDay
                        AND MONTH(created_at) = MONTH(GETDATE())
                `, { startDay: weekStart, endDay: weekEnd });
                
                revenueData.push(weekResult.recordset[0].revenue);
                customerData.push(weekResult.recordset[0].customers);
            }
        } else if (range === 'year') {
            // Lấy dữ liệu 12 tháng
            for (let month = 1; month <= 12; month++) {
                const monthResult = await executeQuery(`
                    SELECT 
                        ISNULL(SUM(total_amount), 0) as revenue,
                        COUNT(DISTINCT user_id) as customers
                    FROM Orders 
                    WHERE status = 'paid' 
                        AND MONTH(created_at) = @month
                        AND YEAR(created_at) = YEAR(GETDATE())
                `, { month: month });
                
                revenueData.push(monthResult.recordset[0].revenue);
                customerData.push(monthResult.recordset[0].customers);
            }
        } else {
            // Mặc định: 24 giờ
            for (let hour = 0; hour <= 23; hour++) {
                const hourResult = await executeQuery(`
                    SELECT 
                        ISNULL(SUM(total_amount), 0) as revenue,
                        COUNT(DISTINCT user_id) as customers
                    FROM Orders 
                    WHERE status = 'paid' 
                        AND DATEPART(hour, created_at) = @hour
                        AND CAST(created_at AS DATE) = CAST(GETDATE() AS DATE)
                `, { hour: hour });
                
                revenueData.push(hourResult.recordset[0].revenue);
                customerData.push(hourResult.recordset[0].customers);
            }
        }
        
        // Tính phần trăm thay đổi
        const currentRevenue = currentStats.recordset[0].totalRevenue;
        const prevRevenue = prevStats.recordset[0].totalRevenue;
        const revenueChange = prevRevenue === 0 ? 0 : ((currentRevenue - prevRevenue) / prevRevenue * 100).toFixed(1);
        
        const currentCustomers = currentStats.recordset[0].totalCustomers;
        const prevCustomers = prevStats.recordset[0].totalCustomers;
        const customersChange = prevCustomers === 0 ? 0 : ((currentCustomers - prevCustomers) / prevCustomers * 100).toFixed(1);
        
        res.json({
            // Thống kê tổng quan
            totalRevenue: currentRevenue,
            totalOrders: currentStats.recordset[0].totalOrders,
            totalCustomers: currentCustomers,
            revenueChange: parseFloat(revenueChange),
            ordersChange: parseFloat(revenueChange), // Tạm tính
            customersChange: parseFloat(customersChange),
            // Dữ liệu biểu đồ
            labels: labels,
            revenueData: revenueData,
            customerData: customerData,
            // Dữ liệu so sánh
            prevTotalRevenue: prevRevenue,
            prevTotalCustomers: prevCustomers
        });
        
    } catch (error) {
        console.error('Lỗi lấy stats:', error);
        res.status(500).json({ message: 'Lỗi server: ' + error.message });
    }
});

// ========== 2. Lấy dữ liệu biểu đồ (đầy đủ 12 tháng) ==========
router.get('/chart-data', async (req, res) => {
    try {
        const { range = 'year', type = 'revenue' } = req.query;
        
        let labels = [];
        let query = '';
        let values = [];
        
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        
        switch(range) {
            case 'year':
                for (let i = 1; i <= 12; i++) {
                    labels.push(`Tháng ${i}`);
                }
                
                query = `
                    SELECT 
                        MONTH(created_at) as month,
                        SUM(${type === 'revenue' ? 'total_amount' : 'total_amount * 0.7'}) as value
                    FROM Orders
                    WHERE status = 'paid' 
                        AND YEAR(created_at) = @year
                    GROUP BY MONTH(created_at)
                    ORDER BY month
                `;
                
                const yearResult = await executeQuery(query, { year: currentYear });
                
                values = new Array(12).fill(0);
                yearResult.recordset.forEach(row => {
                    values[row.month - 1] = row.value;
                });
                break;
                
            case 'month':
                labels = ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4'];
                
                query = `
                    SELECT 
                        CASE 
                            WHEN DAY(created_at) <= 7 THEN 1
                            WHEN DAY(created_at) <= 14 THEN 2
                            WHEN DAY(created_at) <= 21 THEN 3
                            ELSE 4
                        END as week,
                        SUM(${type === 'revenue' ? 'total_amount' : 'total_amount * 0.7'}) as value
                    FROM Orders
                    WHERE status = 'paid' 
                        AND MONTH(created_at) = @month
                        AND YEAR(created_at) = @year
                    GROUP BY 
                        CASE 
                            WHEN DAY(created_at) <= 7 THEN 1
                            WHEN DAY(created_at) <= 14 THEN 2
                            WHEN DAY(created_at) <= 21 THEN 3
                            ELSE 4
                        END
                    ORDER BY week
                `;
                
                const monthResult = await executeQuery(query, { 
                    month: currentMonth, 
                    year: currentYear 
                });
                
                values = new Array(4).fill(0);
                monthResult.recordset.forEach(row => {
                    values[row.week - 1] = row.value;
                });
                break;
                
            case 'week':
                labels = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
                
                query = `
                    SELECT 
                        DATEPART(dw, created_at) as weekday,
                        SUM(${type === 'revenue' ? 'total_amount' : 'total_amount * 0.7'}) as value
                    FROM Orders
                    WHERE status = 'paid' 
                        AND created_at >= DATEADD(day, -7, GETDATE())
                    GROUP BY DATEPART(dw, created_at)
                `;
                
                const weekResult = await executeQuery(query);
                values = new Array(7).fill(0);
                weekResult.recordset.forEach(row => {
                    let index = row.weekday - 2;
                    if (index === -1) index = 6;
                    values[index] = row.value;
                });
                break;
                
            case 'day':
                for (let i = 0; i <= 23; i++) {
                    labels.push(`${i}h`);
                }
                
                query = `
                    SELECT 
                        DATEPART(hour, created_at) as hour,
                        SUM(${type === 'revenue' ? 'total_amount' : 'total_amount * 0.7'}) as value
                    FROM Orders
                    WHERE status = 'paid' 
                        AND CAST(created_at AS DATE) = CAST(GETDATE() AS DATE)
                    GROUP BY DATEPART(hour, created_at)
                    ORDER BY hour
                `;
                
                const dayResult = await executeQuery(query);
                values = new Array(24).fill(0);
                dayResult.recordset.forEach(row => {
                    values[row.hour] = row.value;
                });
                break;
                
            default:
                labels = [];
                values = [];
        }
        
        res.json({ labels, values });
        
    } catch (error) {
        console.error('Lỗi lấy chart data:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// ========== 3. Lấy thống kê theo danh mục ==========
router.get('/category-stats', async (req, res) => {
    try {
        const { range = 'month' } = req.query;
        
        let startDate = new Date();
        switch(range) {
            case 'day':
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'week':
                startDate.setDate(startDate.getDate() - 7);
                break;
            case 'month':
                startDate.setDate(1);
                break;
            case 'year':
                startDate = new Date(startDate.getFullYear(), 0, 1);
                break;
        }
        
        const result = await executeQuery(`
            SELECT 
                c.category_name,
                ISNULL(SUM(oi.subtotal), 0) as total
            FROM Order_Items oi
            JOIN Menu_Items mi ON oi.item_id = mi.item_id
            JOIN Categories c ON mi.category_id = c.category_id
            JOIN Orders o ON oi.order_id = o.order_id
            WHERE o.status = 'paid' AND o.created_at >= @startDate
            GROUP BY c.category_name
            ORDER BY total DESC
        `, { startDate: startDate });
        
        const labels = result.recordset.map(r => r.category_name);
        const values = result.recordset.map(r => r.total);
        
        res.json({ labels, values });
        
    } catch (error) {
        console.error('Lỗi lấy category stats:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// ========== 4. Lấy top món bán chạy ==========
router.get('/top-items', async (req, res) => {
    try {
        const { range = 'month', search = '', sortBy = 'quantity' } = req.query;
        
        let startDate = new Date();
        switch(range) {
            case 'day':
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'week':
                startDate.setDate(startDate.getDate() - 7);
                break;
            case 'month':
                startDate.setDate(1);
                break;
            case 'year':
                startDate = new Date(startDate.getFullYear(), 0, 1);
                break;
        }
        
        const orderBy = sortBy === 'quantity' ? 'total_quantity DESC' : 'total_revenue DESC';
        
        const result = await executeQuery(`
            SELECT TOP 10
                mi.item_id,
                mi.item_name,
                c.category_name,
                SUM(oi.quantity) as total_quantity,
                SUM(oi.subtotal) as total_revenue,
                MAX(o.created_at) as last_sold_date
            FROM Order_Items oi
            JOIN Menu_Items mi ON oi.item_id = mi.item_id
            JOIN Categories c ON mi.category_id = c.category_id
            JOIN Orders o ON oi.order_id = o.order_id
            WHERE o.status = 'paid' AND o.created_at >= @startDate
                AND (@search = '' OR mi.item_name LIKE '%' + @search + '%')
            GROUP BY mi.item_id, mi.item_name, c.category_name
            ORDER BY ${orderBy}
        `, { 
            startDate: startDate,
            search: search || ''
        });
        
        res.json(result.recordset);
        
    } catch (error) {
        console.error('Lỗi lấy top items:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// ========== 5. Lấy đánh giá khách hàng ==========
router.get('/ratings', async (req, res) => {
    try {
        const { range = 'month' } = req.query;
        
        let startDate = new Date();
        switch(range) {
            case 'day':
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'week':
                startDate.setDate(startDate.getDate() - 7);
                break;
            case 'month':
                startDate.setDate(1);
                break;
            case 'year':
                startDate = new Date(startDate.getFullYear(), 0, 1);
                break;
        }
        
        const mockRatings = [
            { star: 5, count: 45, percent: 45 },
            { star: 4, count: 30, percent: 30 },
            { star: 3, count: 15, percent: 15 },
            { star: 2, count: 7, percent: 7 },
            { star: 1, count: 3, percent: 3 }
        ];
        
        res.json(mockRatings);
        
    } catch (error) {
        console.error('Lỗi lấy ratings:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// ========== QUẢN LÝ NHÂN VIÊN ==========

// Lấy profile nhân viên theo ID
router.get('/staff/:id/profile', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await executeQuery(`
            SELECT * FROM StaffProfile WHERE user_id = @user_id
        `, { user_id: id });
        
        res.json(result.recordset[0] || {});
    } catch (error) {
        console.error('Lỗi lấy profile:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// Thêm nhân viên mới
router.post('/staff', async (req, res) => {
    try {
        const { full_name, email, phone, password, is_active, profile } = req.body;
        
        const checkUser = await executeQuery(
            'SELECT * FROM Users WHERE email = @email',
            { email: email }
        );
        
        if (checkUser.recordset.length > 0) {
            return res.status(400).json({ message: 'Email đã tồn tại' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const userResult = await executeQuery(`
            INSERT INTO Users (full_name, email, phone, password_hash, role, is_active)
            OUTPUT INSERTED.user_id
            VALUES (@full_name, @email, @phone, @password_hash, 'staff', @is_active)
        `, {
            full_name: full_name,
            email: email,
            phone: phone,
            password_hash: hashedPassword,
            is_active: is_active ? 1 : 0
        });
        
        const userId = userResult.recordset[0].user_id;
        
        if (profile) {
            await executeQuery(`
                INSERT INTO StaffProfile (
                    user_id, full_name, date_of_birth, identity_number, phone,
                    address, bank_account, bank_name, bank_branch, position,
                    salary, hire_date, emergency_contact_name, emergency_contact_phone, notes
                ) VALUES (
                    @user_id, @full_name, @date_of_birth, @identity_number, @phone,
                    @address, @bank_account, @bank_name, @bank_branch, @position,
                    @salary, @hire_date, @emergency_contact_name, @emergency_contact_phone, @notes
                )
            `, {
                user_id: userId,
                full_name: full_name,
                date_of_birth: profile.date_of_birth || null,
                identity_number: profile.identity_number || null,
                phone: phone,
                address: profile.address || null,
                bank_account: profile.bank_account || null,
                bank_name: profile.bank_name || null,
                bank_branch: profile.bank_branch || null,
                position: profile.position || 'Nhân viên phục vụ',
                salary: profile.salary || 0,
                hire_date: profile.hire_date || new Date(),
                emergency_contact_name: profile.emergency_contact_name || null,
                emergency_contact_phone: profile.emergency_contact_phone || null,
                notes: profile.notes || null
            });
        }
        
        res.json({ success: true, message: 'Thêm nhân viên thành công' });
        
    } catch (error) {
        console.error('Lỗi thêm staff:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// Cập nhật nhân viên
router.put('/staff/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { full_name, email, phone, password, is_active, profile } = req.body;
        
        let query = `
            UPDATE Users 
            SET full_name = @full_name, email = @email, phone = @phone, is_active = @is_active
        `;
        let params = { full_name, email, phone, is_active: is_active ? 1 : 0, id: id };
        
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            query += `, password_hash = @password_hash`;
            params.password_hash = hashedPassword;
        }
        
        query += ` WHERE user_id = @id AND role = 'staff'`;
        await executeQuery(query, params);
        
        if (profile) {
            const existingProfile = await executeQuery(
                'SELECT * FROM StaffProfile WHERE user_id = @user_id',
                { user_id: id }
            );
            
            if (existingProfile.recordset.length > 0) {
                await executeQuery(`
                    UPDATE StaffProfile SET
                        full_name = @full_name,
                        date_of_birth = @date_of_birth,
                        identity_number = @identity_number,
                        phone = @phone,
                        address = @address,
                        bank_account = @bank_account,
                        bank_name = @bank_name,
                        bank_branch = @bank_branch,
                        position = @position,
                        salary = @salary,
                        hire_date = @hire_date,
                        emergency_contact_name = @emergency_contact_name,
                        emergency_contact_phone = @emergency_contact_phone,
                        notes = @notes,
                        updated_at = GETDATE()
                    WHERE user_id = @user_id
                `, {
                    user_id: id,
                    full_name: full_name,
                    date_of_birth: profile.date_of_birth || null,
                    identity_number: profile.identity_number || null,
                    phone: phone,
                    address: profile.address || null,
                    bank_account: profile.bank_account || null,
                    bank_name: profile.bank_name || null,
                    bank_branch: profile.bank_branch || null,
                    position: profile.position || 'Nhân viên phục vụ',
                    salary: profile.salary || 0,
                    hire_date: profile.hire_date || new Date(),
                    emergency_contact_name: profile.emergency_contact_name || null,
                    emergency_contact_phone: profile.emergency_contact_phone || null,
                    notes: profile.notes || null
                });
            } else {
                await executeQuery(`
                    INSERT INTO StaffProfile (
                        user_id, full_name, date_of_birth, identity_number, phone,
                        address, bank_account, bank_name, bank_branch, position,
                        salary, hire_date, emergency_contact_name, emergency_contact_phone, notes
                    ) VALUES (
                        @user_id, @full_name, @date_of_birth, @identity_number, @phone,
                        @address, @bank_account, @bank_name, @bank_branch, @position,
                        @salary, @hire_date, @emergency_contact_name, @emergency_contact_phone, @notes
                    )
                `, {
                    user_id: id,
                    full_name: full_name,
                    date_of_birth: profile.date_of_birth || null,
                    identity_number: profile.identity_number || null,
                    phone: phone,
                    address: profile.address || null,
                    bank_account: profile.bank_account || null,
                    bank_name: profile.bank_name || null,
                    bank_branch: profile.bank_branch || null,
                    position: profile.position || 'Nhân viên phục vụ',
                    salary: profile.salary || 0,
                    hire_date: profile.hire_date || new Date(),
                    emergency_contact_name: profile.emergency_contact_name || null,
                    emergency_contact_phone: profile.emergency_contact_phone || null,
                    notes: profile.notes || null
                });
            }
        }
        
        res.json({ success: true, message: 'Cập nhật thành công' });
        
    } catch (error) {
        console.error('Lỗi cập nhật staff:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// Vô hiệu hóa nhân viên
router.delete('/staff/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        await executeQuery(`
            UPDATE Users SET is_active = 0 WHERE user_id = @id AND role = 'staff'
        `, { id: id });
        
        res.json({ success: true, message: 'Đã vô hiệu hóa nhân viên' });
        
    } catch (error) {
        console.error('Lỗi vô hiệu hóa staff:', error);
        res.status(500).json({ message: 'Lỗi server: ' + error.message });
    }
});

// Cập nhật trạng thái nhân viên (vô hiệu hóa / kích hoạt)
router.put('/staff/:id/toggle-status', async (req, res) => {
    try {
        const { id } = req.params;
        const { is_active } = req.body;
        
        await executeQuery(`
            UPDATE Users SET is_active = @is_active WHERE user_id = @id AND role = 'staff'
        `, { id: id, is_active: is_active ? 1 : 0 });
        
        res.json({ success: true, message: `Đã ${is_active ? 'kích hoạt' : 'vô hiệu hóa'} nhân viên` });
        
    } catch (error) {
        console.error('Lỗi cập nhật trạng thái staff:', error);
        res.status(500).json({ message: 'Lỗi server: ' + error.message });
    }
});

module.exports = router;