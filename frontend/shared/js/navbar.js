/**
 * SHARED NAVBAR JS - CAFE MANAGEMENT
 * Injects standard navbar into pages
 */

document.addEventListener('DOMContentLoaded', () => {
    renderNavbar();
});

function renderNavbar() {
    const placeholder = document.getElementById('navbar-placeholder');
    if (!placeholder) return;

    const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
    const isLoggedIn = !!localStorage.getItem('token');
    
    // Determine relative paths based on current location
    const isUserFolder = window.location.pathname.includes('/user/');
    const basePrefix = isUserFolder ? '../../../' : '../../'; // Adjusted for nested levels
    
    // Auto-adjust path based on depth
    let pathPrefix = '../../';
    const pathParts = window.location.pathname.split('/');
    if (pathParts.includes('html')) {
        // We are usually in something like /user/category/html/file.html
        // To get to user/index/html/index.html, we need ../../index/html/index.html
        pathPrefix = '../../';
    }

    const navbarHtml = `
    <nav class="navbar">
        <div class="nav-container">
            <a href="${pathPrefix}index/html/index.html" class="logo" style="text-decoration: none;">
                <i class="fas fa-mug-hot"></i>
                <span>Cà Phê <span class="highlight">Thông Minh</span></span>
            </a>
            <div class="nav-search">
                <i class="fas fa-search"></i>
                <input type="text" id="globalSearchInput" placeholder="Tìm kiếm món ăn, đồ uống...">
            </div>
            <div class="nav-links" id="navLinks">
                <a href="${pathPrefix}index/html/index.html"><i class="fas fa-home"></i> Trang chủ</a>
                <a href="${pathPrefix}menu/html/menu.html"><i class="fas fa-coffee"></i> Thực đơn</a>
                <a href="${pathPrefix}offers/html/offers.html"><i class="fas fa-gift"></i> Ưu đãi</a>
                <a href="${pathPrefix}tables/html/tables.html"><i class="fas fa-chair"></i> Đặt bàn</a>
                <a href="${pathPrefix}orders/html/orders.html"><i class="fas fa-shopping-cart"></i> Giỏ hàng <span id="cartCount" class="cart-badge" style="display: none;">0</span></a>
                <a href="${pathPrefix}history/html/history.html"><i class="fas fa-history"></i> Lịch sử</a>
                
                ${isLoggedIn ? `
                <div class="profile-dropdown" id="profileDropdown">
                    <button class="profile-btn" id="profileBtn">
                        <img id="avatarImg" class="avatar-small" src="${userInfo.avatar_url || 'https://ui-avatars.com/api/?background=E67E22&color=fff&rounded=true'}" alt="Avatar">
                        <span id="userNameShort">${userInfo.full_name || ''}</span>
                        <i class="fas fa-chevron-down"></i>
                    </button>
                    <div class="dropdown-menu" id="dropdownMenu">
                        <a href="${pathPrefix}profile/html/profile.html"><i class="fas fa-user-circle"></i> Thông tin cá nhân</a>
                        <a href="${pathPrefix}history/html/history.html"><i class="fas fa-history"></i> Lịch sử đơn hàng</a>
                        <a href="${pathPrefix}settings/html/settings.html"><i class="fas fa-cog"></i> Cài đặt</a>
                        <hr>
                        <a href="#" id="logoutDropdownBtn"><i class="fas fa-sign-out-alt"></i> Đăng xuất</a>
                    </div>
                </div>
                ` : `
                <a href="${pathPrefix}../auth/login.html" class="btn-login">Đăng nhập</a>
                `}
            </div>
            <div class="menu-toggle" id="menuToggle">
                <i class="fas fa-bars"></i>
            </div>
        </div>
    </nav>
    `;

    placeholder.innerHTML = navbarHtml;
    
    // Re-initialize global search and other components if needed
    if (typeof initGlobalSearch === 'function') initGlobalSearch();
    if (typeof updateNavbarCartCount === 'function') updateNavbarCartCount();
    
    // Setup logout and dropdown logic
    initNavbarLogic();
}

function initNavbarLogic() {
    const profileBtn = document.getElementById('profileBtn');
    const profileDropdown = document.getElementById('profileDropdown');
    const logoutBtn = document.getElementById('logoutDropdownBtn');
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');

    if (profileBtn && profileDropdown) {
        profileBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            profileDropdown.classList.toggle('active');
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('Logging out...');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            
            // Redirect to home page
            const isUserFolder = window.location.pathname.includes('/user/');
            if (isUserFolder) {
                // If in /user/some-page/html/file.html
                // We need to go to /user/index/html/index.html
                // Find path to 'user' folder and then to index
                const pathParts = window.location.pathname.split('/');
                const userIndex = pathParts.indexOf('user');
                if (userIndex !== -1) {
                    const depth = pathParts.length - userIndex - 2; // count levels after 'user'
                    let prefix = '';
                    for(let i=0; i<depth; i++) prefix += '../';
                    window.location.href = prefix + 'index/html/index.html';
                } else {
                    window.location.href = '/user/index/html/index.html';
                }
            } else {
                window.location.href = '/';
            }
        });
    }

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            navLinks.classList.toggle('active');
        });
    }

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (profileDropdown && !profileDropdown.contains(e.target)) {
            profileDropdown.classList.remove('active');
        }
        if (navLinks && !navLinks.contains(e.target) && !menuToggle.contains(e.target)) {
            navLinks.classList.remove('active');
        }
    });
}
