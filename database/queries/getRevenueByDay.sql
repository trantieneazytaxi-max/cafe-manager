-- DOANH THU THEO NGÀY (CÓ SO SÁNH VỚI NGÀY HÔM QUA)
USE CafeManagement;
GO

DECLARE @target_date DATE = '2026-04-02';  -- Có thể thay đổi

WITH RevenueData AS (
    SELECT 
        CAST(created_at AS DATE) AS sale_date,
        COUNT(DISTINCT order_id) AS total_orders,
        SUM(total_amount) AS revenue,
        AVG(total_amount) AS avg_order_value
    FROM Orders
    WHERE status = 'paid'
        AND CAST(created_at AS DATE) >= DATEADD(DAY, -7, @target_date)
    GROUP BY CAST(created_at AS DATE)
)
SELECT 
    sale_date,
    total_orders,
    revenue,
    avg_order_value,
    LAG(revenue, 1, 0) OVER (ORDER BY sale_date) AS previous_day_revenue,
    CASE 
        WHEN LAG(revenue, 1, 0) OVER (ORDER BY sale_date) > 0 
        THEN ((revenue - LAG(revenue, 1, 0) OVER (ORDER BY sale_date)) * 100.0 / LAG(revenue, 1, 0) OVER (ORDER BY sale_date))
        ELSE NULL
    END AS revenue_growth_percent
FROM RevenueData
ORDER BY sale_date DESC;
GO