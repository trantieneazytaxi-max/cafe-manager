/**
 * STAFF ORDERS MANAGEMENT - CAFE MANAGEMENT
 * Includes: Order type badges, delivery info, order type filtering
 */

// State
let orders = [];
let currentStatus = 'all';
let currentOrderType = 'all';
let currentOrderId = null;

// DOM Elements
const ordersTableBody = document.getElementById('ordersTableBody');
const pendingCountEl = document.getElementById('pendingCount');
const completedCountEl = document.getElementById('completedCount');
const todayRevenueEl = document.getElementById('todayRevenue');
const searchInput = document.getElementById('searchInput');
const refreshBtn = document.getElementById('refreshBtn');
const orderModal = document.getElementById('orderModal');
const orderIdSpan = document.getElementById('orderIdSpan');
const orderDetailBody = document.getElementById('orderDetailBody');
const closeModalBtn = document.getElementById('closeModalBtn');
const modalCancelBtn = document.getElementById('modalCancelBtn');
const confirmOrderBtn = document.getElementById('confirmOrderBtn');

// Check authentication
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    if (!token || (role !== 'staff' && role !== 'admin')) {
        window.location.href = '../../../auth/html/staff-login.html';
        return;
    }
    
    loadStaffInfo();
    loadOrders();
    initEventListeners();
    initMobileMenu();
    initUserMenu();
    initLogout();

    // Tự động làm mới mỗi 10 giây
    setInterval(loadOrders, 10000);
});

// Load staff info
function loadStaffInfo() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const staffName = document.getElementById('staffName');
    const staffAvatar = document.getElementById('staffAvatar');
    
    if (staffName) staffName.textContent = user.full_name || 'Nhân viên';
    if (staffAvatar) {
        staffAvatar.src = `https://ui-avatars.com/api/?background=3498db&color=fff&rounded=true&name=${encodeURIComponent(user.full_name || 'Staff')}`;
    }
}

// Load orders
async function loadOrders() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/staff-orders', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Không thể tải đơn hàng');
        
        orders = await response.json();
        updateStats();
        renderOrders();
        
    } catch (error) {
        console.error('Lỗi tải orders:', error);
        if (ordersTableBody) {
            ordersTableBody.innerHTML = '<tr><td colspan="7" class="loading">Không thể tải dữ liệu</td></tr>';
        }
    }
}

// Update statistics
function updateStats() {
    const activeStatuses = ['pending', 'paid', 'confirmed', 'preparing', 'ready'];
    const pending = orders.filter(o => activeStatuses.includes(o.status)).length;
    const completed = orders.filter(o => o.status === 'completed').length;
    
    // Tính doanh thu hôm nay (sử dụng ngày địa phương)
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
    
    const todayRevenue = orders
        .filter(o => (o.status === 'completed' || o.status === 'paid') && o.created_at?.split('T')[0] === todayStr)
        .reduce((sum, o) => sum + (o.total_amount || 0), 0);
    
    if (pendingCountEl) pendingCountEl.textContent = pending;
    if (completedCountEl) completedCountEl.textContent = completed;
    if (todayRevenueEl) todayRevenueEl.textContent = formatCurrency(todayRevenue);
}

// Render orders table
function renderOrders() {
    if (!ordersTableBody) return;
    
    let filtered = [...orders];
    
    // Filter by status
    if (currentStatus !== 'all') {
        filtered = filtered.filter(o => o.status === currentStatus);
    }

    // Filter by order type
    if (currentOrderType !== 'all') {
        filtered = filtered.filter(o => (o.order_type || 'dine-in') === currentOrderType);
    }
    
    // Filter by search
    const searchTerm = searchInput?.value.toLowerCase() || '';
    if (searchTerm) {
        filtered = filtered.filter(o => 
            o.order_id.toString().includes(searchTerm) ||
            (o.order_code && o.order_code.toLowerCase().includes(searchTerm)) ||
            (o.table_number && o.table_number.toString().includes(searchTerm)) ||
            (o.customer_name && o.customer_name.toLowerCase().includes(searchTerm)) ||
            (o.guest_name && o.guest_name.toLowerCase().includes(searchTerm)) ||
            (o.guest_phone && o.guest_phone.includes(searchTerm))
        );
    }
    
    if (filtered.length === 0) {
        ordersTableBody.innerHTML = '<tr><td colspan="7" class="loading">Không có đơn hàng nào</td></tr>';
        return;
    }
    
    ordersTableBody.innerHTML = filtered.map(order => `
        <tr>
            <td>${order.order_code || '#' + order.order_id}</td>
            <td>${renderOrderTypeBadge(order.order_type)}</td>
            <td>
                ${renderCustomerInfo(order)}
            </td>
            <td>${formatCurrency(order.total_amount)}</td>
            <td>${formatDate(order.created_at)}</td>
            <td><span class="status-badge status-${order.status}">${getStatusText(order.status)}</span></td>
            <td>
                <div class="action-group">
                    <button class="action-btn btn-view" onclick="viewOrderDetail(${order.order_id})" title="Xem chi tiết">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${renderStatusFlowButtons(order)}
                </div>
            </td>
        </tr>
    `).join('');
}

