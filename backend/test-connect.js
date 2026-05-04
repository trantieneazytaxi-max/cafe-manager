const sql = require('mssql');
require('dotenv').config();

const dbServer = process.env.DB_SERVER || 'localhost';
const dbInstance = process.env.DB_INSTANCE;
const [host, instanceFromServer] = dbServer.split('\\', 2);

const config = {
    server: host,
    database: process.env.DB_NAME || 'CafeManagement',
    user: process.env.DB_USER || 'cafe_user',
    password: process.env.DB_PASSWORD || 'Cafe@2026',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
    }
};

const instanceName = dbInstance || instanceFromServer;
if (!process.env.DB_PORT && instanceName) {
    config.options.instanceName = instanceName;
}

if (process.env.DB_PORT) {
    config.port = parseInt(process.env.DB_PORT, 10);
}

async function testConnection() {
    console.log('🔌 Đang kết nối đến SQL Server...');
    console.log(`   Server: ${config.server}${config.options.instanceName ? '\\' + config.options.instanceName : ''}`);
    console.log(`   Port: ${config.port || '(default)'}`);
    console.log(`   Database: ${config.database}`);
    console.log(`   User: ${config.user}`);
    console.log('');
    
    try {
        // Thử kết nối
        const pool = await sql.connect(config);
        console.log('✅ KẾT NỐI THÀNH CÔNG!');
        
        // Thử query đơn giản - SỬA current_user thành [current_user]
        const result = await pool.request().query(`
            SELECT 
                DB_NAME() as database_name,
                USER_NAME() as current_user_name,
                @@VERSION as sql_version
        `);
        
        console.log('\n📊 Thông tin database:');
        console.log(`   - Database: ${result.recordset[0].database_name}`);
        console.log(`   - Current User: ${result.recordset[0].current_user_name}`);
        console.log(`   - SQL Version: ${result.recordset[0].sql_version.substring(0, 60)}...`);
        
        // Kiểm tra bảng Otps
        const tableCheck = await pool.request().query(`
            SELECT COUNT(*) as count 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME = 'Otps'
        `);
        
        if (tableCheck.recordset[0].count > 0) {
            console.log(`   - ✅ Bảng Otps: Đã tồn tại`);
        } else {
            console.log(`   - ⚠️ Bảng Otps: Chưa tồn tại (cần chạy update-otp-table.sql)`);
        }
        
        // Kiểm tra bảng Users
        const userCheck = await pool.request().query(`
            SELECT COUNT(*) as count 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME = 'Users'
        `);
        
        if (userCheck.recordset[0].count > 0) {
            console.log(`   - ✅ Bảng Users: Đã tồn tại`);
            
            // Đếm số user
            const userCount = await pool.request().query(`SELECT COUNT(*) as count FROM Users`);
            console.log(`   - 📋 Số lượng Users: ${userCount.recordset[0].count}`);
        } else {
            console.log(`   - ⚠️ Bảng Users: Chưa tồn tại (cần chạy CafeManagement.sql)`);
        }
        
        console.log('\n🎉 Kết nối database thành công! Backend đã sẵn sàng.');
        
        // Đóng kết nối
        await sql.close();
        
    } catch (error) {
        console.error('\n❌ KẾT NỐI THẤT BẠI!');
        console.error(`   Lỗi: ${error.message}`);
        console.log('\n💡 Kiểm tra lại:');
        console.log('   1. SQL Server có đang chạy không?');
        console.log('   2. File .env đã cấu hình đúng chưa?');
        console.log('   3. Tài khoản cafe_user đã được tạo chưa?');
        console.log('   4. Firewall có chặn port không?');
    }
}

// Chạy test
testConnection();