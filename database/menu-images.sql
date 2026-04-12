USE CafeManagement;
GO

-- ============================================
-- CẬP NHẬT ẢNH CHO MENU_ITEMS
-- Dùng để thay đổi ảnh sản phẩm dễ dàng
-- ============================================

-- Xóa dữ liệu ảnh cũ (nếu muốn reset)
-- UPDATE Menu_Items SET image_url = NULL;

-- ============================================
-- CẬP NHẬT ẢNH CHO TỪNG MÓN
-- ============================================

-- Cà phê (category_id = 1)
UPDATE Menu_Items SET image_url = 'https://hoanghamobile.com/tin-tuc/wp-content/uploads/2024/08/anh-cafe-20.jpg' WHERE item_id = 1;  -- Cà phê đen
UPDATE Menu_Items SET image_url = 'https://png.pngtree.com/png-clipart/20240612/original/pngtree-3d-iced-coffee-glass-png-image_15314099.png' WHERE item_id = 2;  -- Cà phê sữa
UPDATE Menu_Items SET image_url = 'https://kingcoffee.com.vn/wp-content/uploads/2026/01/Ty-le-pha-ca-phe-bac-xiu-1024x683.jpg' WHERE item_id = 3;  -- Bạc xỉu
UPDATE Menu_Items SET image_url = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTnq07z_xqii8IxufEf3iqQz_HaFqa9ftLO1Q&s' WHERE item_id = 4;  -- Espresso
UPDATE Menu_Items SET image_url = 'https://classiccoffee.com.vn/files/common/ca-phe-capuchino-dinh-cao-cua-nghe-thuat-pha-che-kko0y.png' WHERE item_id = 5;  -- Cappuccino
UPDATE Menu_Items SET image_url = 'https://png.pngtree.com/thumb_back/fh260/background/20240415/pngtree-matcha-green-tea-latte-with-caramel-image_15658064.jpg' WHERE item_id = 6;  -- Latte

-- Trà (category_id = 2)
UPDATE Menu_Items SET image_url = 'https://media.istockphoto.com/id/628986454/vi/anh/c%E1%BB%91c-th%E1%BB%A7y-tinh-tr%C3%A0-xanh-t%C6%B0%C6%A1i.jpg?s=612x612&w=0&k=20&c=OPdSCQJKp2Psdd9ug-9RliQ92rZSA22mdwL9gAjFxv4=' WHERE item_id = 7;  -- Trà xanh
UPDATE Menu_Items SET image_url = 'https://hinh365.com/wp-content/uploads/2020/06/thu-vien-anh-dep-voi-8-353-tam-anh-chat-luong-cao-ve-ly-tra-dao-tuyet-dep-cho-in-an-thiet-ke-1.jpg' WHERE item_id = 8;  -- Trà đào
UPDATE Menu_Items SET image_url = 'https://media.istockphoto.com/id/523043028/vi/anh/tr%C3%A0-s%E1%BB%AFa-tr%C3%A2n-ch%C3%A2u-t%E1%BB%B1-l%C3%A0m-v%E1%BB%9Bi-khoai-m%C3%AC.jpg?s=612x612&w=0&k=20&c=ZCBvU2C620-M830chGTZUsaRCr_pRB5_r5kOah0Z6tY=' WHERE item_id = 9;  -- Trà sữa trân châu

-- Đồ uống khác (category_id = 3)
UPDATE Menu_Items SET image_url = 'https://img.pikbest.com/origin/10/51/94/57XpIkbEsT2CN.jpg!w700wp' WHERE item_id = 10; -- Sinh tố xoài
UPDATE Menu_Items SET image_url = 'https://phuongnamhospital.com/wp-content/uploads/2024/06/loi-ich-cua-nuoc-ep-cam-khong-duong-1.jpg' WHERE item_id = 11; -- Nước cam ép
UPDATE Menu_Items SET image_url = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQd6i8rUWJk3F33WV0mT-seavLzCwoWYX74mw&s' WHERE item_id = 12; -- Soda chanh bạc hà

-- Bánh ngọt (category_id = 4)
UPDATE Menu_Items SET image_url = 'https://png.pngtree.com/thumb_back/fh260/background/20260110/pngtree-delicious-croissants-with-jam-and-fresh-fruit-display-image_21057635.webp' WHERE item_id = 13; -- Croissant
UPDATE Menu_Items SET image_url = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRbYdshqPEgA8gS4XyvX0YJQbS9Hp0vfEv29Q&s' WHERE item_id = 14; -- Bánh mì ngọt
UPDATE Menu_Items SET image_url = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQUq0M5im7R3gfF52jzRLMxJnyjPha7ydMB8w&s' WHERE item_id = 15; -- Cheesecake

-- Thức ăn nhẹ (category_id = 5)
UPDATE Menu_Items SET image_url = 'https://png.pngtree.com/thumb_back/fh260/background/20230907/pngtree-grilled-chicken-sandwich-sandwich-with-tomatoes-and-onions-image_13360749.jpg' WHERE item_id = 16; -- Sandwich gà
UPDATE Menu_Items SET image_url = 'https://tiki.vn/blog/wp-content/uploads/2023/04/2PGAHdXManXStd-pJYw3ju50jTMBnhx_FYaCBxWEMXSYCZGfgiK_5i_C0M8Lz8DWfsZGiFhFidJ8MHEPh215V_L0Ele0vuth3lDE7Vf70tFyZj3ef2bMY76CgvJaix0KTb6jHjepYTSQDawg46R9vv8.jpg' WHERE item_id = 17; -- Mì ý sốt bò bằm

GO

-- ============================================
-- KIỂM TRA KẾT QUẢ
-- ============================================
SELECT item_id, item_name, image_url FROM Menu_Items ORDER BY category_id, item_id;
GO

PRINT '✅ Đã cập nhật ảnh cho menu!';
GO