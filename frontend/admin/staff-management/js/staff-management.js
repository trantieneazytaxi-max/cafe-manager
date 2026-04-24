/**
 * ADMIN STAFF MANAGEMENT - CYBERPUNK THEME
 */

let staffList = [];
let editingStaffId = null;

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../../auth/html/admin-login.html';
        return;
    }
    
    loadStaffList();
    initEventListeners();
});

async function loadStaffList() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/admin/staff', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Không thể tải danh sách');
        staffList = await response.json();
        renderStaffTable();
    } catch (error) {
        console.error('Lỗi tải staff:', error);
        document.getElementById('staffTableBody').innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 2rem;">Không thể tải dữ liệu</td></tr>';
    }
}

function renderStaffTable() {
    const tbody = document.getElementById('staffTableBody');
    const search = document.getElementById('searchInput').value.toLowerCase();
    
    const filtered = staffList.filter(staff => 
        staff.full_name.toLowerCase().includes(search) ||
        staff.email.toLowerCase().includes(search) ||
        (staff.phone && staff.phone.includes(search))
    );
    
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 2rem;">Không tìm thấy nhân viên</td></tr>';
        return;
    }
    
    tbody.innerHTML = filtered.map(staff => `
        <tr>
            <td><img class="staff-avatar-img" src="https://ui-avatars.com/api/?background=00f3ff&color=0a0a1a&name=${encodeURIComponent(staff.full_name)}" alt="Avatar"></td>
            <td><strong>${staff.full_name}</strong></td>
            <td>${staff.position || 'Nhân viên'}</td>
            <td>
                <div style="font-size: 0.8rem;">${staff.email}</div>
                <div style="font-size: 0.75rem; color: #8892b0;">${staff.phone || '---'}</div>
            </td>
            <td><span class="badge ${staff.is_active ? 'badge-success' : 'badge-danger'}">${staff.is_active ? 'Đang làm' : 'Đã nghỉ'}</span></td>
            <td>
                <div class="btn-action-group">
                    <button class="btn-icon" onclick="editStaff(${staff.user_id})" title="Sửa"><i class="fas fa-edit"></i></button>
                    ${staff.is_active ? 
                        `<button class="btn-icon" style="color: #ff0055; background: rgba(255, 0, 85, 0.1);" onclick="toggleStatus(${staff.user_id}, false)" title="Vô hiệu"><i class="fas fa-ban"></i></button>` :
                        `<button class="btn-icon" style="color: #00ff88; background: rgba(0, 255, 136, 0.1);" onclick="toggleStatus(${staff.user_id}, true)" title="Kích hoạt"><i class="fas fa-check-circle"></i></button>`
                    }
                </div>
            </td>
        </tr>
    `).join('');
}

async function toggleStatus(id, activate) {
    if (!confirm(`Bạn có chắc muốn ${activate ? 'kích hoạt' : 'vô hiệu hóa'} nhân viên này?`)) return;
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/admin/staff/${id}/toggle-status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ is_active: activate })
        });
        
        if (response.ok) {
            loadStaffList();
        }
    } catch (error) {
        console.error('Lỗi đổi trạng thái:', error);
    }
}

async function editStaff(id) {
    const staff = staffList.find(s => s.user_id === id);
    if (!staff) return;
    
    editingStaffId = id;
    document.getElementById('modalTitle').textContent = 'SỬA THÔNG TIN NHÂN VIÊN';
    document.getElementById('staffId').value = staff.user_id;
    document.getElementById('fullName').value = staff.full_name;
    document.getElementById('email').value = staff.email;
    document.getElementById('phone').value = staff.phone || '';
    document.getElementById('position').value = staff.position || 'Nhân viên phục vụ';
    document.getElementById('isActive').value = staff.is_active ? '1' : '0';
    document.getElementById('password').value = '';
    
    document.getElementById('staffModal').classList.add('active');
}

async function saveStaff(e) {
    e.preventDefault();
    const id = document.getElementById('staffId').value;
    const token = localStorage.getItem('token');
    
    const staffData = {
        full_name: document.getElementById('fullName').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        position: document.getElementById('position').value,
        is_active: document.getElementById('isActive').value === '1',
        role: 'staff'
    };
    
    const password = document.getElementById('password').value;
    if (password) staffData.password = password;
    
    const url = id ? `http://localhost:5000/api/admin/staff/${id}` : 'http://localhost:5000/api/admin/staff';
    const method = id ? 'PUT' : 'POST';
    
    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(staffData)
        });
        
        if (response.ok) {
            alert(id ? 'Cập nhật thành công' : 'Thêm nhân viên thành công');
            document.getElementById('staffModal').classList.remove('active');
            loadStaffList();
        } else {
            const err = await response.json();
            alert('Lỗi: ' + err.message);
        }
    } catch (error) {
        console.error('Lỗi lưu staff:', error);
    }
}

function initEventListeners() {
    document.getElementById('searchInput').addEventListener('input', renderStaffTable);
    document.getElementById('addStaffBtn').addEventListener('click', () => {
        editingStaffId = null;
        document.getElementById('modalTitle').textContent = 'THÊM NHÂN VIÊN MỚI';
        document.getElementById('staffForm').reset();
        document.getElementById('staffId').value = '';
        document.getElementById('staffModal').classList.add('active');
    });
    document.getElementById('cancelModalBtn').addEventListener('click', () => {
        document.getElementById('staffModal').classList.remove('active');
    });
    document.getElementById('staffForm').addEventListener('submit', saveStaff);
}