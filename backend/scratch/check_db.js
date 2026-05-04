const mssql = require('mssql');
require('dotenv').config({ path: '../.env' });

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

async function checkTable() {
    try {
        await mssql.connect(config);
        console.log('Connected to DB');
        
        const result = await mssql.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'StaffProfile'
        `);
        
        console.log('Columns in StaffProfile:');
        result.recordset.forEach(col => console.log(col.COLUMN_NAME));
        
        await mssql.close();
    } catch (err) {
        console.error('Error:', err);
    }
}

checkTable();
