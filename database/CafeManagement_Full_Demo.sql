-- ============================================
-- CAFE MANAGEMENT SYSTEM - FULL DEMO DATABASE
-- ============================================

USE master;
GO
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT name FROM sys.databases WHERE name = N'CafeManagement')
BEGIN
    ALTER DATABASE CafeManagement SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE CafeManagement;
END
GO

CREATE DATABASE CafeManagement;
GO

USE CafeManagement;
GO

-- ============================================
-- 1. TABLES
-- ============================================

-- Bảng USERS
CREATE TABLE Users (
    user_id INT IDENTITY(1,1) PRIMARY KEY,
    full_name NVARCHAR(100) NOT NULL,
    email NVARCHAR(100) UNIQUE NOT NULL,
    password_hash NVARCHAR(255) NOT NULL,
    phone NVARCHAR(15),
    role NVARCHAR(20) CHECK (role IN ('admin', 'staff', 'customer')) NOT NULL,
    is_active BIT DEFAULT 1,
    loyalty_points INT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);
GO

-- Bảng TABLES
CREATE TABLE Tables (
    table_id INT IDENTITY(1,1) PRIMARY KEY,
    table_number INT UNIQUE NOT NULL,
    capacity INT NOT NULL,
    status NVARCHAR(20) CHECK (status IN ('available', 'occupied', 'reserved')) DEFAULT 'available',
    location NVARCHAR(50),
    created_at DATETIME DEFAULT GETDATE()
);
GO

-- Bảng CATEGORIES
CREATE TABLE Categories (
    category_id INT IDENTITY(1,1) PRIMARY KEY,
    category_name NVARCHAR(50) UNIQUE NOT NULL,
    description NVARCHAR(255),
    created_at DATETIME DEFAULT GETDATE()
);
GO

-- Bảng MENU_ITEMS
CREATE TABLE Menu_Items (
    item_id INT IDENTITY(1,1) PRIMARY KEY,
    category_id INT NOT NULL,
    item_name NVARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL CHECK (price > 0),
    image_url NVARCHAR(255),
    description NVARCHAR(255),
    status NVARCHAR(20) CHECK (status IN ('available', 'unavailable')) DEFAULT 'available',
    customizations NVARCHAR(MAX) NULL,
    is_paused BIT DEFAULT 0,
    is_recommended BIT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (category_id) REFERENCES Categories(category_id)
);
GO

-- Bảng ORDERS
CREATE TABLE Orders (
    order_id INT IDENTITY(1,1) PRIMARY KEY,
    table_id INT NOT NULL,
    user_id INT NOT NULL,
    total_amount DECIMAL(10, 2) DEFAULT 0,
    status NVARCHAR(20) CHECK (status IN ('pending', 'paid', 'cancelled')) DEFAULT 'pending',
    note NVARCHAR(255),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (table_id) REFERENCES Tables(table_id),
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);
GO

-- Bảng ORDER_ITEMS
CREATE TABLE Order_Items (
    order_item_id INT IDENTITY(1,1) PRIMARY KEY,
    order_id INT NOT NULL,
    item_id INT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal AS (quantity * unit_price) PERSISTED,
    customizations NVARCHAR(MAX) NULL,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (order_id) REFERENCES Orders(order_id),
    FOREIGN KEY (item_id) REFERENCES Menu_Items(item_id)
);
GO

-- Bảng PAYMENTS
CREATE TABLE Payments (
    payment_id INT IDENTITY(1,1) PRIMARY KEY,
    order_id INT NOT NULL,
    payment_method NVARCHAR(20) CHECK (payment_method IN ('cash', 'credit_card', 'bank_transfer', 'vietqr')) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_status NVARCHAR(20) CHECK (payment_status IN ('completed', 'refunded')) DEFAULT 'completed',
    paid_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (order_id) REFERENCES Orders(order_id)
);
GO

-- Bảng DISCOUNTCODES
CREATE TABLE DiscountCodes (
    code_id INT PRIMARY KEY IDENTITY(1,1),
    code NVARCHAR(50) UNIQUE NOT NULL,
    description NVARCHAR(255),
    discount_type NVARCHAR(20) NOT NULL,
    discount_value DECIMAL(10,2) NOT NULL,
    min_order_amount DECIMAL(10,2) DEFAULT 0,
    max_discount_amount DECIMAL(10,2),
    usage_limit INT,
    usage_count INT DEFAULT 0,
    expiry_date DATETIME,
    type NVARCHAR(20) DEFAULT 'manual',
    points_required INT DEFAULT 0,
    is_active BIT DEFAULT 1,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);
