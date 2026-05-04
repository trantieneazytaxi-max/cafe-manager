const sql = require('mssql');
require('dotenv').config({ path: '../.env' });

const dbConfig = {
    server: 'localhost',
    database: 'CafeManagement',
    user: 'cafe_user',
    password: 'Cafe@2026',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function run() {
    try {
        await sql.connect(dbConfig);
        console.log('Connected to DB');
        
        console.log('Creating indexes...');
        await sql.query("IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'IX_Orders_UserId') CREATE INDEX IX_Orders_UserId ON Orders(user_id);");
        await sql.query("IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'IX_OrderItems_OrderId') CREATE INDEX IX_OrderItems_OrderId ON Order_Items(order_id);");
        
        console.log('Indexes created successfully');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

run();
