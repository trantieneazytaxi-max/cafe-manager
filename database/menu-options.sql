USE CafeManagement;
GO

-- ============================================
-- XÓA DỮ LIỆU CŨ (NẾU CÓ)
-- ============================================
IF EXISTS (SELECT * FROM sysobjects WHERE name='ItemOptions' AND xtype='U')
    DROP TABLE ItemOptions;
IF EXISTS (SELECT * FROM sysobjects WHERE name='DrinkTemperatures' AND xtype='U')
    DROP TABLE DrinkTemperatures;
IF EXISTS (SELECT * FROM sysobjects WHERE name='DrinkSizes' AND xtype='U')
    DROP TABLE DrinkSizes;
GO

-- ============================================
-- TẠO BẢNG SIZE (S, M, L)
-- ============================================
CREATE TABLE DrinkSizes (
    size_id INT IDENTITY(1,1) PRIMARY KEY,
    size_code NVARCHAR(10) NOT NULL,
    size_name NVARCHAR(20) NOT NULL,
    price_multiplier DECIMAL(3,2) NOT NULL,
    sort_order INT DEFAULT 0
);

INSERT INTO DrinkSizes (size_code, size_name, price_multiplier, sort_order) VALUES
('S', N'Nhỏ', 0.8, 1),
('M', N'Vừa', 1.0, 2),
('L', N'Lớn', 1.3, 3);
GO

-- ============================================
-- TẠO BẢNG NHIỆT ĐỘ (NÓNG, LẠNH, ĐÁ)
-- ============================================
CREATE TABLE DrinkTemperatures (
    temp_id INT IDENTITY(1,1) PRIMARY KEY,
    temp_code NVARCHAR(10) NOT NULL,
    temp_name NVARCHAR(20) NOT NULL,
    sort_order INT DEFAULT 0
);

INSERT INTO DrinkTemperatures (temp_code, temp_name, sort_order) VALUES
('HOT', N'Nóng', 1),
('COLD', N'Lạnh', 2),
('ICE', N'Đá', 3);
GO

-- ============================================
-- TẠO BẢNG LIÊN KẾT MÓN VỚI TÙY CHỌN
-- ============================================
CREATE TABLE ItemOptions (
    item_option_id INT IDENTITY(1,1) PRIMARY KEY,
    item_id INT NOT NULL,
    has_size BIT DEFAULT 0,
    has_temperature BIT DEFAULT 0,
    FOREIGN KEY (item_id) REFERENCES Menu_Items(item_id)
);
GO

-- ============================================
-- CẬP NHẬT TÙY CHỌN CHO TỪNG LOẠI MÓN (HỢP LÝ)
-- ============================================

-- 1. Cà phê (category_id = 1): Có size + Nóng/Lạnh/Đá
INSERT INTO ItemOptions (item_id, has_size, has_temperature)
SELECT item_id, 1, 1 FROM Menu_Items WHERE category_id = 1;
GO

-- 2. Trà (category_id = 2): Có size + Nóng/Lạnh/Đá
INSERT INTO ItemOptions (item_id, has_size, has_temperature)
SELECT item_id, 1, 1 FROM Menu_Items WHERE category_id = 2;
GO

-- 3. Đồ uống khác (category_id = 3): Sinh tố, nước ép, soda
--    --> Có size, nhưng KHÔNG có Nóng (chỉ Lạnh/Đá)
INSERT INTO ItemOptions (item_id, has_size, has_temperature)
SELECT item_id, 1, 1 FROM Menu_Items WHERE category_id = 3;
GO

-- 4. Bánh ngọt (category_id = 4): Không có tùy chọn
INSERT INTO ItemOptions (item_id, has_size, has_temperature)
SELECT item_id, 0, 0 FROM Menu_Items WHERE category_id = 4;
GO

-- 5. Thức ăn nhẹ (category_id = 5): Không có tùy chọn
INSERT INTO ItemOptions (item_id, has_size, has_temperature)
SELECT item_id, 0, 0 FROM Menu_Items WHERE category_id = 5;
GO

-- ============================================
-- CẬP NHẬP ĐẶC BIỆT CHO TỪNG MÓN (NẾU CẦN)
-- ============================================

-- Sinh tố xoài (item_id = 10): Chỉ Lạnh/Đá, không Nóng
UPDATE ItemOptions SET has_temperature = 1 WHERE item_id = 10;
-- (Sẽ xử lý ở frontend: ẩn nút Nóng)

-- Nước cam ép (item_id = 11): Chỉ Lạnh/Đá, không Nóng
UPDATE ItemOptions SET has_temperature = 1 WHERE item_id = 11;

-- Soda chanh bạc hà (item_id = 12): Chỉ Lạnh/Đá, không Nóng
UPDATE ItemOptions SET has_temperature = 1 WHERE item_id = 12;

-- Trà sữa trân châu (item_id = 9): Có size + Nóng/Lạnh (ít đá)
-- Giữ nguyên

-- ============================================
-- KIỂM TRA KẾT QUẢ
-- ============================================
PRINT '========== DRINK SIZES ==========';
SELECT * FROM DrinkSizes;
GO

PRINT '========== DRINK TEMPERATURES ==========';
SELECT * FROM DrinkTemperatures;
GO

PRINT '========== ITEM OPTIONS ==========';
SELECT 
    io.item_id,
    mi.item_name,
    c.category_name,
    io.has_size,
    io.has_temperature,
    CASE 
        WHEN io.has_size = 1 AND io.has_temperature = 1 THEN N'Size + Nhiệt độ'
        WHEN io.has_size = 1 AND io.has_temperature = 0 THEN N'Chỉ Size'
        WHEN io.has_size = 0 AND io.has_temperature = 0 THEN N'Không tùy chọn'
        ELSE N'Khác'
    END AS option_type
FROM ItemOptions io
JOIN Menu_Items mi ON io.item_id = mi.item_id
JOIN Categories c ON mi.category_id = c.category_id
ORDER BY mi.category_id, mi.item_id;
GO

PRINT '✅ Đã cập nhật tùy chọn cho menu!';
GO

USE CafeManagement;
GO

-- Kiểm tra bảng DrinkSizes
SELECT * FROM DrinkSizes;
GO

-- Kiểm tra bảng DrinkTemperatures
SELECT * FROM DrinkTemperatures;
GO

-- Kiểm tra bảng ItemOptions
SELECT * FROM ItemOptions;
GO