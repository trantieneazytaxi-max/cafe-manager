USE CafeManagement;
GO

-- Tạo bảng StaffProfile
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='StaffProfile' AND xtype='U')
BEGIN
    CREATE TABLE StaffProfile (
        profile_id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL UNIQUE,
        full_name NVARCHAR(100) NOT NULL,
        date_of_birth DATE,
        identity_number NVARCHAR(20),
        phone NVARCHAR(15) NOT NULL,
        bank_account NVARCHAR(50),
        bank_name NVARCHAR(100),
        bank_branch NVARCHAR(200),
        address NVARCHAR(255),
        hire_date DATE DEFAULT GETDATE(),
        position NVARCHAR(100),
        salary DECIMAL(12,2) DEFAULT 0,
        emergency_contact_name NVARCHAR(100),
        emergency_contact_phone NVARCHAR(15),
        notes NVARCHAR(500),
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
    );
    
    PRINT '✅ Đã tạo bảng StaffProfile';
END
GO

-- Tạo trigger để tự động cập nhật updated_at
CREATE TRIGGER trg_StaffProfile_Update
ON StaffProfile
AFTER UPDATE
AS
BEGIN
    UPDATE StaffProfile
    SET updated_at = GETDATE()
    WHERE profile_id IN (SELECT DISTINCT profile_id FROM inserted);
END
GO

PRINT '✅ Đã tạo trigger cho StaffProfile';
GO