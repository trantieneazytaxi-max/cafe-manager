/**
 * SETTINGS PAGE - CAFE MANAGEMENT
 */

// DOM Elements
const emailNotification = document.getElementById('emailNotification');
const smsNotification = document.getElementById('smsNotification');
const languageSelect = document.getElementById('languageSelect');
const currencySelect = document.getElementById('currencySelect');
const darkModeToggle = document.getElementById('darkModeToggle');
const clearDataBtn = document.getElementById('clearDataBtn');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');

// Check authentication
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../../../auth/html/auth.html';
        return;
    }
    
    loadSettings();
    initEventListeners();
    updateNavbarCartCount();
    await loadProfileAddress();
    initAddressAutocomplete();
});

// Load settings from localStorage
function loadSettings() {
    const emailNotif = localStorage.getItem('emailNotification') === 'true';
    const smsNotif = localStorage.getItem('smsNotification') === 'true';
    const language = localStorage.getItem('language') || 'vi';
    const currency = localStorage.getItem('currency') || 'VND';
    const darkMode = localStorage.getItem('darkMode') === 'true';
    
    if (emailNotification) emailNotification.checked = emailNotif;
    if (smsNotification) smsNotification.checked = smsNotif;
    if (languageSelect) languageSelect.value = language;
    if (currencySelect) currencySelect.value = currency;
    if (darkModeToggle) darkModeToggle.checked = darkMode;
    
    // Áp dụng dark mode nếu có
    if (darkMode) {
        document.body.classList.add('dark-mode');
    }
}

async function loadProfileAddress() {
    const token = localStorage.getItem('token');
    const addrEl = document.getElementById('deliveryAddressPref');
    if (!token || !addrEl) return;
    try {
        const response = await fetch('http://localhost:5000/api/customer/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok) {
            if (data.delivery_address) addrEl.value = data.delivery_address;
            const latEl = document.getElementById('deliveryLatPref');
            const lngEl = document.getElementById('deliveryLngPref');
            const autoFillEl = document.getElementById('autoFillAddressPref');
            if (latEl && data.delivery_lat != null) latEl.value = String(data.delivery_lat);
            if (lngEl && data.delivery_lng != null) lngEl.value = String(data.delivery_lng);
            if (autoFillEl) autoFillEl.checked = data.auto_fill_address !== 0;

        }
    } catch (e) {
        console.error(e);
    }
}

function initAddressAutocomplete() {
    const addrInput = document.getElementById('deliveryAddressPref');
    if (!addrInput || typeof loadMapboxPlaces !== 'function') return;

    fetch('http://localhost:5000/api/store')
        .then((r) => r.json())
        .then((data) => {
            if (!data.mapboxAccessToken) {
                return;
            }

            return loadMapboxPlaces(data.mapboxAccessToken).then(() =>
                attachPlacesAutocomplete(addrInput, {
                    onPlace: (p) => {
                        document.getElementById('deliveryLatPref').value = String(p.lat);
                        document.getElementById('deliveryLngPref').value = String(p.lng);
                        const el = document.getElementById('deliveryAddressPref');
                        if (el && 'value' in el) el.value = p.formattedAddress;
                    },
                    onInputCleared: () => {
                        document.getElementById('deliveryLatPref').value = '';
                        document.getElementById('deliveryLngPref').value = '';
                    }
                })
            );
        })
        .catch((e) => console.error(e));
}

// Save settings to localStorage
async function saveSettings() {
    const emailNotif = emailNotification?.checked || false;
    const smsNotif = smsNotification?.checked || false;
    const language = languageSelect?.value || 'vi';
    const currency = currencySelect?.value || 'VND';
    const darkMode = darkModeToggle?.checked || false;
    
    localStorage.setItem('emailNotification', emailNotif);
    localStorage.setItem('smsNotification', smsNotif);
    localStorage.setItem('language', language);
    localStorage.setItem('currency', currency);
    localStorage.setItem('darkMode', darkMode);
    
    // Áp dụng dark mode
    if (darkMode) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }

    const token = localStorage.getItem('token');
    const addrEl = document.getElementById('deliveryAddressPref');
    if (token && addrEl && addrEl.value.trim()) {
        try {
            const storeRes = await fetch('http://localhost:5000/api/store');
            const storeData = await storeRes.json();
            const lat = document.getElementById('deliveryLatPref')?.value;
            const lng = document.getElementById('deliveryLngPref')?.value;
            if (storeData.mapboxAccessToken && (!lat || !lng)) {
                showToast('Chọn địa chỉ từ gợi ý Mapbox để lưu tọa độ', 'error');
                return;
            }
            const putRes = await fetch('http://localhost:5000/api/customer/profile/address', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    delivery_address: addrEl.value.trim(),
                    delivery_lat: lat ? parseFloat(lat) : null,
                    delivery_lng: lng ? parseFloat(lng) : null,
                    auto_fill_address: document.getElementById('autoFillAddressPref')?.checked
                })

            });
            if (!putRes.ok) {
                const err = await putRes.json().catch(() => ({}));
                throw new Error(err.message || 'Không lưu được địa chỉ (chạy migrate_user_address.js trên server)');
            }
        } catch (e) {
            showToast(e.message || 'Lỗi lưu địa chỉ', 'error');
            return;
        }
    }
    
    showToast('Đã lưu cài đặt thành công', 'success');
}

// Clear cart data
function clearCartData() {
    if (confirm('Bạn có chắc chắn muốn xóa toàn bộ giỏ hàng?')) {
        localStorage.removeItem('cart');
        updateNavbarCartCount();
        showToast('Đã xóa dữ liệu giỏ hàng', 'success');
    }
}

// Update navbar cart count
function updateNavbarCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const cartCountSpan = document.getElementById('cartCount');
    if (cartCountSpan) {
        if (totalItems > 0) {
            cartCountSpan.textContent = totalItems;
            cartCountSpan.style.display = 'inline-block';
        } else {
            cartCountSpan.style.display = 'none';
        }
    }
}

// Event listeners
function initEventListeners() {
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', saveSettings);
    }
    
    if (clearDataBtn) {
        clearDataBtn.addEventListener('click', clearCartData);
    }
}

// Show toast
function showToast(message, type = 'success') {
    let toast = document.querySelector('.custom-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'custom-toast';
        document.body.appendChild(toast);
        
        const style = document.createElement('style');
        style.textContent = `
            .custom-toast {
                position: fixed;
                bottom: 20px;
                right: 20px;
                padding: 12px 20px;
                border-radius: 12px;
                color: white;
                font-size: 0.9rem;
                display: flex;
                align-items: center;
                gap: 10px;
                z-index: 1000;
                animation: slideInRight 0.3s ease;
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            }
            .custom-toast.success { background: #10B981; }
            .custom-toast.error { background: #EF4444; }
            .custom-toast.info { background: #3B82F6; }
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
    
    toast.className = `custom-toast ${type}`;
    toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${message}`;
    toast.style.display = 'flex';
    
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}