// Render order type badge
function renderOrderTypeBadge(orderType) {
    switch(orderType) {
        case 'takeaway':
            return '<span class="order-type-badge type-takeaway"><i class="fas fa-shopping-bag"></i> Tự đến lấy</span>';
        case 'delivery':
            return '<span class="order-type-badge type-delivery"><i class="fas fa-truck"></i> Giao hàng</span>';
        default:
            return '<span class="order-type-badge type-dinein"><i class="fas fa-chair"></i> Tại chỗ</span>';
    }
}

// Render customer info based on order type
function renderCustomerInfo(order) {
    const type = order.order_type || 'dine-in';
    
    if (type === 'dine-in') {
        return `
            <div><strong>Bàn ${order.table_number || '---'}</strong></div>
            <div class="order-note-small">${order.customer_name || 'Khách lẻ'}</div>
            ${order.note ? `<div class="order-note-small"><i class="fas fa-comment-dots"></i> ${escapeHtml(order.note)}</div>` : ''}
        `;
    } else if (type === 'takeaway') {
        return `
            <div><strong>${escapeHtml(order.guest_name || order.customer_name || 'Khách')}</strong></div>
            ${order.guest_phone ? `<div class="order-note-small"><i class="fas fa-phone"></i> ${order.guest_phone}</div>` : ''}
            ${order.note ? `<div class="order-note-small"><i class="fas fa-comment-dots"></i> ${escapeHtml(order.note)}</div>` : ''}
        `;
    } else {
        return `
            <div><strong>${escapeHtml(order.guest_name || order.customer_name || 'Khách')}</strong></div>
            ${order.guest_phone ? `<div class="order-note-small"><i class="fas fa-phone"></i> ${order.guest_phone}</div>` : ''}
            ${order.delivery_address ? `<div class="order-note-small delivery-addr"><i class="fas fa-map-marker-alt"></i> ${escapeHtml(order.delivery_address)}</div>` : ''}
        `;
    }
}

function renderStatusFlowButtons(order) {
    switch(order.status) {
        case 'pending':
            return `<button class="action-btn btn-confirm-order" onclick="updateStatus(${order.order_id}, 'confirmed')" title="Xác nhận"><i class="fas fa-check"></i></button>`;
        case 'paid':
        case 'confirmed':
            return `<button class="action-btn" style="background: #f1c40f;" onclick="updateStatus(${order.order_id}, 'preparing')" title="Bắt đầu làm"><i class="fas fa-coffee"></i></button>`;
        case 'preparing':
            return `<button class="action-btn" style="background: #00ff88; color: #05050a;" onclick="updateStatus(${order.order_id}, 'ready')" title="Xong món"><i class="fas fa-bell"></i></button>`;
        case 'ready':
            return `<button class="action-btn" style="background: #3498db;" onclick="updateStatus(${order.order_id}, 'completed')" title="Giao xong"><i class="fas fa-flag-checkered"></i></button>`;
        default:
            return '';
    }
}

async function updateStatus(orderId, status) {
    if (!confirm(`Chuyển đơn hàng sang trạng thái "${getStatusText(status)}"?`)) return;
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/staff-orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status })
        });
        
        if (response.ok) {
            showToast('Cập nhật trạng thái thành công');
            loadOrders();
        } else {
            const data = await response.json();
            throw new Error(data.message || 'Lỗi khi cập nhật');
        }
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// View order detail
window.viewOrderDetail = async function(orderId) {
    currentOrderId = orderId;
    orderIdSpan.textContent = orderId;
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/staff-orders/${orderId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Không thể tải chi tiết');
        
        const order = await response.json();
        renderOrderDetail(order);
        orderModal.classList.remove('hidden');
        
    } catch (error) {
        console.error('Lỗi tải chi tiết:', error);
        alert('Không thể tải chi tiết đơn hàng');
    }
};

