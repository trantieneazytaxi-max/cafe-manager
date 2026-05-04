const sql = require('mssql');

const dbServer = process.env.DB_SERVER || 'localhost';
const dbInstance = process.env.DB_INSTANCE;
const [host, instanceFromServer] = dbServer.split('\\', 2);

const dbConfig = {
    server: host,
    database: process.env.DB_NAME || 'CafeManagement',
    user: process.env.DB_USER || 'cafe_user',
    password: process.env.DB_PASSWORD || 'Cafe@2026',
    requestTimeout: 30000, // Tăng lên 30s
    connectionTimeout: 30000,
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
    },
    pool: {
        max: 20, // Tăng số lượng connection
        min: 0,
        idleTimeoutMillis: 30000
    }
};

const instanceName = dbInstance || instanceFromServer;
if (!process.env.DB_PORT && instanceName) {
    dbConfig.options.instanceName = instanceName;
}

if (process.env.DB_PORT) {
    dbConfig.port = parseInt(process.env.DB_PORT, 10);
}

let pool = null;

async function getConnection() {
    try {
        if (pool) {
            return pool;
        }
        pool = await sql.connect(dbConfig);
        console.log('✅ Kết nối SQL Server thành công!');
        return pool;
    } catch (error) {
        console.error('❌ Lỗi kết nối SQL Server:', error.message);
        throw error;
    }
}

// SỬA LẠI HÀM executeQuery
async function executeQuery(query, params = {}) {
    try {
        const connection = await getConnection();
        const request = connection.request();
        
        // Thêm parameters (null hợp lệ cho SET cột NULL)
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined) {
                request.input(key, value);
            }
        }
        
        const result = await request.query(query);
        return result;
    } catch (error) {
        console.error('Lỗi thực thi query:', error);
        throw error;
    }
}

// SỬA LẠI HÀM executeStoredProcedure
async function executeStoredProcedure(procedureName, params = {}) {
    try {
        const connection = await getConnection();
        const request = connection.request();
        
        // Thêm parameters
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined && value !== null) {
                // Kiểm tra nếu là output parameter
                if (typeof value === 'object' && value.output === true) {
                    request.output(key, value.type || sql.NVarChar, value.size || 50);
                } else {
                    request.input(key, value);
                }
            }
        }
        
        const result = await request.execute(procedureName);
        return result;
    } catch (error) {
        console.error(`Lỗi thực thi procedure ${procedureName}:`, error);
        throw error;
    }
}

module.exports = {
    getConnection,
    executeQuery,
    executeStoredProcedure,
    sql
};