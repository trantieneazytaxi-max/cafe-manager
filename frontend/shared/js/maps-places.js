/**
 * Mapbox + Leaflet (OpenStreetMap) Hybrid — Hỗ trợ miễn phí & độ chính xác cao.
 */
(function (global) {
    var MAPBOX_GL = 'https://api.mapbox.com/mapbox-gl-js/v3.7.0/mapbox-gl';
    var GEO = 'https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-geocoder/v5.0.2/mapbox-gl-geocoder';
    var LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    var LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

    var mapboxLoadPromise = null;
    var leafletLoadPromise = null;

    function loadCss(href) {
        return new Promise(function (resolve, reject) {
            if (document.querySelector('link[href="' + href + '"]')) return resolve();
            var l = document.createElement('link');
            l.rel = 'stylesheet'; l.href = href;
            l.onload = resolve; l.onerror = reject;
            document.head.appendChild(l);
        });
    }

    function loadScript(src) {
        return new Promise(function (resolve, reject) {
            if (document.querySelector('script[src="' + src + '"]')) return resolve();
            var s = document.createElement('script');
            s.src = src; s.async = true;
            s.onload = resolve; s.onerror = reject;
            document.head.appendChild(s);
        });
    }

    function loadLeaflet() {
        if (leafletLoadPromise) return leafletLoadPromise;
        leafletLoadPromise = loadCss(LEAFLET_CSS).then(function() {
            return loadScript(LEAFLET_JS);
        });
        return leafletLoadPromise;
    }

    function haversineKm(lat1, lon1, lat2, lon2) {
        var R = 6371;
        var dLat = (lat2 - lat1) * Math.PI / 180;
        var dLon = (lon2 - lon1) * Math.PI / 180;
        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * Khởi tạo bản đồ Leaflet để chọn vị trí (Ghim trên bản đồ)
     * @param {string} containerId - ID của div chứa map
     * @param {Object} options - { center: [lat, lng], onSelect: function({lat, lng, distance}) }
     */
    async function initLeafletPicker(containerId, options) {
        await loadLeaflet();
        options = options || {};
        var center = options.center || [21.0278, 105.8342]; // Hà Nội mặc định
        var storePos = options.storePos || center; // Vị trí quán để tính km

        var map = L.map(containerId).setView(center, 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        var marker = L.marker(center, { draggable: true }).addTo(map);

        function updatePosition(latlng) {
            var dist = haversineKm(storePos[0], storePos[1], latlng.lat, latlng.lng);
            if (typeof options.onSelect === 'function') {
                options.onSelect({
                    lat: latlng.lat,
                    lng: latlng.lng,
                    distance: dist.toFixed(2)
                });
            }
        }

        marker.on('dragend', function(e) {
            updatePosition(e.target.getLatLng());
        });

        map.on('click', function(e) {
            marker.setLatLng(e.latlng);
            updatePosition(e.latlng);
        });

        return { map: map, marker: marker };
    }

    // Các hàm Mapbox cũ giữ lại để tương thích
    function loadMapboxPlaces(token) {
        if (!token) return Promise.reject(new Error('Missing Token'));
        if (mapboxLoadPromise) return mapboxLoadPromise;
        mapboxLoadPromise = loadCss(MAPBOX_GL + '.css')
            .then(function () { return loadCss(GEO + '.css'); })
            .then(function () { return loadScript(MAPBOX_GL + '.js'); })
            .then(function () { return loadScript(GEO + '.min.js'); })
            .then(function () { global.mapboxgl.accessToken = token; });
        return mapboxLoadPromise;
    }

    function attachPlacesAutocomplete(inputEl, options) {
        if (!global.MapboxGeocoder) {
            console.error('MapboxGeocoder not loaded');
            return;
        }
        var geocoder = new global.MapboxGeocoder({
            accessToken: global.mapboxgl.accessToken,
            mapboxgl: global.mapboxgl,
            placeholder: options.placeholder || 'Tìm kiếm địa chỉ...',
            marker: false
        });

        geocoder.on('result', function (e) {
            var coords = e.result.geometry.coordinates;
            if (typeof options.onPlace === 'function') {
                options.onPlace({
                    lat: coords[1],
                    lng: coords[0],
                    formattedAddress: e.result.place_name,
                    placeId: e.result.id
                });
            }
        });

        geocoder.on('clear', function () {
            if (typeof options.onInputCleared === 'function') {
                options.onInputCleared();
            }
        });

        // Thay thế input thật bằng geocoder
        var container = inputEl.parentElement;
        var wrapper = document.createElement('div');
        wrapper.className = 'mapbox-geocoder-wrapper';
        container.insertBefore(wrapper, inputEl);
        wrapper.appendChild(geocoder.onAdd());
        
        // Hide original input but keep it for ID compatibility if needed
        inputEl.style.display = 'none';
        
        // Sync geocoder input with original if needed
        var geoInput = wrapper.querySelector('input');
        if (geoInput && inputEl.value) {
            geoInput.value = inputEl.value;
        }

        return geocoder;
    }

    global.loadMapboxPlaces = loadMapboxPlaces;
    global.loadLeaflet = loadLeaflet;
    global.initLeafletPicker = initLeafletPicker;
    global.attachPlacesAutocomplete = attachPlacesAutocomplete;
    global.haversineKm = haversineKm;



})(typeof window !== 'undefined' ? window : globalThis);
