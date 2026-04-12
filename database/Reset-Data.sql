USE CafeManagement;
GO

-- Xóa dữ liệu theo thứ tự (tránh lỗi khóa ngoại)
DELETE FROM Order_Customer;
DELETE FROM Payments;
DELETE FROM Order_Items;
DELETE FROM Orders;
DELETE FROM Shifts;
DELETE FROM Otps;
DELETE FROM Customers;
DELETE FROM Menu_Items;
DELETE FROM Categories;
DELETE FROM Tables;
DELETE FROM Users;
GO

-- Reset identity (đặt lại số tự động bắt đầu từ 1)
DBCC CHECKIDENT ('Users', RESEED, 0);
DBCC CHECKIDENT ('Tables', RESEED, 0);
DBCC CHECKIDENT ('Categories', RESEED, 0);
DBCC CHECKIDENT ('Menu_Items', RESEED, 0);
DBCC CHECKIDENT ('Orders', RESEED, 0);
DBCC CHECKIDENT ('Order_Items', RESEED, 0);
DBCC CHECKIDENT ('Payments', RESEED, 0);
DBCC CHECKIDENT ('Shifts', RESEED, 0);
DBCC CHECKIDENT ('Otps', RESEED, 0);
DBCC CHECKIDENT ('Customers', RESEED, 0);
DBCC CHECKIDENT ('Order_Customer', RESEED, 0);
GO

PRINT '✅ Đã xóa toàn bộ dữ liệu!';
GO

USE CafeManagement;
GO

-- Xem Users
SELECT * FROM Users;
GO

-- Xem Tables
SELECT * FROM Tables;
GO

-- Xem Categories
SELECT * FROM Categories;
GO

-- Xem Menu_Items
SELECT * FROM Menu_Items;
GO

-- Xem Orders
SELECT * FROM Orders;
GO

-- Xem Order_Items
SELECT * FROM Order_Items;
GO

-- Xem Payments
SELECT * FROM Payments;
GO

-- Xem Otps
SELECT * FROM Otps;
GO

-- Xem Customers
SELECT * FROM Customers;
GO

-- Xem Shifts
SELECT * FROM Shifts;
GO

-- Xem Order_Customer
SELECT * FROM Order_Customer;
GO

-- Xem users có role là staff
SELECT * FROM Users WHERE role = 'staff';
GO

-- Xem users có role là admin
SELECT * FROM Users WHERE role = 'admin';
GO

-- Xem OTP chưa hết hạn
SELECT * FROM Otps WHERE expires_at > GETDATE() AND is_used = 0;
GO

-- Xem OTP đã hết hạn
SELECT * FROM Otps WHERE expires_at < GETDATE();
GO

-- Xem orders chưa thanh toán
SELECT * FROM Orders WHERE status = 'pending';
GO

-- Xem orders đã thanh toán
SELECT * FROM Orders WHERE status = 'paid';
GO

-- Xem 10 users mới nhất
SELECT TOP 10 * FROM Users ORDER BY created_at DESC;
GO

-- Xem 10 orders mới nhất
SELECT TOP 10 * FROM Orders ORDER BY created_at DESC;
GO

-- Xem 10 OTP mới nhất
SELECT TOP 10 * FROM Otps ORDER BY created_at DESC;
GO

-- Xóa OTP theo email
DELETE FROM Otps WHERE email = 'test@gmail.com';
GO

-- Xóa user theo email
DELETE FROM Users WHERE email = 'test@gmail.com';
GO

USE CafeManagement;
GO

-- Xem user và OTP đã được xác thực (is_verified = 1)
SELECT 
    u.email,
    u.full_name,
    u.phone,
    u.created_at AS user_registered_at,
    o.otp_code,
    o.purpose,
    o.created_at AS otp_sent_at,
    o.expires_at,
    o.is_verified
FROM Users u
LEFT JOIN Otps o ON u.email = o.email
WHERE o.is_verified = 1
ORDER BY u.created_at DESC;
GO