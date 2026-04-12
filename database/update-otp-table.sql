-- ============================================
-- CẬP NHẬT DATABASE: THÊM BẢNG OTP
-- Dùng cho xác thực email và SMS thật
-- ============================================

USE CafeManagement;
GO

-- Tạo bảng OTP nếu chưa tồn tại
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Otps' AND xtype='U')
BEGIN
    CREATE TABLE Otps (
        otp_id INT IDENTITY(1,1) PRIMARY KEY,
        email NVARCHAR(100) NULL,
        phone NVARCHAR(15) NULL,
        otp_code NVARCHAR(6) NOT NULL,
        purpose NVARCHAR(20) CHECK (purpose IN ('register', 'login', 'forgot_password')) NOT NULL,
        expires_at DATETIME NOT NULL,
        is_used BIT DEFAULT 0,
        is_verified BIT DEFAULT 0,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
    );

    -- Tạo index cho tốc độ truy vấn
    CREATE INDEX idx_otps_email ON Otps(email);
    CREATE INDEX idx_otps_phone ON Otps(phone);
    CREATE INDEX idx_otps_expires_at ON Otps(expires_at);
    CREATE INDEX idx_otps_purpose ON Otps(purpose);
    
    PRINT 'Bảng Otps đã được tạo thành công!';
END
ELSE
BEGIN
    PRINT 'Bảng Otps đã tồn tại. Bỏ qua bước tạo.';
END
GO

-- ============================================
-- TẠO STORED PROCEDURE TẠO OTP
-- ============================================
CREATE OR ALTER PROCEDURE sp_CreateOTP
    @email NVARCHAR(100) = NULL,
    @phone NVARCHAR(15) = NULL,
    @purpose NVARCHAR(20),
    @otp_code NVARCHAR(6) OUTPUT
AS
BEGIN
    -- Sinh OTP ngẫu nhiên 6 số (chỉ số, không chữ để gửi SMS dễ hơn)
    SET @otp_code = RIGHT('000000' + CAST(CAST(RAND() * 1000000 AS INT) AS NVARCHAR(6)), 6);
    
    -- Chuyển đổi OTP sang chữ hoa nếu cần (nhưng ở đây dùng số cho đơn giản)
    
    -- Chèn vào bảng
    INSERT INTO Otps (email, phone, otp_code, purpose, expires_at)
    VALUES (
        @email,
        @phone,
        @otp_code,
        @purpose,
        DATEADD(MINUTE, 5, GETDATE())  -- Hết hạn sau 5 phút
    );
    
    -- Xóa các OTP cũ không cần thiết (quá 1 ngày)
    DELETE FROM Otps WHERE expires_at < DATEADD(DAY, -1, GETDATE());
    
    RETURN 0;
END;
GO

-- ============================================
-- TẠO STORED PROCEDURE XÁC THỰC OTP
-- ============================================
CREATE OR ALTER PROCEDURE sp_VerifyOTP
    @email NVARCHAR(100) = NULL,
    @phone NVARCHAR(15) = NULL,
    @purpose NVARCHAR(20),
    @otp_code NVARCHAR(6),
    @is_valid BIT OUTPUT
AS
BEGIN
    DECLARE @otp_id INT;
    DECLARE @expires_at DATETIME;
    
    -- Tìm OTP phù hợp
    SELECT TOP 1 
        @otp_id = otp_id,
        @expires_at = expires_at
    FROM Otps
    WHERE (email = @email OR phone = @phone)
        AND purpose = @purpose
        AND otp_code = @otp_code
        AND is_used = 0
        AND is_verified = 0
        AND expires_at > GETDATE()
    ORDER BY otp_id DESC;
    
    IF @otp_id IS NOT NULL
    BEGIN
        -- Đánh dấu là đã xác thực
        UPDATE Otps 
        SET is_verified = 1, 
            updated_at = GETDATE()
        WHERE otp_id = @otp_id;
        
        SET @is_valid = 1;
    END
    ELSE
    BEGIN
        SET @is_valid = 0;
    END
END;
GO

PRINT 'Database update completed!';