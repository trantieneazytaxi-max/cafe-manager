-- Bước 1: Tạo login SQL (cấp server)
CREATE LOGIN cafe_user WITH PASSWORD = 'Cafe@2026';
GO

-- Bước 2: Chuyển sang database CafeManagement
USE CafeManagement;
GO

-- Bước 3: Tạo user trong database
CREATE USER cafe_user FOR LOGIN cafe_user;
GO

-- Bước 4: Cấp quyền db_owner (toàn quyền)
ALTER ROLE db_owner ADD MEMBER cafe_user;
GO

-- Bước 5: Kiểm tra lại user vừa tạo
SELECT name FROM sys.database_principals WHERE type = 'S';
GO