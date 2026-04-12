-- ============================================
-- CAFE MANAGEMENT SYSTEM - SQL SERVER DATABASE
-- ============================================

-- Tạo database (nếu chưa tồn tại)
USE master;
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
-- 1. Bảng USERS (Người dùng: admin, nhân viên)
-- ============================================
CREATE TABLE Users (
    user_id INT IDENTITY(1,1) PRIMARY KEY,
    full_name NVARCHAR(100) NOT NULL,
    email NVARCHAR(100) UNIQUE NOT NULL,
    password_hash NVARCHAR(255) NOT NULL,
    phone NVARCHAR(15),
    role NVARCHAR(20) CHECK (role IN ('admin', 'staff')) NOT NULL,
    is_active BIT DEFAULT 1,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);
GO

-- ============================================
-- 2. Bảng TABLES (Quản lý bàn)
-- ============================================
CREATE TABLE Tables (
    table_id INT IDENTITY(1,1) PRIMARY KEY,
    table_number INT UNIQUE NOT NULL,
    capacity INT NOT NULL,
    status NVARCHAR(20) CHECK (status IN ('available', 'occupied', 'reserved')) DEFAULT 'available',
    location NVARCHAR(50),
    created_at DATETIME DEFAULT GETDATE()
);
GO

-- ============================================
-- 3. Bảng CATEGORIES (Danh mục món)
-- ============================================
CREATE TABLE Categories (
    category_id INT IDENTITY(1,1) PRIMARY KEY,
    category_name NVARCHAR(50) UNIQUE NOT NULL,
    description NVARCHAR(255),
    created_at DATETIME DEFAULT GETDATE()
);
GO

-- ============================================
-- 4. Bảng MENU_ITEMS (Thực đơn)
-- ============================================
CREATE TABLE Menu_Items (
    item_id INT IDENTITY(1,1) PRIMARY KEY,
    category_id INT NOT NULL,
    item_name NVARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL CHECK (price > 0),
    image_url NVARCHAR(255),
    description NVARCHAR(255),
    status NVARCHAR(20) CHECK (status IN ('available', 'unavailable')) DEFAULT 'available',
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (category_id) REFERENCES Categories(category_id)
);
GO

-- ============================================
-- 5. Bảng ORDERS (Đơn hàng)
-- ============================================
CREATE TABLE Orders (
    order_id INT IDENTITY(1,1) PRIMARY KEY,
    table_id INT NOT NULL,
    user_id INT NOT NULL,  -- Nhân viên tạo order
    total_amount DECIMAL(10, 2) DEFAULT 0,
    status NVARCHAR(20) CHECK (status IN ('pending', 'paid', 'cancelled')) DEFAULT 'pending',
    note NVARCHAR(255),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (table_id) REFERENCES Tables(table_id),
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);
GO

-- ============================================
-- 6. Bảng ORDER_ITEMS (Chi tiết đơn hàng)
-- ============================================
CREATE TABLE Order_Items (
    order_item_id INT IDENTITY(1,1) PRIMARY KEY,
    order_id INT NOT NULL,
    item_id INT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal AS (quantity * unit_price) PERSISTED,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (order_id) REFERENCES Orders(order_id),
    FOREIGN KEY (item_id) REFERENCES Menu_Items(item_id)
);
GO

-- ============================================
-- 7. Bảng PAYMENTS (Thanh toán)
-- ============================================
CREATE TABLE Payments (
    payment_id INT IDENTITY(1,1) PRIMARY KEY,
    order_id INT NOT NULL,
    payment_method NVARCHAR(20) CHECK (payment_method IN ('cash', 'credit_card', 'bank_transfer')) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_status NVARCHAR(20) CHECK (payment_status IN ('completed', 'refunded')) DEFAULT 'completed',
    paid_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (order_id) REFERENCES Orders(order_id)
);
GO

