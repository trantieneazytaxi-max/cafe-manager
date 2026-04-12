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

const app = express();
const PORT = process.env.PORT || 5000;

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- PHẦN SỬA ĐƯỜNG DẪN GIAO DIỆN ---

// 1. Phục vụ toàn bộ file tĩnh trong folder frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// 2. Trỏ vào đúng file index.html nằm TRONG thư mục index
app.get('/', (req, res) => {
    // Lưu ý: folder là 'user', sau đó vào folder 'index', rồi mới đến file 'index.html'
    const indexPath = path.join(__dirname, '../frontend/user/index/index.html');
    res.sendFile(indexPath);
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

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date() });
});

// --- Start server ---
async function startServer() {
    try {
        await getConnection();
        console.log('✅ Database connected');
        
        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
            console.log(`🔗 Link giao diện: http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
}

startServer();