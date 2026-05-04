/**
 * STAFF PROFILE PAGE JS
 * Modern Theme
 */

document.addEventListener('DOMContentLoaded', () => {
    // Check auth
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token || user.role !== 'staff') {
        window.location.href = '../../../../auth/html/auth.html';
        return;
    }

    initProfile();
    initEventListeners();
});

// DOM Elements
const profileAvatar = document.getElementById('profileAvatar');
const navAvatar = document.getElementById('navAvatar');
const fullNameEl = document.getElementById('fullName');
const navName = document.getElementById('navName');
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
const editModal = document.getElementById('editModal');

let currentUser = null;

async function initProfile() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    currentUser = user;
    
    updateUI(user);
    
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
    if (fullNameEl) fullNameEl.textContent = user.full_name || 'Nhân viên';
    if (navName) navName.textContent = user.full_name ? user.full_name.split(' ').pop() : 'Nhân viên';
    if (emailEl) emailEl.textContent = user.email || '--';
    if (phoneEl) phoneEl.textContent = user.phone || '--';
    if (joinedDateEl) joinedDateEl.textContent = user.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : '--';
    
    const avatarUrl = user.avatar_url || `https://ui-avatars.com/api/?background=00f3ff&color=000&rounded=true&size=150&name=${encodeURIComponent(user.full_name || 'S')}`;
    if (profileAvatar) profileAvatar.src = avatarUrl;
    if (navAvatar) navAvatar.src = avatarUrl;

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
    avatarUpload.addEventListener('change', handleAvatarChange);

    document.getElementById('editProfileBtn').addEventListener('click', () => {
        document.getElementById('editFullName').value = currentUser.full_name || '';
        document.getElementById('editPhone').value = currentUser.phone || '';
        editModal.classList.remove('hidden');
    });

    document.getElementById('closeEditModal').addEventListener('click', () => editModal.classList.add('hidden'));
    document.getElementById('cancelEditBtn').addEventListener('click', () => editModal.classList.add('hidden'));

    // Password Modals
    const passwordModal = document.getElementById('passwordModal');
    document.getElementById('changePasswordBtn').addEventListener('click', () => passwordModal.classList.remove('hidden'));
    document.getElementById('closePasswordModal').addEventListener('click', () => passwordModal.classList.add('hidden'));
    document.getElementById('cancelPasswordBtn').addEventListener('click', () => passwordModal.classList.add('hidden'));

    // Form submission
    document.getElementById('editProfileForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const newName = document.getElementById('editFullName').value;
        const newPhone = document.getElementById('editPhone').value;

        try {
            await put('/customer/profile', { full_name: newName, phone: newPhone });
            currentUser.full_name = newName;
            currentUser.phone = newPhone;
            
            const storageUser = { ...currentUser };
            delete storageUser.avatar_url;
            localStorage.setItem('user', JSON.stringify(storageUser));

            updateUI(currentUser);
            editModal.classList.add('hidden');
            showGlobalToast('Cập nhật thành công', 'success');
        } catch (e) {
            showGlobalToast('Cập nhật thất bại', 'error');
        }
    });

    document.getElementById('changePasswordForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const newPass = document.getElementById('newPassword').value;
        const confirm = document.getElementById('confirmPassword').value;

        if (newPass !== confirm) {
            showGlobalToast('Mật khẩu xác nhận không khớp', 'error');
            return;
        }

        try {
            // TODO: Password update API
            showGlobalToast('Đã gửi yêu cầu đổi mật khẩu', 'success');
            passwordModal.classList.add('hidden');
        } catch (err) {
            showGlobalToast('Lỗi đổi mật khẩu', 'error');
        }
    });

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.clear();
            window.location.href = '../../../../auth/html/auth.html';
        });
    }

    // User Menu Toggle (Match Dashboard)
    const userInfo = document.querySelector('.user-info');
    const userMenu = document.querySelector('.user-menu');
    if (userInfo) {
        userInfo.addEventListener('click', (e) => {
            e.stopPropagation();
            userMenu.classList.toggle('active');
        });
    }
    document.addEventListener('click', () => {
        if (userMenu) userMenu.classList.remove('active');
    });

    // Mobile Menu Toggle
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }
}

async function handleAvatarChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
        const base64 = event.target.result;
        profileAvatar.src = base64;
        if (navAvatar) navAvatar.src = base64;
        
        try {
            await put('/customer/profile', { avatar_url: base64 });
            currentUser.avatar_url = base64;
            
            // Tránh lưu avatar Base64 vào localStorage gây đầy bộ nhớ
            const storageUser = { ...currentUser };
            delete storageUser.avatar_url;
            localStorage.setItem('user', JSON.stringify(storageUser));
            
            showGlobalToast('Đã lưu ảnh đại diện', 'success');
        } catch (e) {
            showGlobalToast('Lỗi lưu ảnh', 'error');
        }
    };
    reader.readAsDataURL(file);
}
