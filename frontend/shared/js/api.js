// frontend/shared/js/api.js
const API_BASE_URL = 'http://localhost:5000/api';

function getToken() {
    return localStorage.getItem('token');
}

// 🆕 Cập nhật số lượng giỏ hàng trên navbar
function updateCartBadge() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    
    // Tìm tất cả các badge trên navbar
    const cartBadges = document.querySelectorAll('.cart-badge');
    cartBadges.forEach(badge => {
        if (totalItems > 0) {
            badge.textContent = totalItems;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    });
}

// Lắng nghe sự kiện storage (khi giỏ hàng thay đổi ở tab khác)
window.addEventListener('storage', (e) => {
    if (e.key === 'cart') {
        updateCartBadge();
    }
});

async function fetchAPI(endpoint, options = {}) {
    const token = getToken();
    
    const headers = {
        'Content-Type': 'application/json',
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const config = {
        ...options,
        headers: {
            ...headers,
            ...options.headers
        }
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Có lỗi xảy ra');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

async function get(endpoint) {
    return fetchAPI(endpoint, { method: 'GET' });
}

async function post(endpoint, data) {
    return fetchAPI(endpoint, {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

async function put(endpoint, data) {
    return fetchAPI(endpoint, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
}

async function del(endpoint) {
    return fetchAPI(endpoint, { method: 'DELETE' });
}

// 🆕 Lấy cấu hình cửa hàng (currency, language)
async function getStoreSettings() {
    try {
        const settings = await fetch(`${API_BASE_URL}/store`).then(res => res.json());
        localStorage.setItem('store_currency', settings.currency || 'VND');
        localStorage.setItem('store_language', settings.language || 'vi');
        return settings;
    } catch (e) {
        console.error('Failed to load store settings:', e);
        return { currency: 'VND', language: 'vi' };
    }
}

// 🆕 Định dạng tiền tệ theo cấu hình
function formatCurrency(amount) {
    const currency = localStorage.getItem('store_currency') || 'VND';
    const lang = localStorage.getItem('store_language') || 'vi';
    
    // Nếu USD, có thể chia tỷ giá (giả định 1 USD = 25000 VND nếu dữ liệu gốc là VND)
    // Hoặc nếu dữ liệu đã là USD thì cứ để nguyên.
    // Ở đây ta giả định nếu currency là USD thì format theo chuẩn USD.
    
    return new Intl.NumberFormat(lang === 'vi' ? 'vi-VN' : 'en-US', {
        style: 'currency',
        currency: currency
    }).format(amount);
}

// Export cho các trang sử dụng (nếu dùng module)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { get, post, put, del, fetchAPI, getToken, updateCartBadge, formatCurrency, getStoreSettings };
}

// Tự động load settings khi script được load
getStoreSettings();