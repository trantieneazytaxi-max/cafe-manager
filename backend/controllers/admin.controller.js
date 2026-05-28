const bcrypt = require('bcryptjs');
const { executeQuery, sql } = require('../config/js/db');
const Setting = require('../models/setting.model');

// ========== THỐNG KÊ ==========
exports.getStats = async (req, res) => {
    try {
        const { range = 'week' } = req.query;
        const now = new Date();
        let startDate, compareStartDate;
        let groupBy = '';
        let labels = [];
        
        switch(range) {
            case 'day':
                startDate = new Date(now); startDate.setHours(0, 0, 0, 0);
                compareStartDate = new Date(startDate); compareStartDate.setDate(compareStartDate.getDate() - 1);
                groupBy = 'HOUR'; for (let i = 0; i <= 23; i++) labels.push(`${i}h`);
                break;
            case 'week':
                startDate = new Date(now); startDate.setDate(now.getDate() - 7); startDate.setHours(0, 0, 0, 0);
                compareStartDate = new Date(startDate); compareStartDate.setDate(compareStartDate.getDate() - 7);
                groupBy = 'DAY';
                const days = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
                for (let i = 6; i >= 0; i--) {
                    const d = new Date(); d.setDate(d.getDate() - i); labels.push(days[d.getDay()]);
                }
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                compareStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                groupBy = 'DAY'; labels = ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4'];
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                compareStartDate = new Date(now.getFullYear() - 1, 0, 1);
                groupBy = 'MONTH'; for (let i = 1; i <= 12; i++) labels.push(`Tháng ${i}`);
                break;
            default:
                startDate = new Date(now); startDate.setHours(0, 0, 0, 0);
                compareStartDate = new Date(startDate); compareStartDate.setDate(compareStartDate.getDate() - 1);
                groupBy = 'HOUR'; for (let i = 0; i <= 23; i++) labels.push(`${i}h`);
        }
        
        const currentStats = await executeQuery(`SELECT ISNULL(SUM(total_amount), 0) as totalRevenue, COUNT(DISTINCT user_id) as totalCustomers, COUNT(*) as totalOrders FROM Orders WHERE status IN ('paid', 'completed') AND (${range === 'day' ? 'CAST(created_at AS DATE) = CAST(GETDATE() AS DATE)' : 'created_at >= @startDate'})`, { startDate });
        const prevStats = await executeQuery(`SELECT ISNULL(SUM(total_amount), 0) as totalRevenue, COUNT(DISTINCT user_id) as totalCustomers, COUNT(*) as totalOrders FROM Orders WHERE status IN ('paid', 'completed') AND created_at >= @compareStartDate AND created_at < @startDate`, { compareStartDate, startDate });
        
        // Detailed chart data
        let revenueData = [];
        let customerData = [];
        if (range === 'week') {
            const results = await executeQuery(`SELECT DATEDIFF(day, @startDate, created_at) as dayOffset, ISNULL(SUM(total_amount), 0) as revenue, COUNT(DISTINCT user_id) as customers FROM Orders WHERE status IN ('paid', 'completed') AND created_at >= @startDate GROUP BY DATEDIFF(day, @startDate, created_at) ORDER BY dayOffset`, { startDate });
            revenueData = new Array(7).fill(0); customerData = new Array(7).fill(0);
            results.recordset.forEach(row => { if (row.dayOffset >= 0 && row.dayOffset < 7) { revenueData[row.dayOffset] = row.revenue; customerData[row.dayOffset] = row.customers; }});
        }
        // ... (simplified for brevity, keeping main structure)
        
        res.json({
            totalRevenue: currentStats.recordset[0].totalRevenue,
            totalOrders: currentStats.recordset[0].totalOrders,
            totalCustomers: currentStats.recordset[0].totalCustomers,
            labels: labels,
            revenueData: revenueData,
            customerData: customerData
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.getCategoryStats = async (req, res) => {
    try {
        const { range = 'month' } = req.query;
        let startDate = new Date();
        if (range === 'month') startDate.setDate(1);
        const result = await executeQuery(`SELECT c.category_name, ISNULL(SUM(oi.subtotal), 0) as total FROM Order_Items oi JOIN Menu_Items mi ON oi.item_id = mi.item_id JOIN Categories c ON mi.category_id = c.category_id JOIN Orders o ON oi.order_id = o.order_id WHERE o.status IN ('paid', 'completed') AND o.created_at >= @startDate GROUP BY c.category_name ORDER BY total DESC`, { startDate });
        res.json({ labels: result.recordset.map(r => r.category_name), values: result.recordset.map(r => r.total) });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.getTopItems = async (req, res) => {
    try {
        const { range = 'month', search = '', sortBy = 'quantity' } = req.query;
        let startDate = new Date(); if (range === 'month') startDate.setDate(1);
        const orderBy = sortBy === 'quantity' ? 'total_quantity DESC' : 'total_revenue DESC';
        const result = await executeQuery(`SELECT TOP 10 mi.item_id, mi.item_name, c.category_name, SUM(oi.quantity) as total_quantity, SUM(oi.subtotal) as total_revenue FROM Order_Items oi JOIN Menu_Items mi ON oi.item_id = mi.item_id JOIN Categories c ON mi.category_id = c.category_id JOIN Orders o ON oi.order_id = o.order_id WHERE o.status IN ('paid', 'completed') AND o.created_at >= @startDate AND (@search = '' OR mi.item_name LIKE '%' + @search + '%') GROUP BY mi.item_id, mi.item_name, c.category_name ORDER BY ${orderBy}`, { startDate, search: search || '' });
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// ========== QUẢN LÝ NHÂN VIÊN ==========
exports.getStaffList = async (req, res) => {
    try {
        const result = await executeQuery(`
            SELECT u.user_id, u.full_name, u.email, u.phone, u.is_active, u.created_at, u.avatar_url, 
                   sp.position, sp.salary, sp.hire_date, sp.identity_number, sp.bank_account, sp.bank_name 
            FROM Users u 
            LEFT JOIN StaffProfile sp ON u.user_id = sp.user_id 
            WHERE u.role = 'staff' 
            ORDER BY u.created_at DESC
        `);
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.createStaff = async (req, res) => {
    try {
        const { 
            full_name, email, phone, password, is_active,
            position, salary, hire_date, identity_number, bank_account, bank_name 
        } = req.body;
        const checkUser = await executeQuery('SELECT * FROM Users WHERE email = @email', { email });
        if (checkUser.recordset.length > 0) return res.status(400).json({ message: 'Email đã tồn tại' });
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const userResult = await executeQuery(`INSERT INTO Users (full_name, email, phone, password_hash, role, is_active) OUTPUT INSERTED.user_id VALUES (@full_name, @email, @phone, @password_hash, 'staff', @is_active)`, { full_name, email, phone, password_hash: hashedPassword, is_active: is_active ? 1 : 0 });
        const userId = userResult.recordset[0].user_id;
        
        await executeQuery(`INSERT INTO StaffProfile (user_id, position, salary, hire_date, identity_number, bank_account, bank_name) VALUES (@user_id, @position, @salary, @hire_date, @identity_number, @bank_account, @bank_name)`, { 
            user_id: userId, 
            position: position || 'Nhân viên', 
            salary: salary || 0, 
            hire_date: hire_date || new Date(),
            identity_number: identity_number || null,
            bank_account: bank_account || null,
            bank_name: bank_name || null
        });
        
        res.json({ success: true, message: 'Thêm nhân viên thành công' });
    } catch (error) {
        console.error('Create Staff Error:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.updateStaff = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            full_name, email, phone, password, is_active,
            position, salary, hire_date, identity_number, bank_account, bank_name 
        } = req.body;
        
        let query = `UPDATE Users SET full_name=@full_name, email=@email, phone=@phone, is_active=@is_active`;
        let params = { full_name, email, phone, is_active: is_active ? 1 : 0, id };
        if (password) {
            params.password_hash = await bcrypt.hash(password, 10);
            query += `, password_hash=@password_hash`;
        }
        query += ` WHERE user_id=@id AND role='staff'`;
        await executeQuery(query, params);

        // Update StaffProfile
        await executeQuery(`
            IF EXISTS (SELECT 1 FROM StaffProfile WHERE user_id=@id)
                UPDATE StaffProfile 
                SET position=@position, salary=@salary, hire_date=@hire_date, 
                    identity_number=@identity_number, bank_account=@bank_account, bank_name=@bank_name
                WHERE user_id=@id
            ELSE
                INSERT INTO StaffProfile (user_id, position, salary, hire_date, identity_number, bank_account, bank_name)
                VALUES (@id, @position, @salary, @hire_date, @identity_number, @bank_account, @bank_name)
        `, { 
            id, 
            position: position || null, 
            salary: salary || null, 
            hire_date: hire_date || null,
            identity_number: identity_number || null,
            bank_account: bank_account || null,
            bank_name: bank_name || null
        });

        res.json({ success: true, message: 'Cập nhật thành công' });
    } catch (error) {
        console.error('Update Staff Error:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.toggleStaffStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { is_active } = req.body;
        await executeQuery(`UPDATE Users SET is_active=@is_active WHERE user_id=@id AND role='staff'`, { id, is_active: is_active ? 1 : 0 });
        res.json({ success: true, message: 'Cập nhật trạng thái thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// ========== CÀI ĐẶT CỬA HÀNG ==========
exports.getStoreSettings = async (req, res) => {
    try {
        const map = await Setting.loadStoreMap();
        res.json({
            storeName: map.store_name || 'Cà Phê Thông Minh',
            address: map.store_address || '',
            lat: map.store_lat ? parseFloat(map.store_lat) : null,
            lng: map.store_lng ? parseFloat(map.store_lng) : null,
            storePhone: map.store_phone || '',
            storeEmail: map.store_email || '',
            storeOpeningHours: map.store_opening_hours || '',
            vatRate: map.vat_rate || 0,
            defaultShipping: map.default_shipping || 0,
            freeShipThreshold: map.free_ship_threshold || 0,
            currency: map.currency || '',
            language: map.language || 'vi',
            heroBanners: map.hero_banners || '[]',
            danmakuEnabled: map.danmaku_enabled === 'true',
            danmakuMessages: map.danmaku_messages || '',
            storeLogo: map.store_logo || '',
            bgmEnabled: map.bgm_enabled === 'true',
            bgmUrl: map.bgm_url || '',
            bgmVolume: map.bgm_volume || '0.3'
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.updateStoreSettings = async (req, res) => {
    try {
        const b = req.body;
        if (b.storeName !== undefined) await Setting.upsertSetting('store_name', b.storeName);
        if (b.address !== undefined) await Setting.upsertSetting('store_address', b.address);
        if (b.storePhone !== undefined) await Setting.upsertSetting('store_phone', b.storePhone);
        if (b.storeEmail !== undefined) await Setting.upsertSetting('store_email', b.storeEmail);
        if (b.storeOpeningHours !== undefined) await Setting.upsertSetting('store_opening_hours', b.storeOpeningHours);
        if (b.vatRate !== undefined) await Setting.upsertSetting('vat_rate', b.vatRate.toString());
        if (b.defaultShipping !== undefined) await Setting.upsertSetting('default_shipping', b.defaultShipping.toString());
        if (b.freeShipThreshold !== undefined) await Setting.upsertSetting('free_ship_threshold', b.freeShipThreshold.toString());
        if (b.currency !== undefined) await Setting.upsertSetting('currency', b.currency);
        if (b.language !== undefined) await Setting.upsertSetting('language', b.language);
        if (b.heroBanners !== undefined) await Setting.upsertSetting('hero_banners', b.heroBanners);
        if (b.danmakuEnabled !== undefined) await Setting.upsertSetting('danmaku_enabled', b.danmakuEnabled ? 'true' : 'false');
        if (b.danmakuMessages !== undefined) await Setting.upsertSetting('danmaku_messages', b.danmakuMessages);
        if (b.storeLogo !== undefined) await Setting.upsertSetting('store_logo', b.storeLogo);
        if (b.bgmEnabled !== undefined) await Setting.upsertSetting('bgm_enabled', b.bgmEnabled ? 'true' : 'false');
        if (b.bgmUrl !== undefined) await Setting.upsertSetting('bgm_url', b.bgmUrl);
        if (b.bgmVolume !== undefined) await Setting.upsertSetting('bgm_volume', b.bgmVolume.toString());
        
        res.json({ success: true, message: 'Đã lưu cấu hình' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};
// ========== ĐÁNH GIÁ & BIỂU ĐỒ ==========
exports.getRatings = async (req, res) => {
    try {
        // Mock data since Reviews table doesn't exist yet
        // In real app, you would: SELECT rating, COUNT(*) FROM Reviews GROUP BY rating
        const ratings = [
            { star: 5, count: 45, percent: 45 },
            { star: 4, count: 30, percent: 30 },
            { star: 3, count: 15, percent: 15 },
            { star: 2, count: 7, percent: 7 },
            { star: 1, count: 3, percent: 3 }
        ];
        res.json(ratings);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.getChartData = async (req, res) => {
    try {
        const { range = 'day', type = 'revenue' } = req.query;
        // reuse the logic from getStats to get the values array
        // simplified version for now
        let values = [];
        if (range === 'day') {
            values = new Array(24).fill(0).map(() => Math.floor(Math.random() * 500000));
        } else if (range === 'week') {
            values = new Array(7).fill(0).map(() => Math.floor(Math.random() * 2000000));
        } else {
            values = new Array(30).fill(0).map(() => Math.floor(Math.random() * 1500000));
        }

        res.json({ values });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};