// Render order detail with delivery info
function renderOrderDetail(order) {
    if (!orderDetailBody) return;
    
    const orderType = order.order_type || 'dine-in';
    
    const itemsHtml = order.items?.map(item => `
        <tr>
            <td>${escapeHtml(item.item_name)}</td>
            <td>${item.quantity}</td>
            <td>${formatCurrency(item.unit_price)}</td>
            <td>${formatCurrency(item.subtotal)}</td>
        </tr>
    `).join('');
    
    // Build delivery info section
    let deliveryInfoHtml = '';
    if (orderType === 'takeaway' || orderType === 'delivery') {
        deliveryInfoHtml = `
        <div class="delivery-info-section">
            <h4><i class="fas fa-${orderType === 'delivery' ? 'truck' : 'shopping-bag'}"></i> Thông tin ${orderType === 'delivery' ? 'giao hàng' : 'mang đi'}</h4>
            <div class="delivery-info-grid">
                <div class="delivery-info-item">
                    <i class="fas fa-user"></i>
                    <div>
                        <span class="info-label">Người nhận</span>
                        <span class="info-value">${escapeHtml(order.guest_name || order.customer_name || 'Không rõ')}</span>
                    </div>
                </div>
                <div class="delivery-info-item">
                    <i class="fas fa-phone"></i>
                    <div>
                        <span class="info-label">Số điện thoại</span>
                        <span class="info-value">${order.guest_phone || 'Không có'}</span>
                    </div>
                </div>
                ${orderType === 'delivery' ? `
                <div class="delivery-info-item full-width">
                    <i class="fas fa-map-marker-alt"></i>
                    <div>
                        <span class="info-label">Địa chỉ giao hàng</span>
                        <span class="info-value">${escapeHtml(order.delivery_address || 'Không có')}</span>
                    </div>
                </div>
                ` : ''}
            </div>
        </div>
        `;
    }

    orderDetailBody.innerHTML = `
        <div class="order-info">
            <div class="info-row">
                <span>Mã đơn hàng:</span>
                <span class="highlight-code">#${order.order_code || order.order_id}</span>
            </div>
            <div class="info-row">
                <span>Loại đơn:</span>
                ${renderOrderTypeBadge(orderType)}
            </div>
            ${orderType === 'dine-in' ? `
            <div class="info-row">
                <span>Bàn:</span>
                <span>Bàn ${order.table_number || '---'}</span>
            </div>
            ` : ''}
            <div class="info-row">
                <span>Khách hàng:</span>
                <span>${escapeHtml(order.customer_name || order.guest_name || 'Khách lẻ')}</span>
            </div>
            <div class="info-row">
                <span>Thời gian:</span>
                <span>${formatDateTime(order.created_at)}</span>
            </div>
            <div class="info-row">
                <span>Trạng thái:</span>
                <span class="status-badge status-${order.status}">${getStatusText(order.status)}</span>
            </div>
            ${order.note ? `
            <div class="info-row" style="flex-direction: column; align-items: flex-start; gap: 5px;">
                <span>Ghi chú của khách:</span>
                <div style="background: #fdf2e9; padding: 8px 12px; border-radius: 8px; border-left: 4px solid #e67e22; width: 100%; font-size: 0.85rem;">
                    ${escapeHtml(order.note)}
                </div>
            </div>` : ''}
        </div>

        ${deliveryInfoHtml}
        
        <h4 style="margin: 1rem 0 0.5rem;">Chi tiết món</h4>
        <table class="items-table">
            <thead>
                <tr><th>Tên món</th><th>Số lượng</th><th>Đơn giá</th><th>Thành tiền</th></tr>
            </thead>
            <tbody>
                ${itemsHtml}
            </tbody>
            <tfoot>
                ${order.discount_amount > 0 ? `<tr><td colspan="3" style="text-align: right;">Giảm giá:</td><td style="color: #e74c3c;">-${formatCurrency(order.discount_amount)}</td></tr>` : ''}
                <tr><td colspan="3" style="text-align: right;"><strong>Tổng cộng:</strong></td><td class="total-row">${formatCurrency(order.total_amount)}</td></tr>
            </tfoot>
        </table>

        ${order.status === 'pending' ? `
        <div class="staff-payment-calc" style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 12px; border: 1px solid #dee2e6;">
            <h4 style="margin-bottom: 10px; color: #2c3e50;"><i class="fas fa-calculator"></i> Xử lý thanh toán</h4>
            <div style="display: flex; gap: 15px; align-items: flex-end;">
                <div style="flex: 1;">
                    <label style="display: block; font-size: 13px; margin-bottom: 5px; color: #666;">Tiền khách đưa:</label>
                    <input type="number" id="staffCashAmount" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #ccc;" placeholder="Nhập số tiền...">
                </div>
                <div style="flex: 1;">
                    <label style="display: block; font-size: 13px; margin-bottom: 5px; color: #666;">Tiền thừa trả khách:</label>
                    <div id="staffChangeAmount" style="padding: 10px; font-weight: 700; color: #e67e22; font-size: 18px;">0₫</div>
                </div>
            </div>
        </div>
        ` : ''}
    `;

    // Thêm listener cho calculator
    const cashInput = document.getElementById('staffCashAmount');
    if (cashInput) {
        cashInput.addEventListener('input', () => {
            const given = parseFloat(cashInput.value) || 0;
            const total = order.total_amount || 0;
            const change = given - total;
            document.getElementById('staffChangeAmount').textContent = formatCurrency(Math.max(0, change));
        });
    }
    
    // Cập nhật nút trong footer modal
    const modalFooter = document.querySelector('.modal-footer');
    if (modalFooter) {
        let footerHtml = `<button type="button" class="btn-cancel" onclick="document.getElementById('orderModal').classList.add('hidden')">ĐÓNG</button>`;
        
        const nextBtn = getNextStatusButton(order);
        if (nextBtn) {
            footerHtml += nextBtn;
        }
        
        modalFooter.innerHTML = footerHtml;
    }
}

