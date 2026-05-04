const { executeQuery } = require('./config/js/db');

async function migrate() {
    console.log('Bắt đầu cập nhật cấu trúc database cho Chấm công & Lịch làm việc...');
    
    try {
        // 1. Tạo bảng Shifts (Ca làm việc)
        try {
            await executeQuery(`
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Shifts')
                BEGIN
                    CREATE TABLE Shifts (
                        shift_id INT PRIMARY KEY IDENTITY(1,1),
                        name NVARCHAR(50) NOT NULL,
                        start_time TIME NOT NULL,
                        end_time TIME NOT NULL,
                        color NVARCHAR(20) DEFAULT '#3498db'
                    )
                    
                    INSERT INTO Shifts (name, start_time, end_time, color) VALUES 
                    (N'Ca Sáng', '06:00:00', '12:00:00', '#f1c40f'),
                    (N'Ca Chiều', '12:00:00', '18:00:00', '#e67e22'),
                    (N'Ca Tối', '18:00:00', '22:00:00', '#9b59b6')
                END
            `);
            console.log('✅ Bảng Shifts đã sẵn sàng');
        } catch (e) { console.log('ℹ️ Lỗi tạo bảng Shifts:', e.message); }

        // 2. Tạo bảng WorkSchedules (Lịch làm việc)
        try {
            await executeQuery(`
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'WorkSchedules')
                BEGIN
                    CREATE TABLE WorkSchedules (
                        schedule_id INT PRIMARY KEY IDENTITY(1,1),
                        user_id INT NOT NULL FOREIGN KEY REFERENCES Users(user_id),
                        shift_id INT NOT NULL FOREIGN KEY REFERENCES Shifts(shift_id),
                        work_date DATE NOT NULL,
                        note NVARCHAR(255),
                        created_at DATETIME DEFAULT GETDATE(),
                        CONSTRAINT UC_UserDate UNIQUE (user_id, work_date)
                    )
                END
            `);
            console.log('✅ Bảng WorkSchedules đã sẵn sàng');
        } catch (e) { console.log('ℹ️ Lỗi tạo bảng WorkSchedules:', e.message); }

        // 3. Cập nhật bảng Attendance
        try {
            await executeQuery('ALTER TABLE Attendance ADD shift_id INT FOREIGN KEY REFERENCES Shifts(shift_id)');
            console.log('✅ Đã thêm cột shift_id vào Attendance');
        } catch (e) { console.log('ℹ️ Cột shift_id đã tồn tại hoặc không thể thêm'); }

        try {
            await executeQuery('ALTER TABLE Attendance ADD note NVARCHAR(255)');
            console.log('✅ Đã thêm cột note vào Attendance');
        } catch (e) { console.log('ℹ️ Cột note đã tồn tại hoặc không thể thêm'); }

        console.log('🚀 Hoàn tất migration Attendance & WorkSchedules!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi migration:', error);
        process.exit(1);
    }
}

migrate();
