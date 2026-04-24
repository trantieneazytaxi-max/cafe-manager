const { executeQuery } = require('./config/js/db');

async function migrate() {
    console.log('🚀 Bắt đầu cập nhật cấu trúc bảng Menu_Items...');
    try {
        // 1. Thêm cột customizations
        try {
            await executeQuery(`
                IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Menu_Items' AND COLUMN_NAME = 'customizations')
                BEGIN
                    ALTER TABLE Menu_Items ADD customizations NVARCHAR(MAX) NULL;
                    PRINT 'Đã thêm cột customizations';
                END
            `);
        } catch (e) { console.log('Lưu ý: Cột customizations có thể đã tồn tại.'); }

        // 2. Thêm cột is_paused
        try {
            await executeQuery(`
                IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Menu_Items' AND COLUMN_NAME = 'is_paused')
                BEGIN
                    ALTER TABLE Menu_Items ADD is_paused BIT DEFAULT 0;
                    PRINT 'Đã thêm cột is_paused';
                END
            `);
        } catch (e) { console.log('Lưu ý: Cột is_paused có thể đã tồn tại.'); }

        // 3. Thêm cột is_recommended
        try {
            await executeQuery(`
                IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Menu_Items' AND COLUMN_NAME = 'is_recommended')
                BEGIN
                    ALTER TABLE Menu_Items ADD is_recommended BIT DEFAULT 0;
                    PRINT 'Đã thêm cột is_recommended';
                END
            `);
        } catch (e) { console.log('Lưu ý: Cột is_recommended có thể đã tồn tại.'); }

        console.log('✅ Hoàn tất cập nhật database cho Menu_Items!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi migration:', error);
        process.exit(1);
    }
}

migrate();
