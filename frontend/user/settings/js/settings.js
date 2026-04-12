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
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../../../auth/html/auth.html';
        return;
    }
    
    loadSettings();
    initEventListeners();
    initDropdown();
    updateUserInfo();
    initLogout();
    updateNavbarCartCount();
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

// Save settings to localStorage
function saveSettings() {
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

// ========== PROFILE DROPDOWN ==========
function initDropdown() {
    const profileBtn = document.getElementById('profileBtn');
    const profileDropdown = document.getElementById('profileDropdown');
    
    if (profileBtn) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle('active');
        });
    }
    
    document.addEventListener('click', () => {
        const dropdown = document.getElementById('profileDropdown');
        if (dropdown) dropdown.classList.remove('active');
    });
}

function updateUserInfo() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const avatarImg = document.getElementById('avatarImg');
    const userNameShort = document.getElementById('userNameShort');
    const savedAvatar = localStorage.getItem('userAvatar');
    
    if (avatarImg) {
        avatarImg.src = savedAvatar || `https://ui-avatars.com/api/?background=E67E22&color=fff&rounded=true&size=32&name=${encodeURIComponent(user.full_name || 'User')}`;
    }
    if (userNameShort) {
        const shortName = user.full_name ? user.full_name.split(' ').pop() : 'User';
        userNameShort.textContent = shortName;
    }
}

function initLogout() {
    const logoutBtn = document.getElementById('logoutDropdownBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = '../../../auth/html/auth.html';
        });
    }
}