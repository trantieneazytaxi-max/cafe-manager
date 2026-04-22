/**
 * TABLES PAGE - CAFE MANAGEMENT
 * Hiển thị sơ đồ bàn, chọn bàn để order
 */

// State
let tables = [];
let selectedTable = null;

// DOM Elements
const tablesGrid = document.getElementById('tablesGrid');
const selectedTableInfo = document.getElementById('selectedTableInfo');
const selectedTableName = document.getElementById('selectedTableName');
const changeTableBtn = document.getElementById('changeTableBtn');
const confirmModal = document.getElementById('confirmModal');
const confirmTableName = document.getElementById('confirmTableName');
const modalConfirmBtn = document.getElementById('modalConfirmBtn');
const modalCancelBtn = document.getElementById('modalCancelBtn');

// Check authentication
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../../../auth/html/auth.html';
        return;
    }
    
    loadSelectedTable();
    loadTables();
    initEventListeners();
    
    updateNavbarCartCount();
});

// Load selected table from sessionStorage
function loadSelectedTable() {
    const savedTable = sessionStorage.getItem('selectedTable');
    if (savedTable) {
        selectedTable = JSON.parse(savedTable);
        showSelectedTableInfo();
    }
}

// Show selected table info
function showSelectedTableInfo() {
    if (selectedTable && selectedTableInfo) {
        selectedTableName.textContent = `Bàn ${selectedTable.table_number} (${selectedTable.capacity} người)`;
        selectedTableInfo.style.display = 'block';
    }
}

// Hide selected table info
function hideSelectedTableInfo() {
    if (selectedTableInfo) {
        selectedTableInfo.style.display = 'none';
    }
}

// Load tables from API
async function loadTables() {
    try {
        console.log('Đang tải danh sách bàn...');
        const response = await fetch('http://localhost:5000/api/tables');
        const data = await response.json();
        
        if (response.ok) {
            tables = data;
            console.log('Đã tải', tables.length, 'bàn');
        } else {
            throw new Error('Không thể tải danh sách bàn');
        }
        renderTables();
    } catch (error) {
        console.error('Lỗi tải bàn:', error);
        showToast('Không thể tải danh sách bàn', 'error');
        tablesGrid.innerHTML = `
            <div class="no-results">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Không thể tải dữ liệu</h3>
                <p>Vui lòng thử lại sau</p>
            </div>
        `;
    }
}

// Render tables grid
function renderTables() {
    if (!tablesGrid) return;
    
    if (tables.length === 0) {
        tablesGrid.innerHTML = `
            <div class="no-results">
                <i class="fas fa-chair"></i>
                <h3>Không có bàn nào</h3>
                <p>Vui lòng liên hệ quản lý</p>
            </div>
        `;
        return;
    }
    
    tablesGrid.innerHTML = tables.map(table => `
        <div class="table-card ${table.status} ${selectedTable?.table_id === table.table_id ? 'selected' : ''}" 
             data-table-id="${table.table_id}"
             data-status="${table.status}">
            <div class="table-icon">
                <i class="fas fa-${table.capacity <= 2 ? 'chair' : table.capacity <= 4 ? 'users' : 'couch'}"></i>
            </div>
            <div class="table-number">Bàn ${table.table_number}</div>
            <div class="table-capacity"><i class="fas fa-user-friends"></i> ${table.capacity} người</div>
            <div class="table-status status-${table.status}">
                ${getStatusText(table.status)}
            </div>
            ${table.location ? `<div class="table-location"><i class="fas fa-map-marker-alt"></i> ${table.location}</div>` : ''}
        </div>
    `).join('');
    
    // Add click events
    document.querySelectorAll('.table-card').forEach(card => {
        card.addEventListener('click', (e) => {
            const status = card.getAttribute('data-status');
            if (status === 'available') {
                const tableId = parseInt(card.getAttribute('data-table-id'));
                const table = tables.find(t => t.table_id === tableId);
                if (table) {
                    openConfirmModal(table);
                }
            } else {
                showToast(`Bàn ${card.querySelector('.table-number')?.textContent || ''} không khả dụng`, 'error');
            }
        });
    });
}

// Get status text in Vietnamese
function getStatusText(status) {
    switch(status) {
        case 'available': return 'Trống';
        case 'occupied': return 'Đang dùng';
        case 'reserved': return 'Đã đặt';
        default: return status;
    }
}

// Open confirm modal
function openConfirmModal(table) {
    if (!confirmModal) return;
    confirmTableName.textContent = `Bàn ${table.table_number} (${table.capacity} người)`;
    confirmModal.setAttribute('data-table-id', table.table_id);
    confirmModal.classList.remove('hidden');
}

// Select table
function selectTable(tableId) {
    const table = tables.find(t => t.table_id === tableId);
    if (!table) return;
    
    selectedTable = table;
    sessionStorage.setItem('selectedTable', JSON.stringify(selectedTable));
    
    // Update UI
    renderTables();
    showSelectedTableInfo();
    
    showToast(`Đã chọn ${selectedTableName.textContent}`, 'success');
}

// Change table
function changeTable() {
    selectedTable = null;
    sessionStorage.removeItem('selectedTable');
    hideSelectedTableInfo();
    renderTables();
    showToast('Đã hủy chọn bàn, bạn có thể chọn bàn khác', 'info');
}

// Event listeners
function initEventListeners() {
    if (changeTableBtn) {
        changeTableBtn.addEventListener('click', changeTable);
    }
    
    if (modalCancelBtn) {
        modalCancelBtn.addEventListener('click', () => {
            confirmModal.classList.add('hidden');
        });
    }
    
    if (modalConfirmBtn) {
        modalConfirmBtn.addEventListener('click', () => {
            const tableId = parseInt(confirmModal.getAttribute('data-table-id'));
            selectTable(tableId);
            confirmModal.classList.add('hidden');
        });
    }
    
    // Close modal when clicking outside
    if (confirmModal) {
        confirmModal.addEventListener('click', (e) => {
            if (e.target === confirmModal) {
                confirmModal.classList.add('hidden');
            }
        });
    }
}

// Update navbar cart count
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
