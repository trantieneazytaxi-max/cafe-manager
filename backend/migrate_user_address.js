/**
 * Thêm cột địa chỉ giao hàng mặc định cho Users (chạy một lần).
 * node migrate_user_address.js
 */
require('dotenv').config();
const { getConnection, executeQuery } = require('./config/js/db');

const batches = [
    `IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE Name = N'delivery_address' AND Object_ID = Object_ID(N'Users'))
        ALTER TABLE Users ADD delivery_address NVARCHAR(500) NULL;`,
    `IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE Name = N'delivery_lat' AND Object_ID = Object_ID(N'Users'))
        ALTER TABLE Users ADD delivery_lat DECIMAL(10, 7) NULL;`,
    `IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE Name = N'delivery_lng' AND Object_ID = Object_ID(N'Users'))
        ALTER TABLE Users ADD delivery_lng DECIMAL(10, 7) NULL;`
];

async function run() {
    await getConnection();
    for (const sql of batches) {
        await executeQuery(sql);
    }
    console.log('✅ migrate_user_address: xong');
    process.exit(0);
}

run().catch((e) => {
    console.error(e);
    process.exit(1);
});
