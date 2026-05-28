const { executeQuery } = require('../config/js/db');
const Setting = require('../models/setting.model');

async function testBgmSettings() {
    console.log('--- STARTING BGM DATABASE & MODEL TESTING ---');
    try {
        // 1. Check if keys can be upserted
        console.log('Upserting test BGM values...');
        await Setting.upsertSetting('bgm_enabled', 'true');
        await Setting.upsertSetting('bgm_url', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
        await Setting.upsertSetting('bgm_volume', '0.25');
        console.log('✅ Upsert successful!');

        // 2. Check if keys are loaded successfully by loadStoreMap
        console.log('Loading store settings map...');
        const map = await Setting.loadStoreMap();
        console.log('Loaded store settings keys:', Object.keys(map));
        
        const enabled = map.bgm_enabled;
        const url = map.bgm_url;
        const volume = map.bgm_volume;

        console.log(`- bgm_enabled: ${enabled} (${typeof enabled})`);
        console.log(`- bgm_url: ${url}`);
        console.log(`- bgm_volume: ${volume}`);

        if (enabled === 'true' && url && volume === '0.25') {
            console.log('✅ BGM settings loaded successfully from database!');
        } else {
            console.error('❌ BGM settings loading mismatch!');
            process.exit(1);
        }

        // 3. Query the store info public API endpoint
        console.log('Querying public /api/store endpoint via fetch...');
        const response = await fetch('http://localhost:5000/api/store');
        const data = await response.json();
        console.log('Public Store response data BGM properties:', {
            bgmEnabled: data.bgmEnabled,
            bgmUrl: data.bgmUrl,
            bgmVolume: data.bgmVolume
        });

        if (data.bgmEnabled === true && data.bgmUrl.includes('SoundHelix') && data.bgmVolume === 0.25) {
            console.log('✅ Public endpoint correctly returned BGM settings with proper types!');
        } else {
            console.error('❌ Public endpoint mismatch!');
            process.exit(1);
        }

        console.log('🎉 ALL BGM BACKEND INTEGRATIONS ARE PERFECTLY SUCCESSFUL!');
        process.exit(0);
    } catch (e) {
        console.error('❌ Testing failed with error:', e);
        process.exit(1);
    }
}

testBgmSettings();