GO

-- Bảng USERDISCOUNTS
CREATE TABLE UserDiscounts (
    user_id INT,
    code_id INT,
    used_at DATETIME,
    assigned_at DATETIME DEFAULT GETDATE(),
    PRIMARY KEY (user_id, code_id),
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (code_id) REFERENCES DiscountCodes(code_id)
);
GO

-- Bảng OTP
CREATE TABLE OTP_Verification (
    id INT IDENTITY(1,1) PRIMARY KEY,
    email NVARCHAR(100) NOT NULL,
    otp_code NVARCHAR(6) NOT NULL,
    expires_at DATETIME NOT NULL,
    is_used BIT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE()
);
GO

-- Password Resets
CREATE TABLE PasswordResets (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    token NVARCHAR(100) NOT NULL,
    status NVARCHAR(20) DEFAULT 'pending',
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);
GO

-- Settings
CREATE TABLE Settings (
    setting_id INT IDENTITY(1,1) PRIMARY KEY,
    setting_key NVARCHAR(50) UNIQUE NOT NULL,
    setting_value NVARCHAR(MAX),
    description NVARCHAR(255),
    updated_at DATETIME DEFAULT GETDATE()
);
GO

-- ============================================
-- 2. DEMO DATA (Tất cả từ A đến Z)
-- ============================================

-- Users (Mật khẩu chung cho tất cả: 123456)
INSERT INTO Users (full_name, email, password_hash, phone, role, loyalty_points) VALUES
(N'Admin Cà Phê', N'admin@cafe.com', N'$2a$10$rOlE8M7DWkGGRoexTXsXjOkUi3Z/jMCatlmzLWlDpfrQ4lr.bQKz2', N'0900000000', 'admin', 0),
(N'Nhân Viên Nam', N'staff1@cafe.com', N'$2a$10$rOlE8M7DWkGGRoexTXsXjOkUi3Z/jMCatlmzLWlDpfrQ4lr.bQKz2', N'0911111111', 'staff', 0),
(N'Khách Hàng Vip', N'khach@cafe.com', N'$2a$10$rOlE8M7DWkGGRoexTXsXjOkUi3Z/jMCatlmzLWlDpfrQ4lr.bQKz2', N'0922222222', 'customer', 500);
GO

-- Tables
INSERT INTO Tables (table_number, capacity, status, location) VALUES
(1, 2, 'available', N'Tầng 1 - Cửa Sổ'),
(2, 4, 'available', N'Tầng 1 - Trung Tâm'),
(3, 4, 'occupied', N'Tầng 1 - Ban Công'),
(4, 6, 'available', N'Tầng 2 - Máy Lạnh'),
(5, 8, 'reserved', N'Tầng 2 - Phòng Họp');
GO

-- Categories
INSERT INTO Categories (category_name, description) VALUES
(N'Cà Phê Truyền Thống', N'Cà phê Việt Nam pha phin, pha máy'),
(N'Cà Phê Ý', N'Espresso, Latte, Cappuccino'),
(N'Trà & Trà Sữa', N'Trà trái cây, trà xanh, trà sữa'),
(N'Bánh Ngọt', N'Bánh kem, bánh mì ăn nhẹ');
GO