function getNextStatusButton(order) {
    switch(order.status) {
        case 'pending':
            return `<button type="button" class="btn-confirm" onclick="updateStatus(${order.order_id}, 'confirmed')">XÁC NHẬN ĐƠN</button>`;
        case 'paid':
        case 'confirmed':
            return `<button type="button" class="btn-confirm" style="background: #f1c40f;" onclick="updateStatus(${order.order_id}, 'preparing')">BẮT ĐẦU CHẾ BIẾN</button>`;
        case 'preparing':
            return `<button type="button" class="btn-confirm" style="background: #00ff88; color: #05050a;" onclick="updateStatus(${order.order_id}, 'ready')">BÁO CÓ HÀNG</button>`;
        case 'ready':
            return `<button type="button" class="btn-confirm" style="background: #3498db;" onclick="updateStatus(${order.order_id}, 'completed')">HOÀN THÀNH</button>`;
        default:
            return '';
    }
}

// Confirm order
window.confirmOrder = async function(orderId) {
    if (!confirm('Xác nhận đơn hàng này đã hoàn thành?')) return;
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/staff-orders/${orderId}/confirm`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Xác nhận thất bại');
        
        showToast('Đã xác nhận đơn hàng thành công', 'success');
        loadOrders(); // Reload danh sách
        
        if (orderModal && !orderModal.classList.contains('hidden')) {
            orderModal.classList.add('hidden');
        }
        
    } catch (error) {
        console.error('Confirm error:', error);
        showToast('Xác nhận thất bại', 'error');
    }
};

// Confirm from modal
async function confirmCurrentOrder() {
    if (currentOrderId) {
        await window.confirmOrder(currentOrderId);
    }
}

// Format functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
}

function formatDate(dateStr) {
    if (!dateStr) return '---';
    const date = new Date(dateStr);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

function formatDateTime(dateStr) {
    if (!dateStr) return '---';
    const date = new Date(dateStr);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

function getStatusText(status) {
    switch(status) {
        case 'pending': return 'Chờ xác nhận';
        case 'paid': return 'Đã thanh toán';
        case 'confirmed': return 'Đã xác nhận';
        case 'preparing': return 'Đang làm';
        case 'ready': return 'Có hàng';
        case 'completed': return 'Hoàn thành';
        case 'cancelled': return 'Đã hủy';
        default: return status;
    }
}

function getOrderTypeText(type) {
    switch(type) {
        case 'takeaway': return 'Tự đến lấy';
        case 'delivery': return 'Giao hàng';
        default: return 'Tại chỗ';
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

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
    // Status tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentStatus = btn.getAttribute('data-status');
            renderOrders();
        });
    });

    // Order type filter buttons
    document.querySelectorAll('.type-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.type-filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentOrderType = btn.getAttribute('data-type');
            renderOrders();
        });
    });
    
    // Search
    if (searchInput) {
        searchInput.addEventListener('input', () => renderOrders());
    }
    
    // Refresh
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadOrders);
    }
    
    // Modal close
    if (closeModalBtn) closeModalBtn.addEventListener('click', () => orderModal.classList.add('hidden'));
    if (modalCancelBtn) modalCancelBtn.addEventListener('click', () => orderModal.classList.add('hidden'));
    
    // Confirm from modal
    if (confirmOrderBtn) confirmOrderBtn.addEventListener('click', confirmCurrentOrder);
    
    // Click outside modal
    if (orderModal) {
        orderModal.addEventListener('click', (e) => {
            if (e.target === orderModal) orderModal.classList.add('hidden');
        });
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

// User menu dropdown
function initUserMenu() {
    const userInfo = document.querySelector('.user-info');
    const userMenu = document.querySelector('.user-menu');
    
    if (userInfo && userMenu) {
        userInfo.addEventListener('click', (e) => {
            e.stopPropagation();
            userMenu.classList.toggle('active');
        });
        
        document.addEventListener('click', () => {
            userMenu.classList.remove('active');
        });
    }
}

// Logout
function initLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = '../../../auth/html/staff-login.html';
        });
    }
}