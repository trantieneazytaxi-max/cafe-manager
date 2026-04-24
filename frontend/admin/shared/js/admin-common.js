/**
 * ADMIN COMMON LOGIC
 * Sidebar, Authentication, and Shared Utilities
 */

document.addEventListener('DOMContentLoaded', () => {
    checkAdminAuth();
    initSidebar();
    loadAdminInfo();
});

function checkAdminAuth() {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    if (!token || role !== 'admin') {
        window.location.href = '/admin/auth/html/admin-login.html';
        return;
    }
}

function initSidebar() {
    // Thêm active class dựa trên URL hiện tại
    const currentPath = window.location.pathname;
    const menuItems = document.querySelectorAll('.menu-item');
    
    menuItems.forEach(item => {
        if (currentPath.includes(item.getAttribute('href').replace('..', ''))) {
            item.classList.add('active');
        }
    });

    // Logout logic
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = '/admin/auth/html/admin-login.html';
            }
        });
    }
}

function loadAdminInfo() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const adminNameEl = document.getElementById('adminName');
    if (adminNameEl) adminNameEl.textContent = user.full_name || 'Quản trị viên';
}

// Global utilities
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function showToast(message, type = 'success') {
    // Reuse existing toast logic if available or create a simple one
    console.log(`Toast (${type}): ${message}`);
    alert(message); // Fallback for now
}
