/**
 * Goong Maps + Leaflet (OpenStreetMap) Hybrid — Goong geocoding, Leaflet display
 * Goong API: https://goong.io/
 */
(function (global) {
    var LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    var LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

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
     * @param {Object} options - { center: [lat, lng], onSelect: function({lat, lng, distance}), apiKey: goong_api_key }
     */
    async function initLeafletPicker(containerId, options) {
        await loadLeaflet();
        options = options || {};
        var center = options.center || [21.0278, 105.8342]; // Hà Nội mặc định
        var storePos = options.storePos || center; // Vị trí quán để tính km
        var apiKey = options.apiKey || global.goongApiKey;

        var map = L.map(containerId).setView(center, 15);
        
        // Goong Maps chỉ hỗ trợ vector tiles qua MapLibre GL JS SDK,
        // không hỗ trợ raster PNG tiles → dùng OpenStreetMap cho Leaflet
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | <a href="https://goong.io">Goong Maps</a>',
            maxZoom: 19
        }).addTo(map);

        // --- Store marker (cam) ---
        var storeIcon = L.divIcon({
            className: '',
            html: '<div style="background:#f97316;width:18px;height:18px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>',
            iconSize: [18, 18],
            iconAnchor: [9, 9]
        });
        L.marker(storePos, { icon: storeIcon, title: 'Vị trí quán' }).addTo(map)
            .bindPopup('<b>🏪 Vị trí quán</b>').openPopup();

        // --- Delivery marker (xanh, draggable) ---
        var marker = L.marker(center, { draggable: true }).addTo(map);

        // --- Route polyline state ---
        var routeLayer = null;

        function clearRoute() {
            if (routeLayer) { map.removeLayer(routeLayer); routeLayer = null; }
        }

        async function drawRoute(fromLatLng, toLatLng) {
            clearRoute();
            var goongKey = options.apiKey || global.goongApiKey;
            if (!goongKey || !fromLatLng || !toLatLng) return null;

            try {
                var url = 'https://rsapi.goong.io/Direction?origin=' +
                    fromLatLng[0] + ',' + fromLatLng[1] +
                    '&destination=' + toLatLng.lat + ',' + toLatLng.lng +
                    '&vehicle=car&api_key=' + goongKey;

                var res = await fetch(url);
                var data = await res.json();

                if (!data.routes || !data.routes[0]) return null;

                var route = data.routes[0];

                // Decode polyline từ overview_polyline
                var encoded = route.overview_polyline.points;
                var latlngs = decodePolyline(encoded);

                routeLayer = L.polyline(latlngs, {
                    color: '#f97316',
                    weight: 5,
                    opacity: 0.85,
                    lineJoin: 'round'
                }).addTo(map);

                // Fit map to show full route
                map.fitBounds(routeLayer.getBounds(), { padding: [40, 40] });

                // Cập nhật route info panel (nếu có trên trang)
                var leg = route.legs && route.legs[0];
                var actualDistance = null;
                if (leg) {
                    var distEl = document.getElementById('routeDistance');
                    var durEl  = document.getElementById('routeDuration');
                    var infoEl = document.getElementById('routeInfo');
                    if (distEl) distEl.textContent = leg.distance ? leg.distance.text : '--';
                    if (durEl)  durEl.textContent  = leg.duration ? leg.duration.text : '--';
                    if (infoEl) infoEl.style.display = 'flex';

                    if (leg.distance && typeof leg.distance.value === 'number') {
                        actualDistance = leg.distance.value / 1000;
                    }
                }
                return actualDistance;
            } catch (e) {
                console.warn('Goong Directions error:', e);
                return null;
            }
        }

        // Google Encoded Polyline decoder
        function decodePolyline(encoded) {
            var points = [], index = 0, len = encoded.length;
            var lat = 0, lng = 0;
            while (index < len) {
                var b, shift = 0, result = 0;
                do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
                lat += (result & 1) ? ~(result >> 1) : (result >> 1);
                shift = 0; result = 0;
                do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
                lng += (result & 1) ? ~(result >> 1) : (result >> 1);
                points.push([lat / 1e5, lng / 1e5]);
            }
            return points;
        }

        function updatePosition(latlng) {
            drawRoute(storePos, latlng).then(function(actualDist) {
                var dist = actualDist !== null ? actualDist : haversineKm(storePos[0], storePos[1], latlng.lat, latlng.lng);
                if (typeof options.onSelect === 'function') {
                    options.onSelect({
                        lat: latlng.lat,
                        lng: latlng.lng,
                        distance: dist.toFixed(2)
                    });
                }
            });
        }

        marker.on('dragend', function(e) {
            updatePosition(e.target.getLatLng());
        });

        map.on('click', function(e) {
            marker.setLatLng(e.latlng);
            updatePosition(e.latlng);
        });

        // Nếu toạ độ khởi tạo khác vị trí quán (ví dụ vị trí đã lưu của khách), vẽ route ngay lập tức
        if (center[0] !== storePos[0] || center[1] !== storePos[1]) {
            updatePosition({ lat: center[0], lng: center[1] });
        }

        return { map: map, marker: marker, updatePosition: updatePosition };
    }

    /**
     * Goong Maps Geocoding API
     */
    function loadGoongPlaces(apiKey, maptileKey) {
        if (!apiKey) return Promise.reject(new Error('Missing Goong API Key'));
        console.log('🔑 Goong Maps loaded:', { apiKey: apiKey.substring(0, 10) + '...', maptileKey: maptileKey ? maptileKey.substring(0, 10) + '...' : 'undefined' });
        global.goongApiKey = apiKey;
        global.goongMaptileKey = maptileKey || apiKey;
        return Promise.resolve();
    }

    /**
     * Attach Goong Geocoding autocomplete to input element
     */
    function attachPlacesAutocomplete(inputEl, options) {
        if (!global.goongApiKey) {
            console.error('Goong API key not loaded');
            return;
        }

        var apiKey = global.goongApiKey;
        var suggestionsContainer = null;
        var selectedResult = null;

        // Create suggestions dropdown
        var wrapper = document.createElement('div');
        wrapper.className = 'goong-geocoder-wrapper';
        wrapper.style.position = 'relative';
        wrapper.style.display = 'inline-block';
        wrapper.style.width = '100%';

        var suggestionsBox = document.createElement('ul');
        suggestionsBox.className = 'goong-suggestions';
        suggestionsBox.style.cssText = `
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: rgba(20, 20, 35, 0.95);
            border: 1px solid rgba(0, 243, 255, 0.2);
            border-radius: 12px;
            list-style: none;
            margin: 0;
            padding: 0;
            max-height: 300px;
            overflow-y: auto;
            z-index: 1000;
            display: none;
        `;

        inputEl.parentElement.insertBefore(wrapper, inputEl);
        wrapper.appendChild(inputEl);
        wrapper.appendChild(suggestionsBox);

        var debounceTimer = null;

        // Handle input changes
        inputEl.addEventListener('input', function (e) {
            clearTimeout(debounceTimer);
            var query = e.target.value.trim();

            if (!query) {
                suggestionsBox.style.display = 'none';
                if (typeof options.onInputCleared === 'function') {
                    options.onInputCleared();
                }
                return;
            }

            debounceTimer = setTimeout(function () {
                fetchGoongSuggestions(query, apiKey, suggestionsBox, inputEl, options);
            }, 300);
        });

        // Handle clicking outside
        document.addEventListener('click', function (e) {
            if (!wrapper.contains(e.target)) {
                suggestionsBox.style.display = 'none';
            }
        });
    }

    function fetchGoongSuggestions(query, apiKey, suggestionsBox, inputEl, options) {
        var url = 'https://rsapi.goong.io/geocode?address=' + 
                  encodeURIComponent(query) + '&api_key=' + apiKey;

        fetch(url)
            .then(function (res) { return res.json(); })
            .then(function (data) {
                suggestionsBox.innerHTML = '';

                if (!data.results || data.results.length === 0) {
                    var noResult = document.createElement('li');
                    noResult.style.cssText = 'padding: 12px; color: #888; text-align: center;';
                    noResult.textContent = 'Không tìm thấy kết quả';
                    suggestionsBox.appendChild(noResult);
                    suggestionsBox.style.display = 'block';
                    return;
                }

                data.results.forEach(function (result) {
                    var li = document.createElement('li');
                    li.style.cssText = `
                        padding: 12px 16px;
                        cursor: pointer;
                        border-bottom: 1px solid rgba(0, 243, 255, 0.1);
                        transition: background 0.2s;
                        color: #fff;
                        font-size: 0.9rem;
                    `;
                    li.textContent = result.formatted_address;

                    li.addEventListener('mouseenter', function () {
                        li.style.background = 'rgba(0, 243, 255, 0.1)';
                    });

                    li.addEventListener('mouseleave', function () {
                        li.style.background = 'transparent';
                    });

                    li.addEventListener('click', function () {
                        inputEl.value = result.formatted_address;
                        suggestionsBox.style.display = 'none';

                        var geometry = result.geometry || {};
                        if (typeof options.onPlace === 'function') {
                            options.onPlace({
                                lat: geometry.location ? geometry.location.lat : null,
                                lng: geometry.location ? geometry.location.lng : null,
                                formattedAddress: result.formatted_address,
                                placeId: result.place_id || null
                            });
                        }
                    });

                    suggestionsBox.appendChild(li);
                });

                suggestionsBox.style.display = 'block';
            })
            .catch(function (err) {
                console.error('Goong geocoding error:', err);
            });
    }

    global.loadGoongPlaces = loadGoongPlaces;
    global.loadLeaflet = loadLeaflet;
    global.initLeafletPicker = initLeafletPicker;
    global.attachPlacesAutocomplete = attachPlacesAutocomplete;
    global.haversineKm = haversineKm;
    
    // Backward compatibility - remove Mapbox references
    global.loadMapboxPlaces = null;



})(typeof window !== 'undefined' ? window : globalThis);
