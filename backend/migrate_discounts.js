const { executeQuery } = require('./config/js/db');
require('dotenv').config();

async function migrate() {
    try {
        console.log('Creating DiscountCodes table...');
        await executeQuery(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='DiscountCodes' AND xtype='U')
            CREATE TABLE DiscountCodes (
                code_id INT PRIMARY KEY IDENTITY(1,1),
                code NVARCHAR(50) UNIQUE NOT NULL,
                description NVARCHAR(255),
                discount_type NVARCHAR(20) NOT NULL, -- 'percentage' or 'fixed'
                discount_value DECIMAL(10,2) NOT NULL,
                min_order_amount DECIMAL(10,2) DEFAULT 0,
                max_discount_amount DECIMAL(10,2),
                usage_limit INT,
                usage_count INT DEFAULT 0,
                expiry_date DATETIME,
                type NVARCHAR(20) DEFAULT 'manual', -- 'loyalty', 'weekly', 'new_member', 'manual'
                points_required INT DEFAULT 0,
                is_active BIT DEFAULT 1,
                created_at DATETIME DEFAULT GETDATE(),
                updated_at DATETIME DEFAULT GETDATE()
            )
        `);

        console.log('Creating UserDiscounts table...');
        await executeQuery(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='UserDiscounts' AND xtype='U')
            CREATE TABLE UserDiscounts (
                user_id INT,
                code_id INT,
                used_at DATETIME,
                assigned_at DATETIME DEFAULT GETDATE(),
                PRIMARY KEY (user_id, code_id),
                FOREIGN KEY (user_id) REFERENCES Users(user_id),
                FOREIGN KEY (code_id) REFERENCES DiscountCodes(code_id)
            )
        `);

        console.log('Adding sample discount codes...');
        await executeQuery(`
            IF NOT EXISTS (SELECT * FROM DiscountCodes WHERE code = 'HELLO2026')
            INSERT INTO DiscountCodes (code, description, discount_type, discount_value, usage_limit, type, points_required)
            VALUES ('HELLO2026', 'Giảm 10% cho thành viên mới', 'percentage', 10, 100, 'new_member', 0)
        `);

        console.log('✅ Discount system migration completed!');
    } catch (error) {
        console.error('❌ Error during migration:', error.message);
    } finally {
        process.exit();
    }
}

migrate();
