const { executeQuery } = require('./config/js/db');
require('dotenv').config();

async function run() {
    try {
        // HELLO2026
        await executeQuery("DELETE FROM DiscountCodes WHERE code = 'HELLO2026'");
        await executeQuery(`
            INSERT INTO DiscountCodes (code, discount_type, discount_value, min_order_amount, expiry_date, usage_limit, usage_count, is_active, description) 
            VALUES ('HELLO2026', 'percentage', 30, 0, '2026-12-31', 1000, 0, 1, @d)`, 
            { d: 'Chào mừng năm mới 2026 - Giảm 30%' }
        );

        // Update others
        const codes = [
            { c: 'WELCOME2024', d: 'Giảm 20% cho thành viên mới' },
            { c: 'WEEKLY10', d: 'Giảm 10% hàng tuần cho đơn trên 50k' },
            { c: 'COFFEE50', d: 'Giảm 50k cho đơn hàng trên 200k' }
        ];

        for (const code of codes) {
            await executeQuery('UPDATE DiscountCodes SET description = @d WHERE code = @c', { c: code.c, d: code.d });
        }

        console.log('✅ Success: Font encoding and HELLO2026 updated');
    } catch (e) {
        console.error('❌ Error:', e.message);
    } finally {
        process.exit();
    }
}

run();
