require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { getConnection } = require('./config/js/db');
const socketUtils = require('./utils/socket');

// Import routes
const verificationRoutes = require('./routes/verification.route');
const authRoutes = require('./routes/auth.route');  
const menuRoutes = require('./routes/menu.route');
const tableRoutes = require('./routes/table.route');
const adminRoutes = require('./routes/admin.route');
const orderRoutes = require('./routes/order.route');
const staffOrderRoutes = require('./routes/staffOrder.route');
const forgotPasswordRoutes = require('./routes/forgotPassword.route');
const paymentRoutes = require('./routes/payment.route');
const customerRoutes = require('./routes/customer.route');
const discountRoutes = require('./routes/discount.route');
const storeRoutes = require('./routes/store.route');
const recommendationRoutes = require('./routes/recommendation.route');
const attendanceRoutes = require('./routes/attendance.route');

const app = express();
const server = http.createServer(app);
const io = socketUtils.init(server);
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// === Phục vụ file tĩnh từ thư mục frontend ===
app.use(express.static(path.join(__dirname, '../frontend')));

// === Route trang chủ - main.html ===
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/main.html'));
});

// === Routes cho User ===
app.get('/user', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/user/index/html/index.html'));
});

// === Routes cho Admin ===
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/admin/dashboard/html/index.html'));
});

app.get('/admin/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/admin/auth/html/index.html'));
});

// === Routes cho Staff ===
app.get('/staff', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/staff/dashboard/html/staff-dashboard.html'));
});

app.get('/staff/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/staff/auth/html/index.html'));
});

// === API Routes ===
app.use('/api/verification', verificationRoutes);
app.use('/api/auth', authRoutes);  
app.use('/api/menu', menuRoutes); 
app.use('/api/tables', tableRoutes); 
app.use('/api/admin', adminRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/staff-orders', staffOrderRoutes);
app.use('/api/forgot-password', forgotPasswordRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/attendance', attendanceRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Server is running', 
        timestamp: new Date()
    });
});

// === Start server ===
async function startServer() {
    try {
        await getConnection();
        console.log('✅ Database connected');
        
        server.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
            console.log(`🏠 Main page: http://localhost:${PORT}`);
            console.log(`👤 User: http://localhost:${PORT}/user`);
            console.log(`👨‍💼 Admin: http://localhost:${PORT}/admin`);
            console.log(`👨‍🍳 Staff: http://localhost:${PORT}/staff`);
            console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
}

startServer();