const { executeQuery } = require('../config/js/db');
const Setting = require('../models/setting.model');

exports.getStoreInfo = async (req, res) => {
    try {
        const map = await Setting.loadStoreMap();
        const lat = map.store_lat ? parseFloat(map.store_lat) : null;
        const lng = map.store_lng ? parseFloat(map.store_lng) : null;
        res.json({
            storeName: map.store_name || 'Cà Phê Thông Minh',
            address: map.store_address || '',
            lat, lng,
            placeId: map.store_place_id || null,
            currency: map.currency || 'VND',
            language: map.language || 'vi',
            vatRate: map.vat_rate ? parseFloat(map.vat_rate) : 10,
            defaultShipping: map.default_shipping ? parseFloat(map.default_shipping) : 20000,
            freeShipThreshold: map.free_ship_threshold ? parseFloat(map.free_ship_threshold) : 200000,
            storePhone: map.store_phone || '',
            storeEmail: map.store_email || '',
            storeOpeningHours: map.store_opening_hours || '',
            mapboxAccessToken: process.env.MAPBOX_ACCESS_TOKEN || '',
            heroBanners: map.hero_banners || ''
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.getActiveStaffCount = async (req, res) => {
    try {
        const result = await executeQuery(`SELECT COUNT(DISTINCT user_id) as active_count FROM Attendance WHERE check_out IS NULL AND status = 'active'`);
        res.json({ active_staff: Math.max(1, result.recordset[0].active_count || 0) });
    } catch (error) {
        res.json({ active_staff: 1 });
    }
};
