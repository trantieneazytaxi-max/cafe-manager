/**
 * ADMIN STAFF MANAGEMENT - CAFE MANAGEMENT
 */

// State
let staffList = [];
let editingStaffId = null;

// DOM Elements
const staffTableBody = document.getElementById('staffTableBody');
const searchInput = document.getElementById('searchInput');
const addStaffBtn = document.getElementById('addStaffBtn');
const staffModal = document.getElementById('staffModal');
const deleteModal = document.getElementById('deleteModal');
const modalTitle = document.getElementById('modalTitle');
const staffForm = document.getElementById('staffForm');

// Form fields
const fullNameInput = document.getElementById('fullName');
const dateOfBirthInput = document.getElementById('dateOfBirth');
const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phone');
const identityNumberInput = document.getElementById('identityNumber');
const addressInput = document.getElementById('address');
const bankAccountInput = document.getElementById('bankAccount');
const bankNameInput = document.getElementById('bankName');
const bankBranchInput = document.getElementById('bankBranch');
const positionSelect = document.getElementById('position');
const salaryInput = document.getElementById('salary');
const hireDateInput = document.getElementById('hireDate');
const emergencyContactNameInput = document.getElementById('emergencyContactName');
const emergencyContactPhoneInput = document.getElementById('emergencyContactPhone');
const notesInput = document.getElementById('notes');
const passwordInput = document.getElementById('password');
const isActiveSelect = document.getElementById('isActive');

const saveStaffBtn = document.getElementById('saveStaffBtn');
const cancelModalBtn = document.getElementById('cancelModalBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const deleteCancelBtn = document.getElementById('deleteCancelBtn');
const deleteConfirmBtn = document.getElementById('deleteConfirmBtn');
const deleteMessage = document.getElementById('deleteMessage');

let deleteTargetId = null;
let deleteAction = 'deactivate'; // 'deactivate' or 'activate'

// Check authentication
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    if (!token || role !== 'admin') {
        window.location.href = '../../auth/html/admin-login.html';
        return;
    }
    
    loadAdminInfo();
    loadStaffList();
    initEventListeners();
    initLogout();
});

// Load admin info
function loadAdminInfo() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const adminName = document.getElementById('adminName');
    const adminAvatar = document.getElementById('adminAvatar');
    
    if (adminName) adminName.textContent = user.full_name || 'Admin';
    if (adminAvatar) {
        adminAvatar.src = `https://ui-avatars.com/api/?background=ff0055&color=fff&rounded=true&name=${encodeURIComponent(user.full_name || 'Admin')}`;
    }
}

// Load staff list
async function loadStaffList() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '../../auth/html/admin-login.html';
            return;
        }
        
        const response = await fetch('http://localhost:5000/api/admin/staff', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Không thể tải danh sách');
        
        staffList = await response.json();
        renderStaffTable();
        
    } catch (error) {
        console.error('Lỗi tải staff:', error);
        if (staffTableBody) {
            staffTableBody.innerHTML = '<tr><td colspan="9" class="loading">Không thể tải dữ liệu</td></tr>';
        }
    }
}

// Render staff table
function renderStaffTable() {
    if (!staffTableBody) return;
    
    const searchTerm = searchInput?.value.toLowerCase() || '';
    const filtered = staffList.filter(staff => 
        staff.full_name.toLowerCase().includes(searchTerm) ||
        staff.email.toLowerCase().includes(searchTerm) ||
        (staff.phone && staff.phone.includes(searchTerm))
    );
    
    if (filtered.length === 0) {
        staffTableBody.innerHTML = '<tr><td colspan="9" class="loading">Không tìm thấy nhân viên</td></tr>';
        return;
    }
    
    staffTableBody.innerHTML = filtered.map(staff => `
        <tr>
            <td>${staff.user_id}</td>
            <td><img class="avatar-small" src="https://ui-avatars.com/api/?background=3498db&color=fff&name=${encodeURIComponent(staff.full_name)}" alt="Avatar"></td>
            <td>${escapeHtml(staff.full_name)}</td>
            <td>${escapeHtml(staff.email)}</td>
            <td>${staff.phone || '---'}</td>
            <td>${staff.position || 'Nhân viên'}</td>
            <td>${new Date(staff.created_at).toLocaleDateString('vi-VN')}</td>
            <td><span class="status-badge status-${staff.is_active ? 'active' : 'inactive'}">${staff.is_active ? 'Hoạt động' : 'Vô hiệu hóa'}</span></td>
            <td>
                <div class="action-btns">
                    <button class="action-btn btn-edit" onclick="editStaff(${staff.user_id})"><i class="fas fa-edit"></i></button>
                    ${staff.is_active ? 
                        `<button class="action-btn btn-deactivate" onclick="confirmDeactivateStaff(${staff.user_id}, '${escapeHtml(staff.full_name)}')"><i class="fas fa-ban"></i> Vô hiệu</button>` :
                        `<button class="action-btn btn-activate" onclick="confirmActivateStaff(${staff.user_id}, '${escapeHtml(staff.full_name)}')"><i class="fas fa-check-circle"></i> Kích hoạt</button>`
                    }
                </div>
            </td>
        </tr>
    `).join('');
}

