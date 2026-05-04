const { getConnection, sql } = require('../config/js/db');
require('dotenv').config({ path: '../.env' });

(async () => {
    try {
        const pool = await getConnection();
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Attendance' AND xtype='U')
            CREATE TABLE Attendance (
                attendance_id INT PRIMARY KEY IDENTITY,
                user_id INT FOREIGN KEY REFERENCES Users(user_id),
                check_in DATETIME DEFAULT GETDATE(),
                check_out DATETIME,
                ip_address NVARCHAR(50),
                status NVARCHAR(20) DEFAULT 'active'
            )
        `);
        console.log('Table Attendance created or already exists');
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
})();
