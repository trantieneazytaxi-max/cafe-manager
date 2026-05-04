const { executeQuery } = require('./config/js/db');

async function migrate() {
    console.log('Bắt đầu cập nhật cấu trúc bảng StaffProfile...');
    
    try {
        // Kiểm tra và thêm cột position
        try {
            await executeQuery('ALTER TABLE StaffProfile ADD position NVARCHAR(100)');
            console.log('✅ Đã thêm cột position');
        } catch (e) { console.log('ℹ️ Cột position đã tồn tại hoặc không thể thêm'); }

        // Kiểm tra và thêm cột salary
        try {
            await executeQuery('ALTER TABLE StaffProfile ADD salary DECIMAL(18, 2)');
            console.log('✅ Đã thêm cột salary');
        } catch (e) { console.log('ℹ️ Cột salary đã tồn tại hoặc không thể thêm'); }

        // Kiểm tra và thêm cột bank_account
        try {
            await executeQuery('ALTER TABLE StaffProfile ADD bank_account NVARCHAR(50)');
            console.log('✅ Đã thêm cột bank_account');
        } catch (e) { console.log('ℹ️ Cột bank_account đã tồn tại hoặc không thể thêm'); }

        // Kiểm tra và thêm cột bank_name
        try {
            await executeQuery('ALTER TABLE StaffProfile ADD bank_name NVARCHAR(100)');
            console.log('✅ Đã thêm cột bank_name');
        } catch (e) { console.log('ℹ️ Cột bank_name đã tồn tại hoặc không thể thêm'); }

        // Kiểm tra và thêm cột date_of_birth
        try {
            await executeQuery('ALTER TABLE StaffProfile ADD date_of_birth DATE');
            console.log('✅ Đã thêm cột date_of_birth');
        } catch (e) { console.log('ℹ️ Cột date_of_birth đã tồn tại hoặc không thể thêm'); }

        // Kiểm tra và thêm cột identity_number
        try {
            await executeQuery('ALTER TABLE StaffProfile ADD identity_number NVARCHAR(20)');
            console.log('✅ Đã thêm cột identity_number');
        } catch (e) { console.log('ℹ️ Cột identity_number đã tồn tại hoặc không thể thêm'); }

        // Kiểm tra và thêm cột address
        try {
            await executeQuery('ALTER TABLE StaffProfile ADD address NVARCHAR(255)');
            console.log('✅ Đã thêm cột address');
        } catch (e) { console.log('ℹ️ Cột address đã tồn tại hoặc không thể thêm'); }

        // Kiểm tra và thêm cột hire_date
        try {
            await executeQuery('ALTER TABLE StaffProfile ADD hire_date DATE');
            console.log('✅ Đã thêm cột hire_date');
        } catch (e) { console.log('ℹ️ Cột hire_date đã tồn tại hoặc không thể thêm'); }

        console.log('🚀 Hoàn tất cập nhật database!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi migration:', error);
        process.exit(1);
    }
}

migrate();
