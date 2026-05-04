const { executeQuery } = require('../config/js/db');
require('dotenv').config({ path: '../.env' });

(async () => {
    try {
        const result = await executeQuery("SELECT TOP 1 * FROM Menu_Items");
        if (result.recordset.length > 0) {
            console.log('Columns:', Object.keys(result.recordset[0]));
        } else {
            console.log('Table is empty');
        }
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
})();
