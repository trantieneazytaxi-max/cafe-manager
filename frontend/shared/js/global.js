// Immediate theme check to prevent FOUC
(function() {
    // FontAwesome Check & Inject (Fix for missing icons)
    const faId = 'fa-css';
    if (!document.getElementById(faId)) {
        const faLink = document.createElement('link');
        faLink.id = faId;
        faLink.rel = 'stylesheet';
        faLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css';
        document.head.appendChild(faLink);
    }

    // Reverie Theme - Only for Admin
    if (localStorage.getItem('reverieTheme') === 'true' && window.location.pathname.includes('/admin/')) {
        document.documentElement.classList.add('reverie-theme');
        document.body?.classList.add('reverie-theme');
        
        const cssId = 'reverie-css';
        if (!document.getElementById(cssId)) {
            const link = document.createElement('link');
            link.id = cssId;
            link.rel = 'stylesheet';
            link.href = '/admin/dashboard/css/reverie-theme.css';
            document.head.appendChild(link);
        }

        // Water Effects for Reverie
        initReverieWaterEffects();
    }

    // Blazing Sun Theme - Only for Staff
    if (localStorage.getItem('blazingSunTheme') === 'true' && window.location.pathname.includes('/staff/')) {
        document.documentElement.classList.add('blazing-sun-theme');
        document.body?.classList.add('blazing-sun-theme');
        
        const cssId = 'blazing-sun-css';
        if (!document.getElementById(cssId)) {
            const link = document.createElement('link');
            link.id = cssId;
            link.rel = 'stylesheet';
            link.href = '/shared/css/blazing-sun-theme.css';
            document.head.appendChild(link);
        }
    }
})();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGlobalUI);
} else {
    initGlobalUI();
}

function initGlobalUI() {
    // Ensure body has class if HTML has it
    if (document.documentElement.classList.contains('reverie-theme') && window.location.pathname.includes('/admin/')) {
        document.body.classList.add('reverie-theme');
        initReverieTheme();
    }
    
    if (document.documentElement.classList.contains('blazing-sun-theme') && window.location.pathname.includes('/staff/')) {
        document.body.classList.add('blazing-sun-theme');
        initBlazingSunTheme();
    }

    initMobileMenu();
    initDropdown();
    updateUserInfo();
    initLogout();
    updateNavbarCartCount();
    initGlobalSearch();
    initFloatingButtons();
    updateFooterInfo();
    injectGlobalComponents(); // Inject Loading Screen & Modals
}

/**
 * Inject Loading Screen and Global Modals
 */
