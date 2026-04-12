-- XÓA TOÀN BỘ BẢNG (KHI CẦN RESET)
USE CafeManagement;
GO

-- Xóa theo thứ tự (tránh lỗi khóa ngoại)
DROP TABLE IF EXISTS Order_Customer;
DROP TABLE IF EXISTS Shifts;
DROP TABLE IF EXISTS Payments;
DROP TABLE IF EXISTS Order_Items;
DROP TABLE IF EXISTS Orders;
DROP TABLE IF EXISTS Menu_Items;
DROP TABLE IF EXISTS Categories;
DROP TABLE IF EXISTS Tables;
DROP TABLE IF EXISTS Customers;
DROP TABLE IF EXISTS Users;

-- Xóa views
DROP VIEW IF EXISTS v_RevenueByDay;
DROP VIEW IF EXISTS v_TopSellingItems;
DROP VIEW IF EXISTS v_StaffPerformance;

-- Xóa procedure
DROP PROCEDURE IF EXISTS sp_SuggestItemsForTable;

PRINT 'All tables dropped successfully!';
GO