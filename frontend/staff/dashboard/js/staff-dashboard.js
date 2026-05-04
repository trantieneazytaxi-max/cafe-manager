/**
 * STAFF DASHBOARD - CAFE MANAGEMENT
 */

// State
let currentStaff = null;

// DOM Elements
const staffNameEl = document.getElementById('staffName');
const staffAvatar = document.getElementById('staffAvatar');
const shiftTypeEl = document.getElementById('shiftType');
const servedOrdersEl = document.getElementById('servedOrders');
const shiftRevenueEl = document.getElementById('shiftRevenue');
const totalTablesEl = document.getElementById('totalTables');
const pendingOrdersEl = document.getElementById('pendingOrders');
const completedOrdersEl = document.getElementById('completedOrders');
const todayRevenueEl = document.getElementById('todayRevenue');
const tablesGrid = document.getElementById('tablesGrid');
const recentOrdersBody = document.getElementById('recentOrdersBody');
const userMenu = document.querySelector('.user-menu');
const userInfo = document.querySelector('.user-info');

// Check authentication
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token || (user.role !== 'staff' && user.role !== 'admin')) {
        window.location.href = '../../auth/html/staff-login.html';
        return;
    }
    
    // Khởi tạo
    loadStaffInfo();
    loadDashboardData();
    loadTables();
    loadRecentOrders();
    loadAttendanceStatus();
    initEventListeners();
    initMobileMenu();
    startStatusCheck();
});


// Load staff info
function loadStaffInfo() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    currentStaff = user;
    
    if (staffNameEl) {
        staffNameEl.textContent = user.full_name || 'Nhân viên';
    }
    if (staffAvatar) {
        staffAvatar.src = user.avatar_url || `https://ui-avatars.com/api/?background=3498db&color=fff&rounded=true&name=${encodeURIComponent(user.full_name || 'Staff')}`;
    }
}

// Load dashboard data
async function loadDashboardData() {
    try {
        const token = localStorage.getItem('token');
        
        // Thống kê bàn
        const tablesResponse = await fetch('http://localhost:5000/api/tables', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const tables = await tablesResponse.json();
        
        if (totalTablesEl) totalTablesEl.textContent = tables.length;
        
        // Thống kê đơn hàng
        const ordersResponse = await fetch('http://localhost:5000/api/staff-orders/stats', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (ordersResponse.ok) {
            const stats = await ordersResponse.json();
            if (pendingOrdersEl) pendingOrdersEl.textContent = stats.pendingOrders || 0;
            if (completedOrdersEl) completedOrdersEl.textContent = stats.completedOrders || 0;
            if (todayRevenueEl) todayRevenueEl.textContent = formatCurrency(stats.todayRevenue || 0);
        }
        
        // Thông tin ca làm
        loadShiftInfo();
        
    } catch (error) {
        console.error('Lỗi tải dashboard:', error);
    }
}

// Load shift info
function loadShiftInfo() {
    const now = new Date();
    const hours = now.getHours();
    
    let shiftName = '';
    if (hours >= 6 && hours < 12) {
        shiftName = 'Sáng (06:00 - 12:00)';
    } else if (hours >= 12 && hours < 18) {
        shiftName = 'Chiều (12:00 - 18:00)';
    } else {
        shiftName = 'Tối (18:00 - 22:00)';
    }
    
    if (shiftTypeEl) shiftTypeEl.textContent = shiftName;
    
    // Mock data cho ca làm
    if (servedOrdersEl) servedOrdersEl.textContent = Math.floor(Math.random() * 20) + 5;
    if (shiftRevenueEl) shiftRevenueEl.textContent = formatCurrency(Math.floor(Math.random() * 5000000) + 1000000);
}

// Load tables status
async function loadTables() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/tables', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const tables = await response.json();
        
        renderTables(tables.slice(0, 8)); // Chỉ hiển thị 8 bàn đầu
    } catch (error) {
        console.error('Lỗi tải bàn:', error);
        if (tablesGrid) {
            tablesGrid.innerHTML = '<div class="loading">Không thể tải dữ liệu</div>';
        }
    }
}

// Render tables
function renderTables(tables) {
    if (!tablesGrid) return;
    
    if (tables.length === 0) {
        tablesGrid.innerHTML = '<div class="loading">Không có bàn nào</div>';
        return;
    }
    
    tablesGrid.innerHTML = tables.map(table => `
        <div class="table-card ${table.status}" data-table-id="${table.table_id}">
            <div class="table-number">Bàn ${table.table_number}</div>
            <div class="table-status status-${table.status}">
                ${getStatusText(table.status)}
            </div>
        </div>
    `).join('');
}

// Get status text
function getStatusText(status) {
    switch(status) {
        case 'available': return 'Trống';
        case 'occupied': return 'Đang dùng';
        case 'reserved': return 'Đã đặt';
        default: return status;
    }
}

// Load recent orders
async function loadRecentOrders() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/staff-orders/recent', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const orders = await response.json();
            renderRecentOrders(orders);
        } else {
            throw new Error('Failed to fetch recent orders');
        }
    } catch (error) {
        console.error('Lỗi tải đơn hàng:', error);
        if (recentOrdersBody) {
            recentOrdersBody.innerHTML = '<tr><td colspan="6" class="loading">Không thể tải dữ liệu</td></tr>';
        }
    }
}

