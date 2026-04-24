/**
 * STAFF TABLES MANAGEMENT - CAFE MANAGEMENT
 */

// State
let tables = [];
let currentTable = null;
let newStatus = null;

// DOM Elements
const tablesGrid = document.getElementById('tablesGrid');
const totalTablesEl = document.getElementById('totalTables');
const availableTablesEl = document.getElementById('availableTables');
const occupiedTablesEl = document.getElementById('occupiedTables');
const reservedTablesEl = document.getElementById('reservedTables');
const refreshBtn = document.getElementById('refreshBtn');
const tableModal = document.getElementById('tableModal');
const confirmModal = document.getElementById('confirmModal');
const modalTableTitle = document.getElementById('modalTableTitle');
const modalBody = document.getElementById('modalBody');
const closeModalBtn = document.getElementById('closeModalBtn');
const modalCancelBtn = document.getElementById('modalCancelBtn');
const modalConfirmBtn = document.getElementById('modalConfirmBtn');
const confirmCancelBtn = document.getElementById('confirmCancelBtn');
const confirmOkBtn = document.getElementById('confirmOkBtn');
const confirmMessage = document.getElementById('confirmMessage');

// Check authentication
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    if (!token || role !== 'staff') {
        window.location.href = '../../../auth/html/staff-login.html';
        return;
    }
    
    loadStaffInfo();
    loadTables();
    initEventListeners();
    initMobileMenu();
    initUserMenu();
    initLogout();
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

// Load tables from API
async function loadTables() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/tables', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Không thể tải dữ liệu');
        
        tables = await response.json();
        renderTables();
        updateStats();
        
    } catch (error) {
        console.error('Lỗi tải bàn:', error);
        if (tablesGrid) {
            tablesGrid.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Không thể tải dữ liệu</p>
                </div>
            `;
        }
    }
}

// Render tables grid
function renderTables() {
    if (!tablesGrid) return;
    
    if (tables.length === 0) {
        tablesGrid.innerHTML = '<div class="loading-spinner">Không có bàn nào</div>';
        return;
    }
    
    tablesGrid.innerHTML = tables.map(table => `
        <div class="table-card ${table.status}" data-table-id="${table.table_id}">
            <div class="table-icon">
                <i class="fas fa-${table.capacity <= 2 ? 'chair' : table.capacity <= 4 ? 'users' : 'couch'}"></i>
            </div>
            <div class="table-number">Bàn ${table.table_number}</div>
            <div class="table-capacity"><i class="fas fa-user-friends"></i> ${table.capacity}</div>
            <div class="table-status status-${table.status}">
                ${getStatusText(table.status)}
            </div>
            ${table.location ? `<div class="table-location"><i class="fas fa-map-marker-alt"></i> ${table.location}</div>` : ''}
        </div>
    `).join('');
    
    // Add click events
    document.querySelectorAll('.table-card').forEach(card => {
        card.addEventListener('click', () => {
            const tableId = parseInt(card.getAttribute('data-table-id'));
            const table = tables.find(t => t.table_id === tableId);
            if (table) openTableModal(table);
        });
    });
}

// Update statistics
function updateStats() {
    const total = tables.length;
    const available = tables.filter(t => t.status === 'available').length;
    const occupied = tables.filter(t => t.status === 'occupied').length;
    const reserved = tables.filter(t => t.status === 'reserved').length;
    
    if (totalTablesEl) totalTablesEl.textContent = total;
    if (availableTablesEl) availableTablesEl.textContent = available;
    if (occupiedTablesEl) occupiedTablesEl.textContent = occupied;
    if (reservedTablesEl) reservedTablesEl.textContent = reserved;
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

// Open table modal
function openTableModal(table) {
    currentTable = table;
    modalTableTitle.textContent = `Bàn ${table.table_number}`;
    
    modalBody.innerHTML = `
        <div class="info-row">
            <span>Mã bàn:</span>
            <span>#${table.table_id}</span>
        </div>
        <div class="info-row">
            <span>Số bàn:</span>
            <span>${table.table_number}</span>
        </div>
        <div class="info-row">
            <span>Sức chứa:</span>
            <span>${table.capacity} người</span>
        </div>
        <div class="info-row">
            <span>Vị trí:</span>
            <span>${table.location || 'Không xác định'}</span>
        </div>
        <div class="info-row">
            <span>Trạng thái hiện tại:</span>
            <span class="status-${table.status}">${getStatusText(table.status)}</span>
        </div>
        <div class="info-row">
            <span>Đổi trạng thái:</span>
            <select id="statusSelect" class="status-select">
                <option value="available" ${table.status === 'available' ? 'selected' : ''}>Trống</option>
                <option value="occupied" ${table.status === 'occupied' ? 'selected' : ''}>Đang dùng</option>
                <option value="reserved" ${table.status === 'reserved' ? 'selected' : ''}>Đã đặt</option>
            </select>
        </div>
    `;
    
    tableModal.classList.remove('hidden');
}

// Update table status
async function updateTableStatus(tableId, newStatus) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/tables/${tableId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: newStatus })
        });
        
        if (!response.ok) throw new Error('Cập nhật thất bại');
        
        showToast(`Đã cập nhật trạng thái bàn`, 'success');
        loadTables(); // Reload danh sách
        
    } catch (error) {
        console.error('Lỗi cập nhật:', error);
        showToast('Cập nhật thất bại', 'error');
    }
}

// Close modals
function closeTableModal() {
    tableModal.classList.add('hidden');
}

function closeConfirmModal() {
    confirmModal.classList.add('hidden');
}

// Event listeners
function initEventListeners() {
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadTables);
    }
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeTableModal);
    }
    
    if (modalCancelBtn) {
        modalCancelBtn.addEventListener('click', closeTableModal);
    }
    
    if (modalConfirmBtn) {
        modalConfirmBtn.addEventListener('click', () => {
            const statusSelect = document.getElementById('statusSelect');
            if (statusSelect && currentTable) {
                newStatus = statusSelect.value;
                
                if (newStatus === currentTable.status) {
                    showToast('Trạng thái không thay đổi', 'info');
                    closeTableModal();
                    return;
                }
                
                confirmMessage.textContent = `Bạn có chắc chắn muốn đổi trạng thái bàn ${currentTable.table_number} từ "${getStatusText(currentTable.status)}" sang "${getStatusText(newStatus)}"?`;
                confirmModal.classList.remove('hidden');
                closeTableModal();
            }
        });
    }
    
    if (confirmCancelBtn) {
        confirmCancelBtn.addEventListener('click', closeConfirmModal);
    }
    
    if (confirmOkBtn) {
        confirmOkBtn.addEventListener('click', async () => {
            if (currentTable && newStatus) {
                await updateTableStatus(currentTable.table_id, newStatus);
                closeConfirmModal();
                currentTable = null;
                newStatus = null;
            }
        });
    }
    
    // Click outside modal to close
    if (tableModal) {
        tableModal.addEventListener('click', (e) => {
            if (e.target === tableModal) closeTableModal();
        });
    }
    
    if (confirmModal) {
        confirmModal.addEventListener('click', (e) => {
            if (e.target === confirmModal) closeConfirmModal();
        });
    }
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
            .custom-toast.info { background: #3498db; }
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