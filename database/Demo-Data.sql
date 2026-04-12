USE CafeManagement;
GO

-- ============================================
-- 1. Chèn dữ liệu Users
-- ============================================
INSERT INTO Users (full_name, email, password_hash, phone, role) VALUES
(N'Nguyễn Văn Admin', N'admin@cafe.com', N'$2b$10$YourHashedPasswordHere', N'0912345678', 'admin'),
(N'Trần Thị Nhân Viên', N'staff1@cafe.com', N'$2b$10$YourHashedPasswordHere', N'0987654321', 'staff'),
(N'Lê Văn Phục Vụ', N'staff2@cafe.com', N'$2b$10$YourHashedPasswordHere', N'0977123456', 'staff');
GO

-- ============================================
-- 2. Chèn dữ liệu Tables (10 bàn)
-- ============================================
INSERT INTO Tables (table_number, capacity, status, location) VALUES
(1, 2, 'available', N'Gần cửa sổ'),
(2, 2, 'available', N'Gần cửa sổ'),
(3, 4, 'available', N'Khu vực trung tâm'),
(4, 4, 'occupied', N'Khu vực trung tâm'),
(5, 6, 'available', N'Góc phòng'),
(6, 6, 'reserved', N'Góc phòng'),
(7, 2, 'available', N'Quầy bar'),
(8, 4, 'available', N'Khu vực máy lạnh'),
(9, 8, 'available', N'Phòng VIP'),
(10, 8, 'available', N'Phòng VIP');
GO

-- ============================================
-- 3. Chèn dữ liệu Categories
-- ============================================
INSERT INTO Categories (category_name, description) VALUES
(N'Cà phê', N'Các loại cà phê truyền thống và pha máy'),
(N'Trà', N'Trà xanh, trà đen, trà sữa'),
(N'Đồ uống khác', N'Sinh tố, nước ép, soda'),
(N'Bánh ngọt', N'Bánh mì, croissant, bánh ngọt các loại'),
(N'Thức ăn nhẹ', N'Mì ý, sandwich, salad');
GO

-- ============================================
-- 4. Chèn dữ liệu Menu_Items
-- ============================================
INSERT INTO Menu_Items (category_id, item_name, price, description, status) VALUES
(1, N'Cà phê đen', 25000, N'Cà phê rang xay nguyên chất', 'available'),
(1, N'Cà phê sữa', 30000, N'Cà phê pha phin với sữa đặc', 'available'),
(1, N'Bạc xỉu', 35000, N'Sữa nóng với chút cà phê', 'available'),
(1, N'Espresso', 40000, N'Cà phê đậm đặc pha máy', 'available'),
(1, N'Cappuccino', 45000, N'Espresso + sữa nóng + bọt sữa', 'available'),
(1, N'Latte', 45000, N'Espresso + sữa nóng', 'available'),
(2, N'Trà xanh', 30000, N'Trà xanh Nhật Bản', 'available'),
(2, N'Trà đào', 40000, N'Trà đen vị đào', 'available'),
(2, N'Trà sữa trân châu', 45000, N'Trà sữa đường đen', 'available'),
(3, N'Sinh tố xoài', 45000, N'Xoài tươi xay với sữa', 'available'),
(3, N'Nước cam ép', 40000, N'Cam tươi 100%', 'available'),
(3, N'Soda chanh bạc hà', 35000, N'Soda vị chanh và bạc hà', 'available'),
(4, N'Croissant', 35000, N'Bánh sừng bò bơ', 'available'),
(4, N'Bánh mì ngọt', 25000, N'Bánh mì nhân kem', 'available'),
(4, N'Cheesecake', 55000, N'Bánh phô mai New York', 'available'),
(5, N'Sandwich gà', 55000, N'Sandwich kẹp gà và rau củ', 'available'),
(5, N'Mì ý sốt bò bằm', 65000, N'Mì ý sốt cà chua thịt bò', 'available');
GO

-- ============================================
-- 5. Chèn dữ liệu Orders (Đơn hàng mẫu)
-- ============================================
INSERT INTO Orders (table_id, user_id, total_amount, status, note) VALUES
(4, 2, 130000, 'paid', N'Khách yêu cầu ít đá'),
(5, 2, 90000, 'paid', NULL),
(4, 3, 165000, 'pending', N'Chờ thanh toán'),
(6, 3, 120000, 'paid', N'Gọi thêm 2 ly nước cam');
GO