// Edit staff
window.editStaff = async function(staffId) {
    const staff = staffList.find(s => s.user_id === staffId);
    if (!staff) return;
    
    editingStaffId = staffId;
    modalTitle.textContent = 'Sửa thông tin nhân viên';
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/admin/staff/${staffId}/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const profile = await response.json();
        
        fullNameInput.value = staff.full_name;
        emailInput.value = staff.email;
        phoneInput.value = staff.phone || '';
        dateOfBirthInput.value = profile.date_of_birth?.split('T')[0] || '';
        identityNumberInput.value = profile.identity_number || '';
        addressInput.value = profile.address || '';
        bankAccountInput.value = profile.bank_account || '';
        bankNameInput.value = profile.bank_name || '';
        bankBranchInput.value = profile.bank_branch || '';
        positionSelect.value = profile.position || 'Nhân viên phục vụ';
        salaryInput.value = profile.salary || 0;
        hireDateInput.value = profile.hire_date?.split('T')[0] || new Date().toISOString().split('T')[0];
        emergencyContactNameInput.value = profile.emergency_contact_name || '';
        emergencyContactPhoneInput.value = profile.emergency_contact_phone || '';
        notesInput.value = profile.notes || '';
        passwordInput.value = '';
        passwordInput.placeholder = 'Nhập mật khẩu mới (nếu muốn đổi)';
        isActiveSelect.value = staff.is_active ? '1' : '0';
        
    } catch (error) {
        console.error('Lỗi tải profile:', error);
    }
    
    staffModal.classList.remove('hidden');
};

// Confirm deactivate
window.confirmDeactivateStaff = function(staffId, staffName) {
    deleteTargetId = staffId;
    deleteAction = 'deactivate';
    
    const modalIcon = document.getElementById('modalIcon');
    const modalTitleConfirm = document.getElementById('modalTitleConfirm');
    const confirmBtn = document.getElementById('deleteConfirmBtn');
    
    if (modalIcon) {
        modalIcon.className = 'modal-icon deactivate';
        modalIcon.innerHTML = '<i class="fas fa-ban"></i>';
    }
    if (modalTitleConfirm) modalTitleConfirm.textContent = 'Xác nhận vô hiệu hóa';
    if (confirmBtn) {
        confirmBtn.className = 'btn-confirm-action deactivate';
        confirmBtn.textContent = 'Vô hiệu hóa';
    }
    
    deleteMessage.textContent = `Bạn có chắc chắn muốn vô hiệu hóa nhân viên "${staffName}"? Nhân viên sẽ không thể đăng nhập được.`;
    deleteModal.classList.remove('hidden');
};

// Confirm activate
window.confirmActivateStaff = function(staffId, staffName) {
    deleteTargetId = staffId;
    deleteAction = 'activate';
    
    const modalIcon = document.getElementById('modalIcon');
    const modalTitleConfirm = document.getElementById('modalTitleConfirm');
    const confirmBtn = document.getElementById('deleteConfirmBtn');
    
    if (modalIcon) {
        modalIcon.className = 'modal-icon activate';
        modalIcon.innerHTML = '<i class="fas fa-check-circle"></i>';
    }
    if (modalTitleConfirm) modalTitleConfirm.textContent = 'Xác nhận kích hoạt';
    if (confirmBtn) {
        confirmBtn.className = 'btn-confirm-action activate';
        confirmBtn.textContent = 'Kích hoạt';
    }
    
    deleteMessage.textContent = `Bạn có chắc chắn muốn kích hoạt lại nhân viên "${staffName}"? Nhân viên sẽ có thể đăng nhập lại.`;
    deleteModal.classList.remove('hidden');
};

