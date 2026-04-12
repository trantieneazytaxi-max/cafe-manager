-- TOP 10 MÓN BÁN CHẠY NHẤT (THEO SỐ LƯỢNG VÀ DOANH THU)
USE CafeManagement;
GO

SELECT TOP 10
    ROW_NUMBER() OVER (ORDER BY SUM(oi.quantity) DESC) AS ranking,
    mi.item_name,
    c.category_name,
    SUM(oi.quantity) AS total_quantity_sold,
    SUM(oi.subtotal) AS total_revenue,
    COUNT(DISTINCT o.order_id) AS number_of_orders
FROM Order_Items oi
JOIN Menu_Items mi ON oi.item_id = mi.item_id
JOIN Categories c ON mi.category_id = c.category_id
JOIN Orders o ON oi.order_id = o.order_id
WHERE o.status = 'paid'
    AND o.created_at >= DATEADD(MONTH, -1, GETDATE())  -- 30 ngày gần nhất
GROUP BY mi.item_name, c.category_name
ORDER BY total_quantity_sold DESC;
GO