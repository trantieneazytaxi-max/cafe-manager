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
    console.log('Navbar Logic Initializing...');
    
    // Use event delegation on the document or the navbar placeholder
    const placeholder = document.getElementById('navbar-placeholder');
    if (!placeholder) {
        console.error('navbar-placeholder not found during initNavbarLogic');
        return;
    }

    // Single click listener for all navbar actions
    placeholder.addEventListener('click', (e) => {
        const target = e.target;
        
        // 1. Profile Dropdown Toggle
        const profileBtn = target.closest('#profileBtn');
        if (profileBtn) {
            console.log('Profile button clicked');
            e.preventDefault();
            e.stopPropagation();
            const dropdown = document.getElementById('profileDropdown');
            if (dropdown) dropdown.classList.toggle('active');
            return;
        }

        // 2. Logout Button
        const logoutBtn = target.closest('#logoutDropdownBtn');
        if (logoutBtn) {
            console.log('Logout button clicked');
            e.preventDefault();
            e.stopPropagation();
            handleLogout();
            return;
        }

        // 3. Mobile Menu Toggle
        const menuToggle = target.closest('#menuToggle');
        if (menuToggle) {
            console.log('Menu toggle clicked');
            e.stopPropagation();
            const navLinks = document.getElementById('navLinks');
            if (navLinks) navLinks.classList.toggle('active');
            return;
        }
    });

    // Close dropdowns when clicking anywhere else on the document
    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('profileDropdown');
        if (dropdown && !dropdown.contains(e.target)) {
            dropdown.classList.remove('active');
        }
        
        const navLinks = document.getElementById('navLinks');
        const menuToggle = document.getElementById('menuToggle');
        if (navLinks && !navLinks.contains(e.target) && (!menuToggle || !menuToggle.contains(e.target))) {
            navLinks.classList.remove('active');
        }
    });

    // Handle scroll to shrink navbar
    window.addEventListener('scroll', () => {
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }
    });
}

function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    const isUserFolder = window.location.pathname.includes('/user/');
    if (isUserFolder) {
        const pathParts = window.location.pathname.split('/');
        const userIndex = pathParts.indexOf('user');
        if (userIndex !== -1) {
            const depth = pathParts.length - userIndex - 2;
            let prefix = '';
            for(let i=0; i<depth; i++) prefix += '../';
            window.location.href = prefix + 'index/html/index.html';
        } else {
            window.location.href = '/user/index/html/index.html';
        }
    } else {
        window.location.href = '/';
    }
}