-- ============================================
-- 8. Bảng SHIFTS (Ca làm việc - tính năng nâng cao)
-- ============================================
CREATE TABLE Shifts (
    shift_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    shift_date DATE NOT NULL,
    shift_type NVARCHAR(20) CHECK (shift_type IN ('morning', 'afternoon', 'evening')) NOT NULL,
    check_in_time DATETIME,
    check_out_time DATETIME,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);
GO

-- ============================================
-- 9. Bảng CUSTOMERS (Khách hàng thân thiết - nâng cao)
-- ============================================
CREATE TABLE Customers (
    customer_id INT IDENTITY(1,1) PRIMARY KEY,
    full_name NVARCHAR(100) NOT NULL,
    phone NVARCHAR(15) UNIQUE NOT NULL,
    email NVARCHAR(100),
    loyalty_points INT DEFAULT 0,
    total_spent DECIMAL(10, 2) DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE()
);
GO

-- ============================================
-- 10. Bảng ORDER_CUSTOMER (Liên kết order với khách - nâng cao)
-- ============================================
CREATE TABLE Order_Customer (
    order_id INT NOT NULL,
    customer_id INT NOT NULL,
    points_used INT DEFAULT 0,
    points_earned INT DEFAULT 0,
    PRIMARY KEY (order_id, customer_id),
    FOREIGN KEY (order_id) REFERENCES Orders(order_id),
    FOREIGN KEY (customer_id) REFERENCES Customers(customer_id)
);
GO

-- ============================================
-- Tạo INDEX để tối ưu truy vấn
-- ============================================
CREATE INDEX idx_orders_table_id ON Orders(table_id);
CREATE INDEX idx_orders_user_id ON Orders(user_id);
CREATE INDEX idx_orders_created_at ON Orders(created_at);
CREATE INDEX idx_order_items_order_id ON Order_Items(order_id);
CREATE INDEX idx_order_items_item_id ON Order_Items(item_id);
CREATE INDEX idx_payments_order_id ON Payments(order_id);
CREATE INDEX idx_shifts_user_id ON Shifts(user_id);
CREATE INDEX idx_shifts_shift_date ON Shifts(shift_date);
CREATE INDEX idx_customers_phone ON Customers(phone);
GO

-- ============================================
-- Tạo VIEW cho báo cáo nhanh
-- ============================================

-- VIEW 1: Doanh thu theo ngày
CREATE VIEW v_RevenueByDay AS
SELECT 
    CAST(o.created_at AS DATE) AS sale_date,
    COUNT(DISTINCT o.order_id) AS total_orders,
    SUM(o.total_amount) AS total_revenue,
    AVG(o.total_amount) AS avg_order_value
FROM Orders o
WHERE o.status = 'paid'
GROUP BY CAST(o.created_at AS DATE);
GO

-- VIEW 2: Top món bán chạy
CREATE VIEW v_TopSellingItems AS
SELECT 
    mi.item_name,
    c.category_name,
    SUM(oi.quantity) AS total_quantity_sold,
    SUM(oi.subtotal) AS total_revenue
FROM Order_Items oi
JOIN Menu_Items mi ON oi.item_id = mi.item_id
JOIN Categories c ON mi.category_id = c.category_id
JOIN Orders o ON oi.order_id = o.order_id
WHERE o.status = 'paid'
GROUP BY mi.item_name, c.category_name;
GO

-- VIEW 3: Hiệu suất nhân viên
CREATE VIEW v_StaffPerformance AS
SELECT 
    u.full_name,
    u.email,
    COUNT(DISTINCT o.order_id) AS orders_processed,
    SUM(o.total_amount) AS total_sales,
    AVG(o.total_amount) AS avg_order_value
FROM Users u
JOIN Orders o ON u.user_id = o.user_id
WHERE o.status = 'paid'
GROUP BY u.full_name, u.email;
GO

PRINT 'Database schema created successfully!';
GO