// Render recent orders
function renderRecentOrders(orders) {
    if (!recentOrdersBody) return;
    
    if (!orders || orders.length === 0) {
        recentOrdersBody.innerHTML = '<tr><td colspan="6" class="loading">Chưa có đơn hàng nào</td></tr>';
        return;
    }
    
    recentOrdersBody.innerHTML = orders.map(order => `
        <tr>
            <td>#${order.order_id}</td>
            <td>${order.table_number ? 'Bàn ' + order.table_number : 'Mang đi/Giao hàng'}</td>
            <td>${formatCurrency(order.total_amount)}</td>
            <td>${new Date(order.created_at).toLocaleTimeString('vi-VN')}</td>
            <td><span class="status-badge status-${order.status}">${getOrderStatusText(order.status)}</span></td>
            <td>
                <button class="btn-view" onclick="viewOrder(${order.order_id})">Xem</button>
                ${order.status === 'pending' ? `<button class="btn-confirm" onclick="confirmOrder(${order.order_id})">Xác nhận</button>` : ''}
            </td>
        </tr>
    `).join('');
}

function getOrderStatusText(status) {
    switch(status) {
        case 'pending': return 'Chờ xử lý';
        case 'paid': return 'Đã thanh toán';
        case 'cancelled': return 'Đã hủy';
        default: return status;
    }
}

// View order detail
window.viewOrder = function(orderId) {
    window.location.href = `../orders/html/orders.html?orderId=${orderId}`;
};

// Confirm order
window.confirmOrder = async function(orderId) {
    if (!confirm('Xác nhận đơn hàng này đã được phục vụ?')) return;
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/staff-orders/${orderId}/confirm`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            showToast('Đã xác nhận đơn hàng', 'success');
            loadRecentOrders();
            loadDashboardData();
        } else {
            throw new Error('Xác nhận thất bại');
        }
    } catch (error) {
        console.error('Confirm error:', error);
        showToast('Xác nhận thất bại', 'error');
    }
};

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
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

// Event listeners
function initEventListeners() {
    if (userInfo) {
        userInfo.addEventListener('click', (e) => {
            e.stopPropagation();
            userMenu.classList.toggle('active');
        });
    }
    
    document.addEventListener('click', () => {
        if (userMenu) userMenu.classList.remove('active');
    });
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = '../../auth/html/staff-login.html';
        });
    }

    const checkInBtn = document.getElementById('checkInBtn');
    const checkOutBtn = document.getElementById('checkOutBtn');

    if (checkInBtn) {
        checkInBtn.addEventListener('click', handleCheckIn);
    }
    if (checkOutBtn) {
        checkOutBtn.addEventListener('click', handleCheckOut);
    }
}

async function loadAttendanceStatus() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/attendance/status', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        const statusEl = document.getElementById('attendanceStatus');
        const inBtn = document.getElementById('checkInBtn');
        const outBtn = document.getElementById('checkOutBtn');
        
        if (data.active) {
            const timeStr = new Date(data.check_in).toLocaleTimeString('vi-VN');
            if (statusEl) statusEl.innerHTML = `<span style="color: #10B981;">Đã check-in lúc ${timeStr}</span>`;
            if (inBtn) inBtn.style.display = 'none';
            if (outBtn) outBtn.style.display = 'block';
        } else {
            if (statusEl) statusEl.textContent = 'Chưa check-in';
            if (inBtn) inBtn.style.display = 'block';
            if (outBtn) outBtn.style.display = 'none';
        }
    } catch (e) {
        console.error('Attendance status error:', e);
    }
}

async function handleCheckIn() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/attendance/check-in', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (response.ok) {
            showToast('Check-in thành công', 'success');
            loadAttendanceStatus();
        } else {
            showToast(data.message || 'Check-in thất bại', 'error');
        }
    } catch (e) {
        showToast('Lỗi kết nối', 'error');
    }
}

async function handleCheckOut() {
    if (!confirm('Xác nhận kết thúc ca làm việc?')) return;
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/attendance/check-out', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (response.ok) {
            showToast('Check-out thành công', 'success');
            loadAttendanceStatus();
        } else {
            showToast(data.message || 'Check-out thất bại', 'error');
        }
    } catch (e) {
        showToast('Lỗi kết nối', 'error');
    }
}


// Mobile menu
function initMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');
    
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }
}

// Check status periodically
let statusCheckInterval = null;

async function startStatusCheck() {
    if (statusCheckInterval) clearInterval(statusCheckInterval);
    
    statusCheckInterval = setInterval(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch('http://localhost:5000/api/auth/check-status', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!response.ok) {
                logoutAndRedirect();
            }
        } catch (error) {
            console.error('Status check error:', error);
        }
    }, 30000);
}

function logoutAndRedirect() {
    if (statusCheckInterval) clearInterval(statusCheckInterval);
    localStorage.clear();
    sessionStorage.clear();
    showToast('Tài khoản của bạn đã bị vô hiệu hóa!', 'error');
    setTimeout(() => {
        window.location.href = '../../auth/html/staff-login.html';
    }, 2000);
}