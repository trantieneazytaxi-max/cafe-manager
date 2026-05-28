const { executeQuery } = require('../config/js/db');

const STORE_KEYS = [
    'store_name', 'store_address', 'store_lat', 'store_lng', 'store_place_id', 
    'hero_banners', 'vat_rate', 'default_shipping', 'free_ship_threshold', 
    'currency', 'language', 'store_phone', 'store_email', 'store_opening_hours',
    'danmaku_enabled', 'danmaku_messages', 'bgm_enabled', 'bgm_url', 'bgm_volume'
];

exports.upsertSetting = async (key, value) => {
    const strVal = value === undefined || value === null ? '' : String(value);
    const updated = await executeQuery(`UPDATE Settings SET setting_value = @val, updated_at = GETDATE() WHERE setting_key = @key`, { key, val: strVal });
    if (!updated.rowsAffected[0]) {
        await executeQuery(`INSERT INTO Settings (setting_key, setting_value) VALUES (@key, @val)`, { key, val: strVal });
    }
};

exports.loadStoreMap = async () => {
    const list = STORE_KEYS.map(k => `'${k}'`).join(',');
    const result = await executeQuery(`SELECT setting_key, setting_value FROM Settings WHERE setting_key IN (${list})`);
    const map = {};
    for (const row of result.recordset) {
        map[row.setting_key.toLowerCase()] = row.setting_value;
    }
    return map;
};

exports.STORE_KEYS = STORE_KEYS;
