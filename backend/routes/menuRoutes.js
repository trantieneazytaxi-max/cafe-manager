const express = require('express');
const router = express.Router();
const { executeQuery, sql } = require('../config/js/db');

// Lấy tất cả danh mục
router.get('/categories', async (req, res) => {
    try {
        const result = await executeQuery(`
            SELECT category_id, category_name, description 
            FROM Categories 
            ORDER BY category_id
        `);
        
        res.json(result.recordset);
    } catch (error) {
        console.error('Lỗi lấy danh mục:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// Lấy tất cả món ăn
router.get('/items', async (req, res) => {
    try {
        const result = await executeQuery(`
            SELECT 
                mi.item_id,
                mi.item_name,
                mi.price,
                mi.description,
                mi.status,
                mi.category_id,
                c.category_name,
                mi.image_url
            FROM Menu_Items mi
            JOIN Categories c ON mi.category_id = c.category_id
            WHERE mi.status = 'available'
            ORDER BY c.category_id, mi.item_name
        `);
        
        res.json(result.recordset);
    } catch (error) {
        console.error('Lỗi lấy thực đơn:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// 🆕 Lấy tùy chọn cho một món (SỬA CÁCH TRUYỀN PARAM)
router.get('/items/:id/options', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Lấy thông tin tùy chọn của món - TRUYỀN TRỰC TIẾP id
        const optionResult = await executeQuery(`
            SELECT has_size, has_temperature 
            FROM ItemOptions 
            WHERE item_id = @item_id
        `, { item_id: id });  // ✅ Truyền trực tiếp, không cần object
        
        const itemOptions = optionResult.recordset[0] || { has_size: 0, has_temperature: 0 };
        
        // Lấy danh sách size
        const sizes = await executeQuery(`
            SELECT size_id, size_code, size_name, price_multiplier 
            FROM DrinkSizes 
            ORDER BY sort_order
        `);
        
        // Lấy danh sách nhiệt độ
        const temps = await executeQuery(`
            SELECT temp_id, temp_code, temp_name 
            FROM DrinkTemperatures 
            ORDER BY sort_order
        `);
        
        res.json({
            has_size: itemOptions.has_size,
            has_temperature: itemOptions.has_temperature,
            sizes: sizes.recordset,
            temperatures: temps.recordset
        });
        
    } catch (error) {
        console.error('Lỗi lấy tùy chọn:', error);
        res.status(500).json({ message: 'Lỗi server: ' + error.message });
    }
});

// 🆕 Tính giá theo tùy chọn
router.post('/items/:id/calculate-price', async (req, res) => {
    try {
        const { id } = req.params;
        const { size_id, temp_id } = req.body;
        
        // Lấy giá gốc - TRUYỀN TRỰC TIẾP id
        const itemResult = await executeQuery(`
            SELECT price FROM Menu_Items WHERE item_id = @item_id
        `, { item_id: id });  // ✅ Truyền trực tiếp
        
        let finalPrice = itemResult.recordset[0].price;
        
        // Nhân với hệ số size nếu có
        if (size_id) {
            const sizeResult = await executeQuery(`
                SELECT price_multiplier FROM DrinkSizes WHERE size_id = @size_id
            `, { size_id: size_id });  // ✅ Truyền trực tiếp
            
            if (sizeResult.recordset.length > 0) {
                finalPrice = finalPrice * sizeResult.recordset[0].price_multiplier;
            }
        }
        
        res.json({ 
            original_price: itemResult.recordset[0].price,
            final_price: Math.round(finalPrice)
        });
        
    } catch (error) {
        console.error('Lỗi tính giá:', error);
        res.status(500).json({ message: 'Lỗi server: ' + error.message });
    }
});

// Lấy món theo danh mục
router.get('/items/category/:categoryId', async (req, res) => {
    try {
        const { categoryId } = req.params;
        
        const result = await executeQuery(`
            SELECT 
                mi.item_id,
                mi.item_name,
                mi.price,
                mi.description,
                mi.status,
                mi.category_id,
                c.category_name
            FROM Menu_Items mi
            JOIN Categories c ON mi.category_id = c.category_id
            WHERE mi.category_id = @categoryId AND mi.status = 'available'
            ORDER BY mi.item_name
        `, { categoryId: categoryId });  // ✅ Sửa lại cách truyền
        
        res.json(result.recordset);
    } catch (error) {
        console.error('Lỗi lấy món theo danh mục:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// Lấy chi tiết một món
router.get('/items/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await executeQuery(`
            SELECT 
                mi.item_id,
                mi.item_name,
                mi.price,
                mi.description,
                mi.status,
                mi.category_id,
                c.category_name
            FROM Menu_Items mi
            JOIN Categories c ON mi.category_id = c.category_id
            WHERE mi.item_id = @id
        `, { id: id });  // ✅ Sửa lại cách truyền
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy món' });
        }
        
        res.json(result.recordset[0]);
    } catch (error) {
        console.error('Lỗi lấy chi tiết món:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

module.exports = router;