-- Menu Items (Với customizations JSON, is_paused, is_recommended)
INSERT INTO Menu_Items (category_id, item_name, price, image_url, description, status, is_recommended, is_paused, customizations) VALUES
(1, N'Cà Phê Đen Đá', 25000, N'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60', N'Cà phê robusta rang xay đậm vị', 'available', 1, 0, N'{"sizes":[{"name":"S","extraPrice":0},{"name":"M","extraPrice":5000},{"name":"L","extraPrice":10000}],"toppings":[{"name":"Thêm đá","price":0},{"name":"Sữa đặc thêm","price":5000}]}'),
(1, N'Bạc Xỉu', 35000, N'https://images.unsplash.com/photo-1559525839-b184a4d698c7?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60', N'Cà phê sữa nhiều sữa, nhẹ nhàng', 'available', 1, 0, N'{"sizes":[{"name":"S","extraPrice":0},{"name":"M","extraPrice":5000}],"toppings":[{"name":"Thêm trân châu trắng","price":8000}]}'),
(2, N'Latte Nóng', 45000, N'https://images.unsplash.com/photo-1511920170033-f8396924c348?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60', N'Espresso và sữa nóng mượt mà', 'available', 0, 0, NULL),
(2, N'Cappuccino', 45000, N'https://images.unsplash.com/photo-1534778101976-62847782c213?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60', N'Espresso, bọt sữa dày', 'available', 1, 0, NULL),
(3, N'Trà Đào Cam Sả', 40000, N'https://images.unsplash.com/photo-1556679343-c7306c1976bc?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60', N'Giải nhiệt thanh mát', 'available', 1, 0, N'{"sizes":[{"name":"M","extraPrice":0},{"name":"L","extraPrice":10000}],"toppings":[{"name":"Thêm đào miếng","price":10000},{"name":"Trân châu","price":8000}]}'),
(3, N'Trà Sữa Trân Châu', 40000, N'https://images.unsplash.com/photo-1558857563-b37102e99e00?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60', N'Trà sữa hồng trà đậm vị', 'available', 0, 0, N'{"sizes":[{"name":"M","extraPrice":0},{"name":"L","extraPrice":10000}],"toppings":[{"name":"Trân châu đen","price":8000},{"name":"Pudding trứng","price":12000}]}'),
(4, N'Bánh Sừng Bò', 30000, N'https://images.unsplash.com/photo-1555507036-ab1f40ce88cb?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60', N'Croissant nướng bơ thơm phức', 'available', 0, 0, NULL),
(4, N'Tiramisu', 45000, N'https://images.unsplash.com/photo-1571115177098-24c42d640fc9?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60', N'Bánh Tiramisu Ý truyền thống', 'available', 1, 1, NULL); -- Món bị tạm dừng (is_paused = 1)
GO

-- DiscountCodes
INSERT INTO DiscountCodes (code, description, discount_type, discount_value, min_order_amount, usage_limit, usage_count, type, points_required, expiry_date, is_active) VALUES
(N'HELLO2026', N'Chào mừng năm mới 2026 - Giảm 30%', 'percentage', 30, 0, 1000, 0, 'new_member', 0, '2026-12-31', 1),
(N'VIP50', N'Giảm trực tiếp 50K cho đơn từ 200K', 'fixed', 50000, 200000, 500, 0, 'manual', 0, '2026-12-31', 1),
(N'LOYALTY20', N'Mã đổi điểm: Giảm 20%', 'percentage', 20, 0, NULL, 0, 'loyalty', 200, '2026-12-31', 1);
GO

-- Đơn hàng Demo
INSERT INTO Orders (table_id, user_id, total_amount, status, note) VALUES
(3, 3, 105000, 'paid', N'Khách gọi thêm trân châu'),
(1, 2, 75000, 'pending', N'Chưa thanh toán');
GO

-- Chi tiết đơn hàng Demo
INSERT INTO Order_Items (order_id, item_id, quantity, unit_price, customizations) VALUES
(1, 5, 2, 40000, N'{"size":"M","toppings":[{"name":"Thêm đào miếng","price":10000}]}'), -- Trà Đào Cam Sả x2
(1, 1, 1, 25000, N'{"size":"S","toppings":[]}'), -- Cà phê đen x1
(2, 2, 1, 35000, N'{"size":"S","toppings":[]}'), -- Bạc xỉu x1
(2, 6, 1, 40000, N'{"size":"M","toppings":[]}'); -- Trà sữa x1

-- Update tổng tiền
UPDATE Orders SET total_amount = (
    SELECT SUM(subtotal) FROM Order_Items WHERE Order_Items.order_id = Orders.order_id
);
GO

-- Thanh toán Demo
INSERT INTO Payments (order_id, payment_method, amount, payment_status) VALUES
(1, 'vietqr', 105000, 'completed');
GO

-- Settings Demo
INSERT INTO Settings (setting_key, setting_value, description) VALUES
(N'STORE_NAME', N'Cà Phê Thông Minh', N'Tên quán cà phê'),
(N'STORE_ADDRESS', N'123 Đường Cà Phê, Quận 1, TP.HCM', N'Địa chỉ quán'),
(N'STORE_PHONE', N'0965147941', N'Số điện thoại liên hệ');
GO

-- ============================================
-- 3. BẢO MẬT & PHÂN QUYỀN
-- ============================================
-- Gắn quyền truy cập cho backend user
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = N'cafe_user')
BEGIN
    CREATE USER cafe_user FOR LOGIN cafe_user;
END
ALTER ROLE db_owner ADD MEMBER cafe_user;
GO

PRINT '========================================';
PRINT '✅ DATABASE INITIALIZATION COMPLETED!';
PRINT '========================================';
GO
