require('dotenv').config();
const { executeQuery } = require('./config/js/db');

async function migrate() {
    try {
        console.log('--- Migrating Reviews Table ---');
        
        // 1. Create Reviews table
        await executeQuery(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Reviews')
            BEGIN
                CREATE TABLE Reviews (
                    review_id INT PRIMARY KEY IDENTITY(1,1),
                    order_id INT NOT NULL,
                    user_id INT NOT NULL,
                    rating INT CHECK (rating >= 1 AND rating <= 5),
                    comment NVARCHAR(MAX),
                    staff_reply NVARCHAR(MAX),
                    replied_at DATETIME,
                    created_at DATETIME DEFAULT GETDATE(),
                    CONSTRAINT FK_Reviews_Orders FOREIGN KEY (order_id) REFERENCES Orders(order_id),
                    CONSTRAINT FK_Reviews_Users FOREIGN KEY (user_id) REFERENCES Users(user_id)
                );
                PRINT 'Created Reviews table';
            END
            ELSE
            BEGIN
                PRINT 'Reviews table already exists';
            END
        `);

        console.log('✅ Migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrate();
