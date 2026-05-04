/**
 * SHARED SIDEBAR COMPONENT
 * Handles injection, active states, and toggle logic
 */

document.addEventListener('DOMContentLoaded', () => {
    const placeholder = document.getElementById('sidebar-placeholder');
    if (!placeholder) return;

    // Get current user info
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const adminName = user.full_name || 'Admin';
    const adminAvatar = `https://ui-avatars.com/api/?background=ff0055&color=fff&rounded=true&name=${encodeURIComponent(adminName)}`;

    // Get base path based on current location
    // We need to know how many levels deep we are to point to the right files
    const path = window.location.pathname;
    let base = '../../'; // Default for sub-modules like /menu/html/
    if (path.includes('/dashboard/html/')) base = '../';
    
    // For local testing on some systems, paths might be different
    // This is a more robust way to handle relative paths for this specific project structure
    const getLink = (rel) => {
        const levels = path.split('/').filter(p => p).length;
        // Adjust based on typical depth: /frontend/admin/module/html/file.html
        // If we are in /dashboard/html/, depth is 4. If in /menu/html/, depth is 4.
        // Wait, project structure: frontend/admin/[module]/html/[file].html
        // So they are mostly at the same depth.
        return rel;
    };

    const sidebarHtml = `
        <aside class="sidebar" id="mainSidebar">
            <div class="sidebar-header">
                <div class="logo">
                    <i class="fas fa-mug-hot"></i>
                    <span class="logo-text">Cà Phê <span class="highlight">Thông Minh</span></span>
                </div>
                <button class="sidebar-toggle-inner" id="sidebarToggleInner">
                    <i class="fas fa-angle-left"></i>
                </button>
            </div>
            <nav class="sidebar-nav">
                <a href="../../dashboard/html/admin-dashboard.html" class="nav-item" data-page="dashboard">
                    <i class="fas fa-chart-line"></i>
                    <span class="nav-text">Dashboard</span>
                </a>
                <a href="../../staff-management/html/staff-management.html" class="nav-item" data-page="staff">
                    <i class="fas fa-users"></i>
                    <span class="nav-text">Quản lý nhân viên</span>
                </a>
                <a href="../../menu/html/menu-management.html" class="nav-item" data-page="menu">
                    <i class="fas fa-utensils"></i>
                    <span class="nav-text">Quản lý thực đơn</span>
                </a>
                <a href="../../tables/html/tables-management.html" class="nav-item" data-page="tables">
                    <i class="fas fa-chair"></i>
                    <span class="nav-text">Quản lý bàn</span>
                </a>
                <a href="../../reports/html/reports.html" class="nav-item" data-page="reports">
                    <i class="fas fa-chart-bar"></i>
                    <span class="nav-text">Báo cáo</span>
                </a>
                <a href="../../attendance/html/index.html" class="nav-item" data-page="attendance">
                    <i class="fas fa-calendar-check"></i>
                    <span class="nav-text">Chấm công</span>
                </a>
                <a href="../../password-requests/html/password-requests.html" class="nav-item" data-page="passwords">
                    <i class="fas fa-key"></i>
                    <span class="nav-text">Yêu cầu đặt lại mật khẩu</span>
                </a>
                <a href="../../settings/html/settings.html" class="nav-item" data-page="settings">
                    <i class="fas fa-cog"></i>
                    <span class="nav-text">Cài đặt</span>
                </a>
            </nav>
            <div class="sidebar-footer">
                <div class="user-info">
                    <img class="avatar" src="${adminAvatar}" alt="Avatar">
                    <div class="user-details">
                        <p class="user-name">${adminName}</p>
                        <small>Quản trị viên</small>
                    </div>
                </div>
                <button class="logout-btn" id="sidebarLogoutBtn">
                    <i class="fas fa-sign-out-alt"></i> <span class="nav-text">Đăng xuất</span>
                </button>
            </div>
        </aside>
    `;

    placeholder.innerHTML = sidebarHtml;

    // Set Active State
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        const page = item.getAttribute('data-page');
        if (path.includes(page)) {
            item.classList.add('active');
        } else if (path.includes('admin-dashboard') && page === 'dashboard') {
            item.classList.add('active');
        }
    });

    // Toggle Logic
    const sidebar = document.getElementById('mainSidebar');
    const toggleBtn = document.getElementById('sidebarToggleInner');
    const body = document.body;

    // Load saved state
    const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    if (isCollapsed) {
        sidebar.classList.add('collapsed');
        body.classList.add('sidebar-collapsed');
    }

    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        body.classList.toggle('sidebar-collapsed');
        localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
    });

    // Logout logic
    document.getElementById('sidebarLogoutBtn').addEventListener('click', () => {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '../../auth/html/admin-login.html';
    });
});
