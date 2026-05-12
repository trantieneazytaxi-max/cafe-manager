const { executeQuery, sql } = require('../config/js/db');

exports.getCategories = async (req, res) => {
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
};

exports.createCategory = async (req, res) => {
    try {
        const { category_name, description } = req.body;
        if (!category_name || category_name.trim() === '') {
            return res.status(400).json({ message: 'Tên danh mục không được để trống' });
        }
        await executeQuery(`
            INSERT INTO Categories (category_name, description)
            VALUES (@name, @desc)
        `, {
            name: category_name.trim(),
            desc: description || ''
        });
        res.json({ success: true, message: 'Thêm danh mục thành công' });
    } catch (error) {
        if (error.number === 2627) {
            res.status(400).json({ message: 'Tên danh mục đã tồn tại' });
        } else {
            res.status(500).json({ message: 'Lỗi server' });
        }
    }
};

exports.getItems = async (req, res) => {
    try {
        const result = await executeQuery(`
            SELECT 
                mi.item_id, mi.item_name, mi.price, mi.description, 
                mi.status, mi.category_id, c.category_name, mi.image_url,
                mi.customizations, mi.is_recommended, mi.is_paused, mi.is_combo
            FROM Menu_Items mi
            JOIN Categories c ON mi.category_id = c.category_id
            WHERE mi.status = 'available'
            ORDER BY c.category_id, mi.item_name
        `);
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.getAdminItems = async (req, res) => {
    try {
        const result = await executeQuery(`
            SELECT 
                mi.item_id, mi.item_name, mi.price, mi.description, 
                mi.status, mi.category_id, c.category_name, mi.image_url,
                mi.customizations, mi.is_recommended, mi.is_paused, mi.is_combo
            FROM Menu_Items mi
            JOIN Categories c ON mi.category_id = c.category_id
            ORDER BY c.category_id, mi.item_name
        `);
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.getStaffItems = async (req, res) => {
    try {
        const result = await executeQuery(`
            SELECT 
                mi.item_id, mi.item_name, mi.price, mi.description, 
                mi.status, mi.category_id, c.category_name, mi.image_url,
                mi.customizations, mi.is_recommended, mi.is_paused
            FROM Menu_Items mi
            JOIN Categories c ON mi.category_id = c.category_id
            WHERE mi.status = 'available'
            ORDER BY c.category_id, mi.item_name
        `);
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.togglePause = async (req, res) => {
    try {
        const { id } = req.params;
        const { is_paused } = req.body;
        await executeQuery(`
            UPDATE Menu_Items SET is_paused = @paused WHERE item_id = @id
        `, { id, paused: is_paused ? 1 : 0 });
        res.json({ success: true, message: is_paused ? 'Đã tạm dừng món' : 'Đã mở lại món' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.getItemOptions = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await executeQuery(`
            SELECT customizations, price FROM Menu_Items WHERE item_id = @id
        `, { id });

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy món' });
        }

        const item = result.recordset[0];
        let customizations = item.customizations ? JSON.parse(item.customizations) : null;
        
        const response = {
            has_size: customizations && customizations.sizes && customizations.sizes.length > 0 ? 1 : 0,
            has_temperature: customizations && customizations.temperatures && customizations.temperatures.length > 0 ? 1 : 0,
            sizes: (customizations && customizations.sizes) ? customizations.sizes.map((s, idx) => ({
                size_id: idx + 1,
                size_code: s.name,
                size_name: s.name,
                price_multiplier: 1,
                extra_price: s.extraPrice || 0
            })) : [],
            temperatures: (customizations && customizations.temperatures) ? customizations.temperatures.map((t, idx) => ({
                temp_id: idx + 1,
                temp_code: t.code || t.name,
                temp_name: t.name
            })) : []
        };
        res.json(response);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.calculatePrice = async (req, res) => {
    try {
        const { id } = req.params;
        const { size_id } = req.body;
        const result = await executeQuery(`SELECT customizations, price FROM Menu_Items WHERE item_id = @id`, { id });
        if (result.recordset.length === 0) return res.status(404).json({ message: 'Không tìm thấy món' });
        
        const item = result.recordset[0];
        let extraPrice = 0;
        if (item.customizations) {
            const cust = JSON.parse(item.customizations);
            if (size_id && cust.sizes && cust.sizes[size_id - 1]) {
                extraPrice = cust.sizes[size_id - 1].extraPrice || 0;
            }
        }
        res.json({ base_price: item.price, extra_price: extraPrice, final_price: item.price + extraPrice });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.createItem = async (req, res) => {
    try {
        const { item_name, category_id, price, description, status, image_url, customizations, is_recommended, is_combo, combo_items } = req.body;
        const pool = await require('../config/js/db').getConnection();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        try {
            const result = await transaction.request()
                .input('name', sql.NVarChar, item_name)
                .input('cat', sql.Int, category_id)
                .input('price', sql.Decimal(10,2), price)
                .input('desc', sql.NVarChar, description || '')
                .input('status', sql.NVarChar, status || 'available')
                .input('img', sql.NVarChar, image_url || null)
                .input('cust', sql.NVarChar, customizations ? JSON.stringify(customizations) : null)
                .input('rec', sql.Bit, is_recommended ? 1 : 0)
                .input('combo', sql.Bit, is_combo ? 1 : 0)
                .query(`
                    INSERT INTO Menu_Items (item_name, category_id, price, description, status, image_url, customizations, is_recommended, is_paused, is_combo)
                    OUTPUT INSERTED.item_id
                    VALUES (@name, @cat, @price, @desc, @status, @img, @cust, @rec, 0, @combo)
                `);
            const newItemId = result.recordset[0].item_id;
            if (is_combo && combo_items) {
                for (const ci of combo_items) {
                    await transaction.request()
                        .input('pid', sql.Int, newItemId).input('cid', sql.Int, ci.child_item_id).input('qty', sql.Int, ci.quantity)
                        .query('INSERT INTO Combo_Items (combo_id, item_id, quantity) VALUES (@pid, @cid, @qty)');
                }
            }
            await transaction.commit();
            res.json({ success: true, message: 'Thêm món thành công' });
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.updateItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { item_name, category_id, price, description, status, image_url, customizations, is_recommended, is_paused, is_combo, combo_items } = req.body;
        const pool = await require('../config/js/db').getConnection();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        try {
            await transaction.request()
                .input('id', sql.Int, id).input('name', sql.NVarChar, item_name).input('cat', sql.Int, category_id)
                .input('price', sql.Decimal(10,2), price).input('desc', sql.NVarChar, description || '')
                .input('status', sql.NVarChar, status || 'available').input('img', sql.NVarChar, image_url || null)
                .input('cust', sql.NVarChar, customizations ? JSON.stringify(customizations) : null)
                .input('rec', sql.Bit, is_recommended ? 1 : 0).input('paused', sql.Bit, is_paused ? 1 : 0).input('combo', sql.Bit, is_combo ? 1 : 0)
                .query(`UPDATE Menu_Items SET item_name=@name, category_id=@cat, price=@price, description=@desc, status=@status, image_url=@img, customizations=@cust, is_recommended=@rec, is_paused=@paused, is_combo=@combo WHERE item_id=@id`);
            await transaction.request().input('id', sql.Int, id).query('DELETE FROM Combo_Items WHERE combo_id = @id');
            if (is_combo && combo_items) {
                for (const ci of combo_items) {
                    await transaction.request().input('pid', sql.Int, id).input('cid', sql.Int, ci.child_item_id).input('qty', sql.Int, ci.quantity).query('INSERT INTO Combo_Items (combo_id, item_id, quantity) VALUES (@pid, @cid, @qty)');
                }
            }
            await transaction.commit();
            res.json({ success: true, message: 'Cập nhật món thành công' });
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.deleteItem = async (req, res) => {
    try {
        const { id } = req.params;
        const check = await executeQuery('SELECT TOP 1 order_id FROM Order_Items WHERE item_id = @id', { id });
        if (check.recordset.length > 0) {
            await executeQuery("UPDATE Menu_Items SET status = 'hidden' WHERE item_id = @id", { id });
            return res.json({ success: true, message: 'Món đã được ẩn' });
        }
        await executeQuery('DELETE FROM Menu_Items WHERE item_id = @id', { id });
        res.json({ success: true, message: 'Xóa món thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.getItemDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await executeQuery(`SELECT mi.item_id, mi.item_name, mi.price, mi.description, mi.status, mi.category_id, c.category_name FROM Menu_Items mi JOIN Categories c ON mi.category_id = c.category_id WHERE mi.item_id = @id`, { id });
        if (result.recordset.length === 0) return res.status(404).json({ message: 'Không tìm thấy món' });
        res.json(result.recordset[0]);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};
