-- THUẬT TOÁN GỢI Ý MÓN CHO BÀN DỰA TRÊN LỊCH SỬ ORDER (THÔNG MINH)
USE CafeManagement;
GO

CREATE OR ALTER PROCEDURE sp_SuggestItemsForTable
    @table_id INT,
    @limit INT = 5
AS
BEGIN
    -- Gợi ý món dựa trên 3 yếu tố:
    -- 1. Món đã được order nhiều nhất tại bàn này trong 7 ngày qua (trọng số 50%)
    -- 2. Món đang được ưa chuộng chung tại tất cả bàn (trọng số 30%)
    -- 3. Món cùng danh mục với các món đã order (trọng số 20%)
    
    WITH TableHistory AS (
        SELECT TOP 10
            oi.item_id,
            COUNT(oi.order_item_id) AS order_count
        FROM Order_Items oi
        JOIN Orders o ON oi.order_id = o.order_id
        WHERE o.table_id = @table_id
            AND o.created_at >= DATEADD(DAY, -7, GETDATE())
        GROUP BY oi.item_id
    ),
    GlobalTrend AS (
        SELECT TOP 20
            oi.item_id,
            COUNT(oi.order_item_id) AS global_count
        FROM Order_Items oi
        JOIN Orders o ON oi.order_id = o.order_id
        WHERE o.created_at >= DATEADD(DAY, -3, GETDATE())
        GROUP BY oi.item_id
    ),
    RecentOrdersAtTable AS (
        SELECT DISTINCT mi.category_id
        FROM Order_Items oi
        JOIN Orders o ON oi.order_id = o.order_id
        JOIN Menu_Items mi ON oi.item_id = mi.item_id
        WHERE o.table_id = @table_id
            AND o.created_at >= DATEADD(HOUR, -2, GETDATE())
    )
    
    SELECT TOP (@limit)
        mi.item_id,
        mi.item_name,
        c.category_name,
        mi.price,
        -- Tính điểm gợi ý (càng cao càng nên gợi ý)
        (
            ISNULL(CAST(th.order_count AS FLOAT) / NULLIF((SELECT MAX(order_count) FROM TableHistory), 0), 0) * 0.5 +
            ISNULL(CAST(gt.global_count AS FLOAT) / NULLIF((SELECT MAX(global_count) FROM GlobalTrend), 0), 0) * 0.3 +
            CASE WHEN roat.category_id IS NOT NULL THEN 0.2 ELSE 0 END
        ) * 100 AS suggestion_score
    FROM Menu_Items mi
    LEFT JOIN Categories c ON mi.category_id = c.category_id
    LEFT JOIN TableHistory th ON mi.item_id = th.item_id
    LEFT JOIN GlobalTrend gt ON mi.item_id = gt.item_id
    LEFT JOIN RecentOrdersAtTable roat ON mi.category_id = roat.category_id
    WHERE mi.status = 'available'
        AND mi.item_id NOT IN (  -- Không gợi ý món vừa mới order trong 30 phút
            SELECT oi.item_id
            FROM Order_Items oi
            JOIN Orders o ON oi.order_id = o.order_id
            WHERE o.table_id = @table_id
                AND o.created_at >= DATEADD(MINUTE, -30, GETDATE())
        )
    ORDER BY suggestion_score DESC;
END;
GO

-- Cách sử dụng: EXEC sp_SuggestItemsForTable @table_id = 4, @limit = 3;