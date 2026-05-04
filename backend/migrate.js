const { getConnection, sql } = require('./config/js/db');
require('dotenv').config({ path: './.env' });

async function migrate() {
    try {
        const pool = await getConnection();
        console.log('Migrating database...');

        // 1. Combo_Items Table
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Combo_Items')
            BEGIN
                CREATE TABLE Combo_Items (
                    combo_item_id INT,
                    child_item_id INT,
                    quantity INT DEFAULT 1,
                    PRIMARY KEY (combo_item_id, child_item_id),
                    FOREIGN KEY (combo_item_id) REFERENCES Menu_Items(item_id),
                    FOREIGN KEY (child_item_id) REFERENCES Menu_Items(item_id)
                );
                PRINT 'Created Combo_Items table';
            END
        `);

        // 2. Orders Table updates
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'shipping_fee')
                ALTER TABLE Orders ADD shipping_fee DECIMAL(10, 2) DEFAULT 0;
            
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'distance_km')
                ALTER TABLE Orders ADD distance_km DECIMAL(10, 2) DEFAULT 0;

            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'lat')
                ALTER TABLE Orders ADD lat DECIMAL(18, 10) NULL;

            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'lng')
                ALTER TABLE Orders ADD lng DECIMAL(18, 10) NULL;

            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'guest_email')
                ALTER TABLE Orders ADD guest_email NVARCHAR(100) NULL;
            
            PRINT 'Updated Orders table columns';
        `);


        // 3. Menu_Items updates
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Menu_Items') AND name = 'is_combo')
                ALTER TABLE Menu_Items ADD is_combo BIT DEFAULT 0;
            
            PRINT 'Updated Menu_Items table columns';
        `);

        console.log('✅ Migration completed successfully');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    }
}

migrate();