-- ============================================
-- 6. Chèn dữ liệu Order_Items
-- ============================================
-- Order 1: Bàn 4 - 130,000đ
INSERT INTO Order_Items (order_id, item_id, quantity, unit_price) VALUES
(1, 2, 2, 30000),  -- 2 cà phê sữa
(1, 9, 1, 45000),  -- 1 trà sữa trân châu
(1, 14, 1, 25000); -- 1 bánh mì ngọt

-- Order 2: Bàn 5 - 90,000đ
INSERT INTO Order_Items (order_id, item_id, quantity, unit_price) VALUES
(2, 1, 2, 25000),  -- 2 cà phê đen
(2, 13, 1, 35000), -- 1 croissant
(2, 7, 1, 30000);  -- 1 trà xanh

-- Order 3: Bàn 4 - 165,000đ (chưa thanh toán)
INSERT INTO Order_Items (order_id, item_id, quantity, unit_price) VALUES
(3, 5, 2, 45000),  -- 2 Cappuccino
(3, 15, 1, 55000), -- 1 Cheesecake
(3, 16, 1, 55000); -- 1 Sandwich gà

-- Order 4: Bàn 6 - 120,000đ
INSERT INTO Order_Items (order_id, item_id, quantity, unit_price) VALUES
(4, 10, 1, 45000), -- 1 Sinh tố xoài
(4, 11, 2, 40000), -- 2 Nước cam ép
(4, 7, 1, 30000);  -- 1 Trà xanh

-- Cập nhật total_amount cho Orders
UPDATE Orders SET total_amount = (
    SELECT SUM(subtotal) FROM Order_Items WHERE Order_Items.order_id = Orders.order_id
);
GO

-- ============================================
-- 7. Chèn dữ liệu Payments
-- ============================================
INSERT INTO Payments (order_id, payment_method, amount) VALUES
(1, 'cash', 130000),
(2, 'credit_card', 90000),
(4, 'bank_transfer', 120000);
GO

-- ============================================
-- 8. Chèn dữ liệu Customers (khách hàng thân thiết)
-- ============================================
INSERT INTO Customers (full_name, phone, email, loyalty_points, total_spent) VALUES
(N'Phạm Văn Khách', N'0909123456', N'khach1@gmail.com', 150, 1500000),
(N'Hoàng Thị Hằng', N'0909988776', N'hanght@gmail.com', 320, 3200000),
(N'Đỗ Văn Thân', N'0977111222', N'than@gmail.com', 85, 850000);
GO

-- ============================================
-- 9. Chèn dữ liệu Order_Customer
-- ============================================
INSERT INTO Order_Customer (order_id, customer_id, points_used, points_earned) VALUES
(1, 1, 0, 15),  -- Order 1: tích 15 điểm
(2, 2, 20, 10), -- Order 2: dùng 20 điểm, tích 10 điểm
(4, 3, 0, 12);  -- Order 4: tích 12 điểm
GO

-- ============================================
-- 10. Chèn dữ liệu Shifts (Ca làm việc)
-- ============================================
INSERT INTO Shifts (user_id, shift_date, shift_type, check_in_time, check_out_time) VALUES
(2, CAST(GETDATE() AS DATE), 'morning', CAST(GETDATE() AS DATETIME) + '08:00:00', CAST(GETDATE() AS DATETIME) + '12:00:00'),
(2, CAST(GETDATE() AS DATE), 'afternoon', CAST(GETDATE() AS DATETIME) + '13:00:00', CAST(GETDATE() AS DATETIME) + '17:00:00'),
(3, CAST(GETDATE() AS DATE), 'evening', CAST(GETDATE() AS DATETIME) + '18:00:00', CAST(GETDATE() AS DATETIME) + '22:00:00'),
(3, CAST(GETDATE() - 1 AS DATE), 'morning', CAST(GETDATE() - 1 AS DATETIME) + '08:30:00', CAST(GETDATE() - 1 AS DATETIME) + '12:30:00');
GO

PRINT 'Sample data inserted successfully!';
GO

-- ============================================
-- Kiểm tra dữ liệu
-- ============================================
SELECT 'Users' AS Table_Name, COUNT(*) AS Record_Count FROM Users UNION
SELECT 'Tables', COUNT(*) FROM Tables UNION
SELECT 'Categories', COUNT(*) FROM Categories UNION
SELECT 'Menu_Items', COUNT(*) FROM Menu_Items UNION
SELECT 'Orders', COUNT(*) FROM Orders UNION
SELECT 'Order_Items', COUNT(*) FROM Order_Items UNION
SELECT 'Payments', COUNT(*) FROM Payments UNION
SELECT 'Customers', COUNT(*) FROM Customers UNION
SELECT 'Shifts', COUNT(*) FROM Shifts;
GO