/**
 * TABLES MANAGEMENT - CYBERPUNK THEME
 */

let allTables = [];

document.addEventListener('DOMContentLoaded', () => {
    loadTables();
    document.getElementById('tableForm').addEventListener('submit', handleTableSubmit);
});

async function loadTables() {
    try {
        const token = localStorage.getItem('token');
        const locationFilter = document.getElementById('locationFilter').value;
        
        const response = await fetch('http://localhost:5000/api/tables', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        allTables = await response.json();
        
        // Update stats
        updateMiniStats();
        
        let filtered = allTables;
        if (locationFilter !== 'all') {
            filtered = allTables.filter(t => t.location === locationFilter);
        }
        
        renderTables(filtered);
    } catch (error) {
        console.error('Lỗi load bàn:', error);
    }
}

function updateMiniStats() {
    document.getElementById('totalTablesCount').textContent = allTables.length;
    document.getElementById('availableTablesCount').textContent = allTables.filter(t => t.status === 'available').length;
    document.getElementById('occupiedTablesCount').textContent = allTables.filter(t => t.status === 'occupied').length;
    document.getElementById('reservedTablesCount').textContent = allTables.filter(t => t.status === 'reserved').length;
}

function renderTables(tables) {
    const container = document.getElementById('tablesContainer');
    if (tables.length === 0) {
        container.innerHTML = '<p style="text-align: center; grid-column: 1/-1; color: #8892b0; padding: 3rem;">Không tìm thấy bàn nào trong khu vực này</p>';
        return;
    }
    
    container.innerHTML = tables.map(table => `
        <div class="table-card-admin ${table.status}">
            <div class="table-num">BÀN ${table.table_number}</div>
            <div class="table-cap">
                <i class="fas fa-users" style="color: #00f3ff;"></i> ${table.capacity} chỗ
                <br>
                <small style="color: #8892b0;">${table.location}</small>
            </div>
            <div class="table-actions" style="margin-top: 1rem;">
                <button class="btn-icon" onclick="openEditTableModal(${table.table_id})" title="Chỉnh sửa">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon" style="color: #ff0055; background: rgba(255, 0, 85, 0.1);" onclick="deleteTable(${table.table_id})" title="Xóa">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function openAddTableModal() {
    document.getElementById('tableModalTitle').textContent = 'THÊM BÀN MỚI';
    document.getElementById('tableForm').reset();
    document.getElementById('editTableId').value = '';
    document.getElementById('statusGroup').style.display = 'none';
    document.getElementById('tableModal').classList.add('active');
}

function openEditTableModal(id) {
    const table = allTables.find(t => t.table_id == id);
    if (!table) return;
    
    document.getElementById('tableModalTitle').textContent = 'CHỈNH SỬA BÀN';
    document.getElementById('editTableId').value = table.table_id;
    document.getElementById('tableNumber').value = table.table_number;
    document.getElementById('tableCapacity').value = table.capacity;
    document.getElementById('tableLocation').value = table.location;
    document.getElementById('tableStatus').value = table.status;
    
    document.getElementById('statusGroup').style.display = 'block';
    document.getElementById('tableModal').classList.add('active');
}

function closeTableModal() {
    document.getElementById('tableModal').classList.remove('active');
}

async function handleTableSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('editTableId').value;
    const token = localStorage.getItem('token');
    
    const tableData = {
        table_number: document.getElementById('tableNumber').value,
        capacity: document.getElementById('tableCapacity').value,
        location: document.getElementById('tableLocation').value,
        status: id ? document.getElementById('tableStatus').value : 'available'
    };
    
    const url = id ? `http://localhost:5000/api/tables/${id}` : 'http://localhost:5000/api/tables';
    const method = id ? 'PUT' : 'POST';
    
    try {
        const response = await fetch(url, {
            method: method,
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(tableData)
        });
        
        if (response.ok) {
            alert(id ? 'Cập nhật thành công' : 'Thêm bàn thành công');
            closeTableModal();
            loadTables();
        } else {
            const result = await response.json();
            alert('Lỗi: ' + result.message);
        }
    } catch (error) {
        console.error('Lỗi submit bàn:', error);
    }
}

async function deleteTable(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa bàn này?')) return;
    
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`http://localhost:5000/api/tables/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            alert('Xóa bàn thành công');
            loadTables();
        } else {
            const result = await response.json();
            alert('Lỗi: ' + result.message);
        }
    } catch (error) {
        console.error('Lỗi xóa bàn:', error);
    }
}
