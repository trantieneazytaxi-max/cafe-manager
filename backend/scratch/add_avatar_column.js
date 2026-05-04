const sql = require('mssql');

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
        
        console.log('Adding avatar_url column...');
        await sql.query("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'avatar_url') ALTER TABLE Users ADD avatar_url NVARCHAR(MAX);");
        
        console.log('Column added successfully');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

run();
