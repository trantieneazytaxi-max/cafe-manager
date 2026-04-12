USE CafeManagement;
GO

-- ============================================
-- CẬP NHẬT GIÁ MENU
-- ============================================

-- Cà phê
UPDATE Menu_Items SET price = 25000 WHERE item_id = 1;  -- Cà phê đen
UPDATE Menu_Items SET price = 20000 WHERE item_id = 2;  -- Cà phê sữa
UPDATE Menu_Items SET price = 35000 WHERE item_id = 3;  -- Bạc xỉu
UPDATE Menu_Items SET price = 40000 WHERE item_id = 4;  -- Espresso
UPDATE Menu_Items SET price = 45000 WHERE item_id = 5;  -- Cappuccino
UPDATE Menu_Items SET price = 45000 WHERE item_id = 6;  -- Latte

-- Trà
UPDATE Menu_Items SET price = 30000 WHERE item_id = 7;  -- Trà xanh
UPDATE Menu_Items SET price = 40000 WHERE item_id = 8;  -- Trà đào
UPDATE Menu_Items SET price = 45000 WHERE item_id = 9;  -- Trà sữa trân châu

-- Đồ uống khác
UPDATE Menu_Items SET price = 45000 WHERE item_id = 10; -- Sinh tố xoài
UPDATE Menu_Items SET price = 40000 WHERE item_id = 11; -- Nước cam ép
UPDATE Menu_Items SET price = 35000 WHERE item_id = 12; -- Soda chanh bạc hà

-- Bánh ngọt
UPDATE Menu_Items SET price = 35000 WHERE item_id = 13; -- Croissant
UPDATE Menu_Items SET price = 25000 WHERE item_id = 14; -- Bánh mì ngọt
UPDATE Menu_Items SET price = 55000 WHERE item_id = 15; -- Cheesecake

-- Thức ăn nhẹ
UPDATE Menu_Items SET price = 55000 WHERE item_id = 16; -- Sandwich gà
UPDATE Menu_Items SET price = 65000 WHERE item_id = 17; -- Mì ý sốt bò bằm

GO

-- Kiểm tra lại giá sau khi cập nhật
SELECT item_id, item_name, price FROM Menu_Items ORDER BY category_id;
GO

PRINT '✅ Đã cập nhật giá menu!';
GO