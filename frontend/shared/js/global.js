/**
 * GLOBAL SCRIPT - CAFE MANAGEMENT
 * Chứa các hàm dùng chung cho toàn bộ các trang (Navbar, Footer, Dropdown, Cart)
 */

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGlobalUI);
} else {
    initGlobalUI();
}

function initGlobalUI() {
    initMobileMenu();
    initDropdown();
    updateUserInfo();
    initLogout();
    updateNavbarCartCount();
    initGlobalSearch();
}


// 1. Mobile Menu
function initMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');
    
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }
}

// 2. Profile Dropdown
function initDropdown() {
    const profileBtn = document.getElementById('profileBtn');
    const profileDropdown = document.getElementById('profileDropdown');
    
    if (profileBtn && profileDropdown) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle('active');
        });
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
        const dropdown = document.getElementById('profileDropdown');
        if (dropdown) dropdown.classList.remove('active');
    });
}

// 3. Update User Info in Navbar
function updateUserInfo() {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    const userNameShort = document.getElementById('userNameShort');
    const avatarImg = document.getElementById('avatarImg');
    const savedAvatar = localStorage.getItem('userAvatar');
    const dropdownMenu = document.getElementById('dropdownMenu');
    
    let user = {};
    if (userStr) {
        try {
            user = JSON.parse(userStr);
        } catch(e){}
    }
    
    const displayName = user.full_name || 'Khách';
    
    if (userNameShort) {
        const nameParts = displayName.split(' ');
        userNameShort.textContent = nameParts[nameParts.length - 1] || displayName;
    }
    
    if (avatarImg) {
        avatarImg.src = savedAvatar || `https://ui-avatars.com/api/?background=E67E22&color=fff&rounded=true&size=32&name=${encodeURIComponent(displayName)}`;
    }
    
    if (dropdownMenu) {
        if (token && user.full_name) {
            // Logged in
            dropdownMenu.innerHTML = `
                <a href="../../profile/html/profile.html"><i class="fas fa-user-circle"></i> Thông tin cá nhân</a>
                <a href="../../settings/html/settings.html"><i class="fas fa-cog"></i> Cài đặt</a>
                <hr>
                <a href="#" id="logoutDropdownBtn"><i class="fas fa-sign-out-alt"></i> Đăng xuất</a>
            `;
            initLogout(); // attach listener to the newly created button
        } else {
            // Guest
            dropdownMenu.innerHTML = `
                <a href="../../../auth/html/auth.html"><i class="fas fa-sign-in-alt"></i> Đăng nhập</a>
            `;
        }
    }
}

// 4. Logout Functionality
function initLogout() {
    const logoutBtn = document.getElementById('logoutDropdownBtn');
    if (logoutBtn) {
        // Remove old listener to prevent duplicates if called multiple times
        const newBtn = logoutBtn.cloneNode(true);
        logoutBtn.parentNode.replaceChild(newBtn, logoutBtn);
        
        newBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = '../../../auth/html/auth.html';
        });
    }
}

// 5. Update Cart Badge Count
function updateNavbarCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const badges = document.querySelectorAll('.cart-badge');
    
    badges.forEach(badge => {
        if (totalItems > 0) {
            badge.textContent = totalItems;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    });
}

// 6. Global Toast Notification (Optional, có thể tái sử dụng)
function showGlobalToast(message, type = 'success') {
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
                z-index: 9999;
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
    toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i> ${message}`;
    toast.style.display = 'flex';
    
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}
// 6. Global Search
let globalSearchCache = [];
let isSearchCacheLoaded = false;

async function initGlobalSearch() {
    const searchInput = document.getElementById('globalSearchInput');
    if (!searchInput) return;

    // Tạo container dropdown nếu chưa có
    let searchDropdown = document.getElementById('globalSearchDropdown');
    if (!searchDropdown) {
        searchDropdown = document.createElement('div');
        searchDropdown.id = 'globalSearchDropdown';
        searchDropdown.className = 'search-results-dropdown';
        searchInput.parentElement.appendChild(searchDropdown);
    }

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            if (!query) return;

            if (window.location.pathname.includes('menu.html') && typeof searchMenuItems === 'function') {
                searchMenuItems(query);
                searchDropdown.style.display = 'none';
            } else {
                const menuPath = window.location.pathname.includes('/user/') 
                    ? '../../menu/html/menu.html' 
                    : '/user/menu/html/menu.html';
                window.location.href = `${menuPath}?search=${encodeURIComponent(query)}`;
            }
        }
    });

    searchInput.addEventListener('input', async (e) => {
        const query = e.target.value.trim().toLowerCase();
        
        if (!query) {
            searchDropdown.style.display = 'none';
            return;
        }

        // Fetch data if not loaded
        if (!isSearchCacheLoaded) {
            try {
                // If we're already on menu.html and have allItems, use it
                if (typeof allItems !== 'undefined' && Array.isArray(allItems) && allItems.length > 0) {
                    globalSearchCache = allItems;
                    isSearchCacheLoaded = true;
                } else {
                    const response = await fetch('http://localhost:5000/api/menu/items');
                    globalSearchCache = await response.json();
                    isSearchCacheLoaded = true;
                }
            } catch (err) {
                console.error('Error fetching search items:', err);
            }
        }

        const results = globalSearchCache.filter(item => 
            !item.is_paused && (
                item.item_name.toLowerCase().includes(query) || 
                (item.description && item.description.toLowerCase().includes(query))
            )
        ).slice(0, 5); // Show top 5 results

        if (results.length > 0) {
            searchDropdown.innerHTML = results.map(item => {
                let imgUrl = 'https://placehold.co/100x100?text=No+Image';
                if (item.image_url) {
                    const prefix = 'http://localhost:5000';
                    imgUrl = item.image_url.startsWith('http') 
                        ? item.image_url 
                        : (item.image_url.startsWith('/') ? prefix + item.image_url : prefix + '/' + item.image_url);
                }
                
                const menuPath = window.location.pathname.includes('/user/') 
                    ? '../../menu/html/menu.html' 
                    : '/user/menu/html/menu.html';

                return `
                    <a href="${menuPath}?search=${encodeURIComponent(item.item_name)}" class="search-result-item">
                        <img src="${imgUrl}" alt="${item.item_name}">
                        <div class="search-result-info">
                            <span class="search-result-name">${item.item_name}</span>
                            <span class="search-result-price">${typeof formatCurrency === 'function' ? formatCurrency(item.price) : item.price + 'đ'}</span>
                        </div>
                    </a>
                `;
            }).join('');
            searchDropdown.style.display = 'flex';
        } else {
            searchDropdown.innerHTML = '<div style="padding: 15px; color: #8B7355; text-align: center;">Không tìm thấy kết quả</div>';
            searchDropdown.style.display = 'flex';
        }
    });

    // Ẩn dropdown khi click ngoài
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
            searchDropdown.style.display = 'none';
        }
    });

    const params = new URLSearchParams(window.location.search);
    const searchParam = params.get('search');
    if (searchParam && searchInput) {
        searchInput.value = searchParam;
    }
}

/**
 * Standardize image URL resolving
 */
function getImgUrl(url, placeholder = 'https://placehold.co/300x200?text=No+Image') {
    if (!url) return placeholder;
    if (url.startsWith('http')) return url;
    const prefix = 'http://localhost:5000';
    return url.startsWith('/') ? prefix + url : prefix + '/' + url;
}
