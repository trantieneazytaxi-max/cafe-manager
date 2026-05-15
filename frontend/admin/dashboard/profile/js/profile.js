/**
 * ADMIN PROFILE PAGE JS
 * Cyberpunk & Reverie Theme
 */

document.addEventListener('DOMContentLoaded', () => {
    // Check auth
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token || (user.role !== 'admin' && user.role !== 'staff')) {
        window.location.href = '/admin/login';
        return;
    }

    initProfile();
    initEventListeners();
});

// DOM Elements
const profileAvatar = document.getElementById('profileAvatar');
const displayFullName = document.getElementById('displayFullName');
const displayRole = document.getElementById('displayRole');
const emailEl = document.getElementById('email');
const phoneEl = document.getElementById('phone');
const joinedDateEl = document.getElementById('joinedDate');

const staffPosition = document.getElementById('staffPosition');
const staffSalary = document.getElementById('staffSalary');
const staffHireDate = document.getElementById('staffHireDate');
const staffIdentity = document.getElementById('staffIdentity');
const staffBankAcc = document.getElementById('staffBankAcc');
const staffBankName = document.getElementById('staffBankName');

const avatarUpload = document.getElementById('avatarUpload');

let currentUser = null;

async function initProfile() {
    // Load basic from local first
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    currentUser = user;
    
    updateUI(user);
    
    // Fetch full details from API
    try {
        const data = await get('/customer/profile');
        if (data) {
            currentUser = { ...currentUser, ...data };
            updateUI(currentUser);
        }
    } catch (e) {
        console.error('Lỗi tải hồ sơ:', e);
    }
}

function updateUI(user) {
    if (displayFullName) displayFullName.textContent = user.full_name || 'Admin';
    if (displayRole) displayRole.textContent = user.role === 'admin' ? 'Quản trị viên' : 'Nhân viên';
    if (emailEl) emailEl.textContent = user.email || '--';
    if (phoneEl) phoneEl.textContent = user.phone || '--';
    if (joinedDateEl) joinedDateEl.textContent = user.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : '--';
    
    if (profileAvatar) {
        profileAvatar.src = user.avatar_url || `https://ui-avatars.com/api/?background=00f3ff&color=000&rounded=true&size=150&name=${encodeURIComponent(user.full_name || 'A')}`;
    }

    // Staff details
    if (staffPosition) staffPosition.textContent = user.position || 'Chưa cập nhật';
    if (staffSalary) staffSalary.textContent = user.salary ? formatCurrency(user.salary) : 'Chưa cập nhật';
    if (staffHireDate) staffHireDate.textContent = user.hire_date ? new Date(user.hire_date).toLocaleDateString('vi-VN') : 'Chưa cập nhật';
    if (staffIdentity) staffIdentity.textContent = user.identity_number || 'Chưa cập nhật';
    if (staffBankAcc) staffBankAcc.textContent = user.bank_account || 'Chưa cập nhật';
    if (staffBankName) staffBankName.textContent = user.bank_name || 'Chưa cập nhật';
}

function initEventListeners() {
    // Avatar upload
    document.getElementById('changeAvatarBtn').addEventListener('click', () => avatarUpload.click());
    // Modals
    document.getElementById('closeEditModal').addEventListener('click', () => {
        const modal = document.getElementById('editModal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.add('hidden');
            modal.classList.remove('active');
        }
    });
    document.getElementById('cancelEditBtn').addEventListener('click', () => {
        const modal = document.getElementById('editModal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.add('hidden');
            modal.classList.remove('active');
        }
    });
    
    document.getElementById('closePasswordModal').addEventListener('click', () => {
        const modal = document.getElementById('passwordModal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.add('hidden');
            modal.classList.remove('active');
        }
    });
    document.getElementById('cancelPasswordBtn').addEventListener('click', () => {
        const modal = document.getElementById('passwordModal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.add('hidden');
            modal.classList.remove('active');
        }
    });

    // Forms
    document.getElementById('editProfileForm').addEventListener('submit', handleProfileUpdate);
    document.getElementById('changePasswordForm').addEventListener('submit', handlePasswordUpdate);
}