// Save staff (add/edit)
async function saveStaff() {
    const fullName = fullNameInput.value.trim();
    const email = emailInput.value.trim();
    const phone = phoneInput.value.trim();
    const password = passwordInput.value;
    const isActive = isActiveSelect.value === '1';
    
    if (!fullName || !email || !phone) {
        alert('Vui lòng nhập đầy đủ thông tin bắt buộc');
        return;
    }
    
    if (!isValidEmail(email)) {
        alert('Email không hợp lệ');
        return;
    }
    
    if (!isValidPhone(phone)) {
        alert('Số điện thoại không hợp lệ');
        return;
    }
    
    const staffData = {
        full_name: fullName,
        email: email,
        phone: phone,
        role: 'staff',
        is_active: isActive,
        profile: {
            date_of_birth: dateOfBirthInput.value || null,
            identity_number: identityNumberInput.value || null,
            address: addressInput.value || null,
            bank_account: bankAccountInput.value || null,
            bank_name: bankNameInput.value || null,
            bank_branch: bankBranchInput.value || null,
            position: positionSelect.value,
            salary: parseFloat(salaryInput.value) || 0,
            hire_date: hireDateInput.value || new Date().toISOString().split('T')[0],
            emergency_contact_name: emergencyContactNameInput.value || null,
            emergency_contact_phone: emergencyContactPhoneInput.value || null,
            notes: notesInput.value || null
        }
    };
    
    if (password) {
        staffData.password = password;
    }
    
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Vui lòng đăng nhập lại');
            window.location.href = '../../auth/html/admin-login.html';
            return;
        }
        
        const url = editingStaffId 
            ? `http://localhost:5000/api/admin/staff/${editingStaffId}`
            : 'http://localhost:5000/api/admin/staff';
        const method = editingStaffId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(staffData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Lưu thất bại');
        }
        
        alert(editingStaffId ? 'Cập nhật thành công' : 'Thêm nhân viên thành công');
        closeStaffModal();
        loadStaffList();
        
    } catch (error) {
        console.error('Save error:', error);
        alert(error.message);
    }
}

// Toggle staff status (deactivate/activate)
async function toggleStaffStatus() {
    if (!deleteTargetId) return;
    
    const isActive = (deleteAction === 'activate');
    const actionText = isActive ? 'kích hoạt' : 'vô hiệu hóa';
    
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Vui lòng đăng nhập lại');
            window.location.href = '../../auth/html/admin-login.html';
            return;
        }
        
        const response = await fetch(`http://localhost:5000/api/admin/staff/${deleteTargetId}/toggle-status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ is_active: isActive })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification(`${actionText.charAt(0).toUpperCase() + actionText.slice(1)} nhân viên thành công!`, isActive ? 'success' : 'warning');
            closeDeleteModal();
            loadStaffList();
        } else {
            throw new Error(data.message || `${actionText} thất bại`);
        }
        
    } catch (error) {
        console.error('Toggle status error:', error);
        showNotification(error.message, 'error');
    }
}

// Show notification with color
function showNotification(message, type = 'success') {
    let notification = document.querySelector('.custom-notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'custom-notification';
        document.body.appendChild(notification);
        
        const style = document.createElement('style');
        style.textContent = `
            .custom-notification {
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
            .custom-notification.success { background: #10B981; }
            .custom-notification.error { background: #EF4444; }
            .custom-notification.warning { background: #F59E0B; }
            .custom-notification.info { background: #3B82F6; }
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
    
    let icon = '';
    switch(type) {
        case 'success': icon = '<i class="fas fa-check-circle"></i>';
        case 'error': icon = '<i class="fas fa-exclamation-circle"></i>';
        case 'warning': icon = '<i class="fas fa-exclamation-triangle"></i>';
        default: icon = '<i class="fas fa-info-circle"></i>';
    }
    
    notification.className = `custom-notification ${type}`;
    notification.innerHTML = `${icon} ${message}`;
    notification.style.display = 'flex';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Close modals
function closeStaffModal() {
    staffModal.classList.add('hidden');
    editingStaffId = null;
    staffForm.reset();
    passwordInput.placeholder = 'Nhập mật khẩu';
    hireDateInput.value = new Date().toISOString().split('T')[0];
}

function closeDeleteModal() {
    deleteModal.classList.add('hidden');
    deleteTargetId = null;
    deleteAction = 'deactivate';
}

// Helper functions
function isValidEmail(email) {
    const re = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;
    return re.test(email);
}

function isValidPhone(phone) {
    const re = /^[0-9]{10,11}$/;
    return re.test(phone);
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

// Event listeners
function initEventListeners() {
    if (searchInput) {
        searchInput.addEventListener('input', () => renderStaffTable());
    }
    
    if (addStaffBtn) {
        addStaffBtn.addEventListener('click', () => {
            editingStaffId = null;
            modalTitle.textContent = 'Thêm nhân viên mới';
            staffForm.reset();
            passwordInput.placeholder = 'Nhập mật khẩu';
            hireDateInput.value = new Date().toISOString().split('T')[0];
            staffModal.classList.remove('hidden');
        });
    }
    
    if (saveStaffBtn) saveStaffBtn.addEventListener('click', saveStaff);
    if (cancelModalBtn) cancelModalBtn.addEventListener('click', closeStaffModal);
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeStaffModal);
    if (deleteCancelBtn) deleteCancelBtn.addEventListener('click', closeDeleteModal);
    if (deleteConfirmBtn) deleteConfirmBtn.addEventListener('click', toggleStaffStatus);
}

// Logout
function initLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = '../../auth/html/admin-login.html';
        });
    }
}