function injectGlobalComponents() {
    if (!document.getElementById('global-loading-screen')) {
        const loading = document.createElement('div');
        loading.id = 'global-loading-screen';
        loading.className = 'global-overlay';
        loading.innerHTML = `
            <div class="loader-content">
                <div class="cyber-spinner"></div>
                <p class="loading-text">Đang xử lý...</p>
            </div>
        `;
        document.body.appendChild(loading);
    }

    if (!document.getElementById('logout-confirm-modal')) {
        const modal = document.createElement('div');
        modal.id = 'logout-confirm-modal';
        modal.className = 'global-overlay modal-hidden';
        modal.innerHTML = `
            <div class="global-modal-content">
                <h3>Xác nhận đăng xuất</h3>
                <p>Bạn có chắc chắn muốn rời khỏi hệ thống không?</p>
                <div class="modal-actions">
                    <button id="cancelLogout" class="btn-secondary">HỦY</button>
                    <button id="confirmLogout" class="btn-primary">ĐĂNG XUẤT</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        document.getElementById('cancelLogout').onclick = () => {
            modal.classList.add('modal-hidden');
        };
    }

    // Add Styles
    if (!document.getElementById('global-components-style')) {
        const style = document.createElement('style');
        style.id = 'global-components-style';
        style.textContent = `
            .global-overlay {
                position: fixed;
                inset: 0;
                background: rgba(5, 5, 10, 0.9);
                backdrop-filter: blur(10px);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
                opacity: 1;
                pointer-events: all;
            }
            .global-overlay.modal-hidden {
                opacity: 0;
                pointer-events: none;
            }
            .global-modal-content {
                background: rgba(13, 13, 26, 0.95);
                border: 1px solid rgba(0, 243, 255, 0.3);
                border-radius: 24px;
                padding: 2.5rem;
                width: 90%;
                max-width: 400px;
                text-align: center;
                box-shadow: 0 0 50px rgba(0, 243, 255, 0.1);
            }
            .global-modal-content h3 {
                color: #00f3ff;
                font-family: 'Orbitron', sans-serif;
                margin-bottom: 1rem;
                letter-spacing: 1px;
            }
            .global-modal-content p {
                color: #8892b0;
                margin-bottom: 2rem;
            }
            .modal-actions {
                display: flex;
                gap: 15px;
                justify-content: center;
            }
            .loader-content { text-align: center; }
            .cyber-spinner {
                width: 60px;
                height: 60px;
                border: 4px solid rgba(0, 243, 255, 0.1);
                border-top-color: #00f3ff;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 1.5rem;
                box-shadow: 0 0 15px rgba(0, 243, 255, 0.3);
            }
            .loading-text {
                color: #00f3ff;
                font-family: 'Orbitron', sans-serif;
                letter-spacing: 2px;
                text-transform: uppercase;
                animation: pulse 1.5s infinite;
            }
            @keyframes spin { to { transform: rotate(360deg); } }
            @keyframes pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }

            /* Theme overrides for Loading/Modal */
            body.reverie-theme .global-overlay { background: rgba(245, 243, 255, 0.9); }
            body.reverie-theme .global-modal-content {
                background: #fff;
                border-color: #A855F7;
                box-shadow: 0 10px 40px rgba(126, 34, 206, 0.1);
            }
            body.reverie-theme .global-modal-content h3 { color: #4C1D95; font-family: 'Playfair Display', serif; }
            body.reverie-theme .cyber-spinner { 
                border-color: rgba(126, 34, 206, 0.1);
                border-top-color: #7E22CE;
                box-shadow: 0 0 15px rgba(126, 34, 206, 0.2);
            }
            body.reverie-theme .loading-text { color: #7E22CE; font-family: 'Playfair Display', serif; }
        `;
        document.head.appendChild(style);
    }
    
    // Hide loading by default
    hideLoading();
}

function showLoading(text = 'Đang xử lý...') {
    const loading = document.getElementById('global-loading-screen');
    if (loading) {
        loading.querySelector('.loading-text').textContent = text;
        loading.classList.remove('modal-hidden');
    }
}

function hideLoading() {
    const loading = document.getElementById('global-loading-screen');
    if (loading) loading.classList.add('modal-hidden');
}

/**
 * Reverie Theme Initialization
 */
async function initReverieTheme() {
    if (localStorage.getItem('reverieTheme') === 'true' && 
        window.location.pathname.includes('/admin/')) {
        
        // Apply classes immediately
        document.documentElement.classList.add('reverie-theme');
        document.body.classList.add('reverie-theme');

        // Inject CSS if missing
        const cssId = 'reverie-css';
        if (!document.getElementById(cssId)) {
            const link = document.createElement('link');
            link.id = cssId;
            link.rel = 'stylesheet';
            link.href = '/admin/dashboard/css/reverie-theme.css';
            document.head.appendChild(link);
        }

        if (!document.getElementById('reverie-overlay')) {
            const div = document.createElement('div');
            div.id = 'reverie-overlay';
            div.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:1500;';
            document.body.appendChild(div);
            
            // Create Top Banner
            const bannerTop = document.createElement('div');
            bannerTop.id = 'reverie-banner-top';
            bannerTop.className = 'reverie-banner';
            bannerTop.innerHTML = `<div class="banner-inner"><span class="banner-text"><i>HELLO WORLD</i></span></div>`;
            
            // Create Bottom Banner
            const bannerBottom = document.createElement('div');
            bannerBottom.id = 'reverie-banner-bottom';
            bannerBottom.className = 'reverie-banner';
            bannerBottom.innerHTML = `<div class="banner-inner"><span class="banner-text"><i>SEE YOU TOMORROW</i></span></div>`;
            
            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                mainContent.insertBefore(bannerTop, mainContent.firstChild);
                mainContent.appendChild(bannerBottom);
            } else {
                document.body.appendChild(bannerTop);
                document.body.appendChild(bannerBottom);
            }
            
            // Fetch Danmaku Settings
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('http://localhost:5000/api/admin/store-settings', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const settings = await res.json();
                
                // Save to localStorage to persist across navigation/offline
                localStorage.setItem('danmakuEnabled', settings.danmakuEnabled ? 'true' : 'false');
                
                if (settings.danmakuEnabled) {
                    const customMessages = settings.danmakuMessages 
                        ? settings.danmakuMessages.split('\n').filter(m => m.trim())
                        : null;
                    initReverieDanmaku(customMessages);
                }
            } catch (e) {
                console.warn('Could not load Danmaku settings, checking localStorage');
                // Fallback to localStorage if fetch fails
                if (localStorage.getItem('danmakuEnabled') !== 'false') {
                    initReverieDanmaku();
                }
            }
        }
    }
}

function initReverieWaterEffects() {
    if (localStorage.getItem('reverieTheme') !== 'true') return;
    
    const styleId = 'reverie-water-style';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            .rv-ripple {
                position: fixed;
                border-radius: 50%;
                background: rgba(168, 85, 247, 0.3);
                pointer-events: none;
                z-index: 9999;
                transform: scale(0);
                animation: rvRippleAnim 1s ease-out forwards;
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
            @keyframes rvRippleAnim {
                to { transform: scale(4); opacity: 0; }
            }
            .rv-drop {
                position: fixed;
                width: 8px;
                height: 8px;
                background: radial-gradient(circle, rgba(236, 72, 153, 0.6) 0%, transparent 80%);
                border-radius: 50%;
                pointer-events: none;
                z-index: 9998;
                opacity: 0.8;
            }
        `;
        document.head.appendChild(style);
    }

    // Click effect
    window.addEventListener('mousedown', (e) => {
        if (localStorage.getItem('reverieTheme') !== 'true') return;
        const ripple = document.createElement('div');
        ripple.className = 'rv-ripple';
        const size = 50;
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${e.clientX - size/2}px`;
        ripple.style.top = `${e.clientY - size/2}px`;
        document.body.appendChild(ripple);
        setTimeout(() => ripple.remove(), 1000);
    });

    // Move effect (Trail)
    let lastTime = 0;
    window.addEventListener('mousemove', (e) => {
        const now = Date.now();
        if (now - lastTime < 50) return; // Throttling
        lastTime = now;
        
        if (localStorage.getItem('reverieTheme') !== 'true') return;
        
        const drop = document.createElement('div');
        drop.className = 'rv-drop';
        drop.style.left = `${e.clientX - 4}px`;
        drop.style.top = `${e.clientY - 4}px`;
        document.body.appendChild(drop);
        
        const anim = drop.animate([
            { transform: 'translateY(0) scale(1)', opacity: 0.8 },
            { transform: `translateY(${Math.random() * 20 + 10}px) scale(0)`, opacity: 0 }
        ], { duration: 800, easing: 'ease-out' });
        
        anim.onfinish = () => drop.remove();
    });

    // Falling Flowers (Petals)
    initReveriePetals();
}

function initReveriePetals() {
    const container = document.getElementById('reverie-overlay');
    if (!container) return;

    const petals = ['🌸', '💮', '✿', '❀', '✾'];
    
    setInterval(() => {
        if (localStorage.getItem('reverieTheme') !== 'true') return;
        
        const petal = document.createElement('span');
        petal.className = 'reverie-petal';
        petal.textContent = petals[Math.floor(Math.random() * petals.length)];
        petal.style.cssText = `
            position: fixed;
            top: -50px;
            left: ${Math.random() * 100}vw;
            font-size: ${Math.random() * 10 + 15}px;
            color: #FFB7C5;
            pointer-events: none;
            z-index: 1400;
            opacity: 0.6;
            user-select: none;
        `;
        
        container.appendChild(petal);
        
        const duration = Math.random() * 5000 + 8000;
        const drift = (Math.random() - 0.5) * 400;
        const rotation = Math.random() * 360;
        
        const anim = petal.animate([
            { transform: 'translateY(0) translateX(0) rotate(0deg)', opacity: 0 },
            { transform: `translateY(${window.innerHeight + 100}px) translateX(${drift}px) rotate(${rotation + 720}deg)`, opacity: 0.6 }
        ], {
            duration: duration,
            easing: 'linear'
        });
        
        anim.onfinish = () => petal.remove();
    }, 1500);
}

/**
 * Blazing Sun Theme Initialization
 */
function initBlazingSunTheme() {
    if (localStorage.getItem('blazingSunTheme') === 'true' && 
        window.location.pathname.includes('/staff/')) {
        
        document.documentElement.classList.add('blazing-sun-theme');
        document.body.classList.add('blazing-sun-theme');

        const cssId = 'blazing-sun-css';
        if (!document.getElementById(cssId)) {
            const link = document.createElement('link');
            link.id = cssId;
            link.rel = 'stylesheet';
            link.href = '/shared/css/blazing-sun-theme.css';
            document.head.appendChild(link);
        }

        initBlazingSunParticles();
    }
}

function initReverieDanmaku(customMessages = null) {
    const defaultMessages = [
        "Đã lâu không gặp. Cách phối đồ hôm nay của bạn rất tinh tế, tôi rất thích",
        "Bé Xám, *chúng tôi* đã mong đợi từ hôm qua rồi!",
        "Những ngày được gặp lại bạn đều giống như ngày xuân ấm áp",
        "Trông bạn thế này, chắc cuộc sống ổn nhỉ, có đang kiên trì rèn luyện không?",
        "Ây da Xám à, đến là được rồi, còn mang nhiều đồ như vậy nữa!",
        "Xám Cưng, tôi nhớ bạn chết đi được! Trời có đẹp không, bạn có khỏe không?",
        "Gần đây du ngoạn khắp vũ trụ, bạn có chiêm nghiệm gì mới không? Tôi rất sẵn lòng đàm đạo cùng bạn",
        "Cộng sự! Chỉ cần nghe thấy giọng nói của bạn là lại nhớ đến khoảng thời gian kề vai sát cánh trên cánh đồng lúa mì ngày trước",
        "Hiếm khi cố nhân trùng phùng, nào, cạn ly vì những vì sao rực rỡ đêm nay!",
        "Cá Xám, cạn ly cho cuộc hội ngộ sau bao ngày xa cách của chúng ta",
        "Bạn đồng hành à, mỗi lần gặp bạn đều tuyệt vời như thuở ban đầu"
    ];
    
    const messages = customMessages || defaultMessages;
    const container = document.getElementById('reverie-overlay');
    if (!container) return;

    setInterval(() => {
        if (localStorage.getItem('reverieTheme') !== 'true') return;
        if (localStorage.getItem('danmakuEnabled') === 'false') return;
        
        const span = document.createElement('span');
        span.className = 'reverie-danmaku';
        span.textContent = messages[Math.floor(Math.random() * messages.length)];
        
        const top = Math.random() * 80 + 10;
        span.style.top = `${top}%`;
        span.style.right = '-600px';
        
        container.appendChild(span);
        
        const duration = Math.random() * 10000 + 15000;
        const anim = span.animate([
            { transform: 'translateX(0)' },
            { transform: `translateX(-${window.innerWidth + 1200}px)` }
        ], {
            duration: duration,
            easing: 'linear'
        });
        
        anim.onfinish = () => span.remove();
    }, 4000);
}

/**
 * Blazing Sun Theme Particles Initialization (Embers)
 */
function initBlazingSunParticles() {
    if (localStorage.getItem('blazingSunTheme') === 'true' && 
        window.location.pathname.includes('/staff/') && 
        !document.getElementById('blazing-sun-particles')) {
        const div = document.createElement('div');
        div.id = 'blazing-sun-particles';
        document.body.appendChild(div);
        createBlazingSunEmbers();
        addBlazingSunQuote();
    }
}

function createBlazingSunEmbers() {
    const container = document.getElementById('blazing-sun-particles');
    if (!container || container.children.length > 0) return;
    
    for (let i = 0; i < 40; i++) {
        const ember = document.createElement('div');
        ember.className = 'bs-ember';
        ember.style.left = Math.random() * 100 + 'vw';
        ember.style.bottom = '-10px';
        
        const duration = Math.random() * 5 + 5;
        const delay = Math.random() * 10;
        const drift = (Math.random() - 0.5) * 200;
        
        ember.style.setProperty('--drift', `${drift}px`);
        ember.style.animation = `emberRise ${duration}s linear ${delay}s infinite`;
        
        container.appendChild(ember);
    }
}

function addBlazingSunQuote() {
    // Only add quote if it doesn't exist and we are on a dashboard-like page
    if (document.querySelector('.bs-quote')) return;
    
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        const quoteDiv = document.createElement('div');
        quoteDiv.className = 'bs-quote bs-glow';
        quoteDiv.innerHTML = '“无罪 无畏，为何不配？为何要跪？”<br><span style="font-size: 0.6em; opacity: 0.7;">咬断了命运枷锁，不疯狂不成活</span>';
        
        // Insert after the top-bar or at the beginning of main-content
        const topBar = mainContent.querySelector('.top-bar');
        if (topBar) {
            topBar.after(quoteDiv);
        } else {
            mainContent.prepend(quoteDiv);
        }
    }
}


// 1. Mobile Menu
function initMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');
    
    if (menuToggle && navLinks && !menuToggle.dataset.handled) {
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent bubbling to parent delegation listeners
            navLinks.classList.toggle('active');
        });
        menuToggle.dataset.handled = "true";
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
        // Ưu tiên avatar_url từ user object, sau đó tới localStorage cũ, cuối cùng là UI-Avatars
        avatarImg.src = user.avatar_url || savedAvatar || `https://ui-avatars.com/api/?background=E67E22&color=fff&rounded=true&size=32&name=${encodeURIComponent(displayName)}`;
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
                <a href="../../../auth/html/user-login.html"><i class="fas fa-sign-in-alt"></i> Đăng nhập</a>
            `;
        }
    }
}

// 4. Logout Functionality
function initLogout() {
    const logoutBtn = document.getElementById('logoutDropdownBtn');
    if (logoutBtn) {
        // Remove old listener
        const newBtn = logoutBtn.cloneNode(true);
        logoutBtn.parentNode.replaceChild(newBtn, logoutBtn);
        
        newBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const modal = document.getElementById('logout-confirm-modal');
            if (modal) {
                modal.classList.remove('modal-hidden');
                document.getElementById('confirmLogout').onclick = () => {
                    modal.classList.add('modal-hidden');
                    showLoading('Đang đăng xuất...');
                    setTimeout(() => {
                        localStorage.clear();
                        sessionStorage.clear();
                        window.location.href = '../../../auth/html/user-login.html';
                    }, 1000);
                };
            }
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
if (typeof window.globalSearchCache === 'undefined') {
    window.globalSearchCache = [];
    window.isSearchCacheLoaded = false;
}

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
        if (!window.isSearchCacheLoaded) {
            try {
                // If we're already on menu.html and have allItems, use it
                if (typeof allItems !== 'undefined' && Array.isArray(allItems) && allItems.length > 0) {
                    window.globalSearchCache = allItems;
                    window.isSearchCacheLoaded = true;
                } else {
                    const response = await fetch('http://localhost:5000/api/menu/items');
                    window.globalSearchCache = await response.json();
                    window.isSearchCacheLoaded = true;
                }
            } catch (err) {
                console.error('Error fetching search items:', err);
            }
        }

        const results = window.globalSearchCache.filter(item => 
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
/**
 * 7. Floating Action Buttons (Back & Scroll to Top)
 */
function initFloatingButtons() {
    // Create FAB container if not exists
    let fabContainer = document.querySelector('.fab-container');
    if (!fabContainer) {
        fabContainer = document.createElement('div');
        fabContainer.className = 'fab-container';
        
        const backBtn = document.createElement('button');
        backBtn.className = 'fab-btn btn-back show'; // Always show back btn
        backBtn.innerHTML = '<i class="fas fa-arrow-left"></i>';
        backBtn.setAttribute('data-tooltip', 'Quay lại');
        backBtn.onclick = () => window.history.back();
        
        const scrollTopBtn = document.createElement('button');
        scrollTopBtn.className = 'fab-btn btn-scroll-top';
        scrollTopBtn.id = 'scrollTopBtn';
        scrollTopBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
        scrollTopBtn.setAttribute('data-tooltip', 'Lên đầu trang');
        scrollTopBtn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
        
        fabContainer.appendChild(backBtn);
        fabContainer.appendChild(scrollTopBtn);
        document.body.appendChild(fabContainer);
    }
    
    // Scroll detection for "Back to Top" button
    window.addEventListener('scroll', () => {
        const scrollTopBtn = document.getElementById('scrollTopBtn');
        if (scrollTopBtn) {
            if (window.scrollY > 300) {
                scrollTopBtn.classList.add('show');
            } else {
                scrollTopBtn.classList.remove('show');
            }
        }
    });
}

/**
 * 8. Format Currency (VND)
 * Chỉ định nghĩa nếu chưa có (tránh ghi đè api.js)
 */
if (typeof formatCurrency !== 'function') {
    function formatCurrency(amount) {
        if (amount === undefined || amount === null) return '0₫';
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    }
    window.formatCurrency = formatCurrency;
}

/**
 * 9. Update Footer Info Dynamically
 */
async function updateFooterInfo() {
    try {
        // Fetch from public store API
        const response = await fetch('http://localhost:5000/api/store');
        if (!response.ok) return;
        const data = await response.json();

        // Update Store Name in Footer Logo if exists
        const footerLogoText = document.querySelector('.footer-logo span');
        if (footerLogoText && data.storeName) {
            const highlight = footerLogoText.querySelector('.highlight');
            if (highlight) {
                // Keep the "highlight" part if it's there
                // This is specific to the current design
            } else {
                footerLogoText.textContent = data.storeName;
            }
        }

        // Update Address
        const addrEl = document.querySelector('.footer-col li i.fa-map-marker-alt')?.parentElement || document.getElementById('footer-address');
        if (addrEl && data.address) {
            addrEl.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${data.address}`;
        }

        // Update Phone
        const phoneEl = document.querySelector('.footer-col li i.fa-phone')?.parentElement || document.getElementById('footer-phone');
        if (phoneEl && data.storePhone) {
            phoneEl.innerHTML = `<i class="fas fa-phone"></i> ${data.storePhone}`;
        }

        // Update Email
        const emailEl = document.querySelector('.footer-col li i.fa-envelope')?.parentElement || document.getElementById('footer-email');
        if (emailEl && data.storeEmail) {
            emailEl.innerHTML = `<i class="fas fa-envelope"></i> ${data.storeEmail}`;
        }

        // Update Opening Hours
        // Looking for the column that says "Giờ mở cửa"
        const hoursCol = Array.from(document.querySelectorAll('.footer-col h4')).find(h => h.textContent.includes('Giờ mở cửa'))?.parentElement;
        if (hoursCol && data.storeOpeningHours) {
            const hoursList = hoursCol.querySelector('ul');
            if (hoursList) {
                const hours = data.storeOpeningHours.split('\n').filter(line => line.trim());
                if (hours.length > 0) {
                    hoursList.innerHTML = hours.map(h => `<li><i class="fas fa-clock"></i> ${h}</li>`).join('');
                }
            }
        }
    } catch (err) {
        console.warn('Could not update footer info:', err);
    }
}
