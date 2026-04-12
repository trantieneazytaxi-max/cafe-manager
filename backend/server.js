require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { getConnection } = require('./config/js/db');

// --- Import routes ---
const verificationRoutes = require('./routes/verificationRoutes');
const authRoutes = require('./routes/authRoutes');  
const menuRoutes = require('./routes/menuRoutes');
const tableRoutes = require('./routes/tableRoutes');
const adminRoutes = require('./routes/adminRoutes');
const orderRoutes = require('./routes/orderRoutes');
const staffOrderRoutes = require('./routes/staffOrderRoutes');
const forgotPasswordRoutes = require('./routes/forgotPasswordRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- CẤU HÌNH GIAO DIỆN (FRONTEND) ---

// 1. Phục vụ các file tĩnh (CSS, JS, Hình ảnh) từ thư mục frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// 2. Thiết lập trang chủ mặc định là main.html
app.get('/', (req, res) => {
    const mainPath = path.join(__dirname, '../frontend/main.html');
    res.sendFile(mainPath, (err) => {
        if (err) {
            console.error('❌ Không tìm thấy file main.html:', err.message);
            res.status(404).send('Không tìm thấy file main.html trong thư mục frontend!');
        }
    });
});

// --- API Routes ---
app.use('/api/verification', verificationRoutes);
app.use('/api/auth', authRoutes);  
app.use('/api/menu', menuRoutes); 
app.use('/api/tables', tableRoutes); 
app.use('/api/admin', adminRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/staff-orders', staffOrderRoutes);
app.use('/api/forgot-password', forgotPasswordRoutes);

// Health check API
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Server đang chạy ổn định', 
        timestamp: new Date() 
    });
});

// --- Khởi động Server ---
async function startServer() {
    try {
        // Kiểm tra kết nối Database trước khi chạy Server
        await getConnection();
        console.log('✅ Database connected');
        
        app.listen(PORT, () => {
            console.log('---------------------------------------------------');
            console.log(`🚀 Server running on http://localhost:${PORT}`);
            console.log(`🔗 Trang chủ: http://localhost:${PORT}`);
            console.log(`📋 Kiểm tra API: http://localhost:${PORT}/api/health`);
            console.log('---------------------------------------------------');
        });
    } catch (error) {
        console.error('❌ Lỗi khởi động hệ thống:', error.message);
        // Không thoát process để bạn có thể đọc được lỗi trên terminal
    }
}

startServer();