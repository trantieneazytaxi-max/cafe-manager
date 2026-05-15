/**
 * SHARED STAFF NAVBAR COMPONENT
 * Automatically detects page depth to build correct relative paths.
 *
 * Page depth:
 *  "shallow" = staff/dashboard/html/  (staff-dashboard.html, stock-management.html)
 *  "deep"    = staff/dashboard/{tables|orders|profile}/html/
 */
(function () {
    const pagePath = window.location.pathname;

    // Check if we are in a sub-module folder (tables, orders, profile)
    const isDeep = /\/dashboard\/(tables|orders|profile)\//.test(pagePath);

    // Compute paths relative to the current HTML file
    let dashHref, tablesHref, ordersHref, stockHref, profileHref, authHref;

    // Inject global.js if not present
    const hasGlobalScript = Array.from(document.scripts).some(s => s.src.includes('global.js'));
    if (!window.initGlobalUI && !hasGlobalScript) {
        const globalScript = document.createElement('script');
        globalScript.src = '/shared/js/global.js';
        document.head.appendChild(globalScript);
    }

    if (isDeep) {
        // From e.g. /staff/dashboard/tables/html/tables.html
        dashHref    = '../../html/staff-dashboard.html';
        tablesHref  = '../../tables/html/tables.html';
        ordersHref  = '../../orders/html/orders.html';
        stockHref   = '../../html/stock-management.html';
        profileHref = '../../profile/html/profile.html';
        authHref    = '../../../../auth/html/staff-login.html';
    } else {
        // From /staff/dashboard/html/
        dashHref    = 'staff-dashboard.html';
        tablesHref  = '../tables/html/tables.html';
        ordersHref  = '../orders/html/orders.html';
        stockHref   = 'stock-management.html';
        profileHref = '../profile/html/profile.html';
        authHref    = '../../auth/html/staff-login.html';
    }

    function isActive(keyword) {
        return pagePath.includes(keyword) ? 'active' : '';
    }

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const avatarUrl = `https://ui-avatars.com/api/?background=00f3ff&color=fff&rounded=true&name=${encodeURIComponent(user.full_name || 'S')}`;

    const navHTML = `
    <div class="nav-container">
        <div class="logo">
            <i class="fas fa-mug-hot"></i>
            <span>Cà Phê <span class="highlight">Thông Minh</span></span>
            <span class="staff-badge">STAFF</span>
        </div>
        <div class="nav-links" id="navLinks">
            <a href="${dashHref}" class="${isActive('staff-dashboard')}">
                <i class="fas fa-chart-line"></i> Dashboard
            </a>
            <a href="${tablesHref}" class="${isActive('/tables/')}">
                <i class="fas fa-chair"></i> Quản lý bàn
            </a>
            <a href="${ordersHref}" class="${isActive('/orders/')}">
                <i class="fas fa-receipt"></i> Đơn hàng
            </a>
            <a href="${stockHref}" class="${isActive('stock-management')}">
                <i class="fas fa-box"></i> Tạm dừng món
            </a>
        </div>
        <div class="user-menu">
            <div class="user-info" id="staffUserInfo">
                <img id="staffAvatarNav" class="avatar" src="${avatarUrl}" alt="Avatar">
                <span id="staffNameNav">${user.full_name || 'Nhân viên'}</span>
                <i class="fas fa-chevron-down"></i>
            </div>
            <div class="dropdown-menu" id="staffDropdownMenu">
                <a href="${profileHref}"><i class="fas fa-user-circle"></i> Trang cá nhân</a>
                <a href="#" id="toggleThemeBtn">
                    <i class="fas fa-magic"></i> 
                    <span id="themeBtnText">Chủ đề: Mặc định</span>
                </a>
                <hr>
                <a href="#" id="staffLogoutBtn"><i class="fas fa-sign-out-alt"></i> Đăng xuất</a>
            </div>
        </div>
        <div class="menu-toggle" id="staffMenuToggle">
            <i class="fas fa-bars"></i>
        </div>
    </div>`;

    // Inject into <nav class="navbar">
    const navbar = document.querySelector('nav.navbar');
    if (navbar) {
        navbar.innerHTML = navHTML;
    }

    // Wire up events after DOM is ready
    function initEvents() {
        const userInfo  = document.getElementById('staffUserInfo');
        const dropdown  = document.getElementById('staffDropdownMenu');
        const toggle    = document.getElementById('staffMenuToggle');
        const navLinks  = document.getElementById('navLinks');
        const logoutBtn = document.getElementById('staffLogoutBtn');

        if (userInfo && dropdown) {
            userInfo.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.classList.toggle('show');
            });
        }

        if (toggle && navLinks) {
            toggle.addEventListener('click', () => navLinks.classList.toggle('show'));
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = authHref;
            });
        }

        // Theme Toggle Logic
        const themeBtn = document.getElementById('toggleThemeBtn');
        const themeBtnText = document.getElementById('themeBtnText');
        
        function updateThemeUI() {
            const isBlazingSun = localStorage.getItem('blazingSunTheme') === 'true';
            if (themeBtnText) {
                themeBtnText.textContent = isBlazingSun ? 'Chủ đề: Blazing Sun' : 'Chủ đề: Mặc định';
            }
        }
        
        updateThemeUI();
 
        if (themeBtn) {
            themeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const isBlazingSun = localStorage.getItem('blazingSunTheme') === 'true';
                const nextState = !isBlazingSun;
                
                localStorage.setItem('blazingSunTheme', nextState);
                
                if (nextState) {
                    document.documentElement.classList.add('blazing-sun-theme');
                    document.body.classList.add('blazing-sun-theme');
                    
                    // Add CSS if not present
                    if (!document.getElementById('blazing-sun-css')) {
                        const link = document.createElement('link');
                        link.id = 'blazing-sun-css';
                        link.rel = 'stylesheet';
                        link.href = '/shared/css/blazing-sun-theme.css';
                        document.head.appendChild(link);
                    }
                    
                    // Init particles
                    if (typeof initBlazingSunParticles === 'function') {
                        initBlazingSunParticles();
                    }
                } else {
                    document.documentElement.classList.remove('blazing-sun-theme');
                    document.body.classList.remove('blazing-sun-theme');
                    
                    // Remove particles
                    const particles = document.getElementById('blazing-sun-particles');
                    if (particles) particles.remove();
                    
                    // Remove quote
                    const quote = document.querySelector('.bs-quote');
                    if (quote) quote.remove();
                    
                    // Remove CSS
                    const css = document.getElementById('blazing-sun-css');
                    if (css) css.remove();
                }
                
                updateThemeUI();
            });
        }

        window.addEventListener('click', () => {
            dropdown && dropdown.classList.remove('show');
            navLinks  && navLinks.classList.remove('show');
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initEvents);
    } else {
        initEvents();
    }
})();