// Global functions for inline onclick
window.openEditModal = function() {
    const modal = document.getElementById('editModal');
    if (!modal) return;
    
    if (currentUser) {
        document.getElementById('editFullName').value = currentUser.full_name || '';
        document.getElementById('editPhone').value = currentUser.phone || '';
        document.getElementById('editPosition').value = currentUser.position || '';
        document.getElementById('editSalary').value = currentUser.salary || '';
        document.getElementById('editIdentity').value = currentUser.identity_number || '';
        document.getElementById('editBankAcc').value = currentUser.bank_account || '';
        document.getElementById('editBankName').value = currentUser.bank_name || '';
        
        if (currentUser.hire_date) {
            document.getElementById('editHireDate').value = currentUser.hire_date.split('T')[0];
        }
    }
    
    modal.classList.remove('hidden');
    modal.classList.add('active');
    modal.style.display = 'flex';
};

window.openPasswordModal = function() {
    const modal = document.getElementById('passwordModal');
    if (!modal) return;
    
    if (currentUser) {
        const userHidden = document.getElementById('username_hidden');
        if (userHidden) userHidden.value = currentUser.email || '';
    }
    
    modal.classList.remove('hidden');
    modal.classList.add('active');
    modal.style.display = 'flex';
};

async function handleAvatarChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
        const base64 = event.target.result;
        profileAvatar.src = base64;
        
        try {
            await put('/customer/profile', { avatar_url: base64 });
            currentUser.avatar_url = base64;
            
            // Lưu vào localStorage nhưng bỏ bớt avatar_url để tránh đầy bộ nhớ (quota exceeded)
            const storageUser = { ...currentUser };
            delete storageUser.avatar_url; 
            localStorage.setItem('user', JSON.stringify(storageUser));
            
            showGlobalToast('Cập nhật ảnh đại diện thành công', 'success');
        } catch (e) {
            showGlobalToast('Lỗi cập nhật ảnh đại diện', 'error');
        }
    };
    reader.readAsDataURL(file);
}

async function handleProfileUpdate(e) {
    e.preventDefault();
    const payload = {
        full_name: document.getElementById('editFullName').value,
        phone: document.getElementById('editPhone').value,
        position: document.getElementById('editPosition').value,
        salary: document.getElementById('editSalary').value,
        hire_date: document.getElementById('editHireDate').value,
        identity_number: document.getElementById('editIdentity').value,
        bank_account: document.getElementById('editBankAcc').value,
        bank_name: document.getElementById('editBankName').value
    };

    try {
        await put('/customer/profile', payload);
        currentUser = { ...currentUser, ...payload };
        
        // Tránh lưu avatar_url Base64 vào localStorage
        const storageUser = { ...currentUser };
        delete storageUser.avatar_url;
        localStorage.setItem('user', JSON.stringify(storageUser));
        
        updateUI(currentUser);
        const modal = document.getElementById('editModal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.add('hidden');
            modal.classList.remove('active');
        }
        showGlobalToast('Cập nhật thông tin thành công', 'success');
    } catch (e) {
        showGlobalToast('Cập nhật thất bại', 'error');
    }
}

async function handlePasswordUpdate(e) {
    e.preventDefault();
    const current = document.getElementById('currentPassword').value;
    const newPass = document.getElementById('newPassword').value;
    const confirm = document.getElementById('confirmPassword').value;

    if (newPass !== confirm) {
        showGlobalToast('Mật khẩu xác nhận không khớp', 'error');
        return;
    }

    try {
        // TODO: Password update API
        showGlobalToast('Đã gửi yêu cầu đổi mật khẩu', 'success');
        const modal = document.getElementById('passwordModal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.add('hidden');
            modal.classList.remove('active');
        }
    } catch (e) {
        showGlobalToast('Đổi mật khẩu thất bại', 'error');
    }
}
