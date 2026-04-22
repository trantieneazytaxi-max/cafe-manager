require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { getConnection } = require('./config/js/db');

// Import routes
const verificationRoutes = require('./routes/verificationRoutes');
const authRoutes = require('./routes/authRoutes');  
const menuRoutes = require('./routes/menuRoutes');
const tableRoutes = require('./routes/tableRoutes');
const adminRoutes = require('./routes/adminRoutes');
const orderRoutes = require('./routes/orderRoutes');
const staffOrderRoutes = require('./routes/staffOrderRoutes');
const forgotPasswordRoutes = require('./routes/forgotPasswordRoutes');
const paymentRoutes = require('./routes/paymentRoutes'); // ✅ Đưa lên đây

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
    res.sendFile(path.join(__dirname, '../frontend/staff/dashboard/html/index.html'));
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
app.use('/api/payment', paymentRoutes); // ✅ Đặt ở đây, sau khi middleware đã được khai báo

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
        
        app.listen(PORT, () => {
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