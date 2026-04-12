USE CafeManagement;
GO

-- Tạo bảng PasswordResets
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='PasswordResets' AND xtype='U')
BEGIN
    CREATE TABLE PasswordResets (
        id INT IDENTITY(1,1) PRIMARY KEY,
        email NVARCHAR(100) NOT NULL,
        token NVARCHAR(255) NOT NULL,
        expires_at DATETIME NOT NULL,
        is_used BIT DEFAULT 0,
        created_at DATETIME DEFAULT GETDATE()
    );
    
    CREATE INDEX idx_password_resets_email ON PasswordResets(email);
    CREATE INDEX idx_password_resets_token ON PasswordResets(token);
    
    PRINT '✅ Đã tạo bảng PasswordResets';
END
GO

