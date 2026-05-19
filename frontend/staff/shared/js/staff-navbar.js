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
    const isBlazingSun = localStorage.getItem('blazingSunTheme') === 'true';
    const avatarBg = isBlazingSun ? 'D94B2B' : '00f3ff';
    const avatarUrl = `https://ui-avatars.com/api/?background=${avatarBg}&color=fff&rounded=true&name=${encodeURIComponent(user.full_name || 'S')}`;

    const navHTML = `
    <div class="nav-container">
        <a href="${dashHref}" class="logo" style="text-decoration: none; display: flex; align-items: center; gap: 8px;">
            <svg class="logo-svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 8h1a4 4 0 1 1 0 8h-1"></path><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"></path><line x1="6" y1="2" x2="6" y2="4"></line><line x1="10" y1="2" x2="10" y2="4"></line><line x1="14" y1="2" x2="14" y2="4"></line></svg>
            <span class="logo-text">Cà Phê <span class="highlight">Thông Minh</span></span>
            <span class="staff-badge">STAFF</span>
        </a>
        <div class="nav-links" id="navLinks">
            <a href="${dashHref}" class="${isActive('staff-dashboard')}">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                Dashboard
            </a>
            <a href="${tablesHref}" class="${isActive('/tables/')}">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                Bàn
            </a>
            <a href="${ordersHref}" class="${isActive('/orders/')}">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                Đơn hàng
            </a>
            <a href="${stockHref}" class="${isActive('stock-management')}">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                Hết món
            </a>
        </div>
        <div class="user-menu">
            <div class="user-info" id="staffUserInfo">
                <img id="staffAvatarNav" class="avatar" src="${avatarUrl}" alt="Avatar">
                <span id="staffNameNav" style="font-weight: 700;">${user.full_name || 'Nhân viên'}</span>
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-left: 5px;">
                    <path d="M1 1L5 5L9 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </div>
            <div class="dropdown-menu" id="staffDropdownMenu">
                <a href="${profileHref}" style="display: flex; align-items: center; gap: 10px;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    Trang cá nhân
                </a>
                <a href="#" id="toggleThemeBtn" style="display: flex; align-items: center; gap: 10px;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
                    <span id="themeBtnText">Chủ đề: Mặc định</span>
                </a>
                <hr style="border: none; border-top: 1px solid #eee; margin: 5px 0;">
                <a href="#" id="staffLogoutBtn" style="color: #e74c3c; display: flex; align-items: center; gap: 10px;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                    Đăng xuất
                </a>
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
            toggle.addEventListener('click', () => navLinks.classList.toggle('active'));
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
