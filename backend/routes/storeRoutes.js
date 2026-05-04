const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/js/db');

const STORE_KEYS = ['store_name', 'store_address', 'store_lat', 'store_lng', 'store_place_id', 'hero_banners'];
const ADMIN_STORE_KEYS = [
    ...STORE_KEYS,
    'store_phone',
    'store_email',
    'vat_rate',
    'default_shipping',
    'free_ship_threshold',
    'currency',
    'language'
];


async function upsertSetting(key, value) {
    const strVal = value === undefined || value === null ? '' : String(value);
    const updated = await executeQuery(
        `UPDATE Settings SET setting_value = @val, updated_at = GETDATE() WHERE setting_key = @key`,
        { key, val: strVal }
    );
    if (!updated.rowsAffected[0]) {
        await executeQuery(
            `INSERT INTO Settings (setting_key, setting_value) VALUES (@key, @val)`,
            { key, val: strVal }
        );
    }
}

async function loadStoreMap() {
    const list = STORE_KEYS.map((k) => `'${k}'`).join(',');
    const result = await executeQuery(
        `SELECT setting_key, setting_value FROM Settings WHERE setting_key IN (${list})`
    );
    const map = {};
    for (const row of result.recordset) {
        map[row.setting_key] = row.setting_value;
    }
    return map;
}

async function loadAdminStoreMap() {
    const list = ADMIN_STORE_KEYS.map((k) => `'${k}'`).join(',');
    const result = await executeQuery(
        `SELECT setting_key, setting_value FROM Settings WHERE setting_key IN (${list})`
    );
    const map = {};
    for (const row of result.recordset) {
        map[row.setting_key] = row.setting_value;
    }
    return map;
}

/** Công khai: địa chỉ quán + key Maps (key cần bật referrer restriction trên Google Cloud) */
router.get('/', async (req, res) => {
    try {
        const map = await loadStoreMap();
        const lat = map.store_lat != null && map.store_lat !== '' ? parseFloat(map.store_lat) : null;
        const lng = map.store_lng != null && map.store_lng !== '' ? parseFloat(map.store_lng) : null;
        res.json({
            storeName: map.store_name || 'Cà Phê Thông Minh',
            address: map.store_address || '',
            lat: Number.isFinite(lat) ? lat : null,
            lng: Number.isFinite(lng) ? lng : null,
            placeId: map.store_place_id || null,
            currency: map.currency || 'VND',
            language: map.language || 'vi',
            mapboxAccessToken: process.env.MAPBOX_ACCESS_TOKEN || '',
            heroBanners: map.hero_banners || ''

        });
    } catch (error) {
        console.error('store GET error:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

module.exports = router;
module.exports.upsertSetting = upsertSetting;
module.exports.loadStoreMap = loadStoreMap;
module.exports.loadAdminStoreMap = loadAdminStoreMap;
module.exports.STORE_KEYS = STORE_KEYS;
