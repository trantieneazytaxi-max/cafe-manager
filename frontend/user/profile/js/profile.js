/**
 * PROFILE PAGE - CAFE MANAGEMENT
 * Hiển thị và chỉnh sửa thông tin cá nhân
 */

// DOM Elements
const profileAvatar = document.getElementById('profileAvatar');
const fullNameEl = document.getElementById('fullName');
const emailEl = document.getElementById('email');
const phoneEl = document.getElementById('phone');
const joinedDateEl = document.getElementById('joinedDate');
const roleEl = document.getElementById('role');
const editProfileBtn = document.getElementById('editProfileBtn');
const changePasswordBtn = document.getElementById('changePasswordBtn');
const changeAvatarBtn = document.getElementById('changeAvatarBtn');
const avatarUpload = document.getElementById('avatarUpload');
const profileBtn = document.getElementById('profileBtn');
const profileDropdown = document.getElementById('profileDropdown');
const userNameShort = document.getElementById('userNameShort');
const avatarImg = document.getElementById('avatarImg');
const deliveryAddressInput = document.getElementById('deliveryAddress');
const autoFillAddressCheckbox = document.getElementById('autoFillAddress');
const saveAddressBtn = document.getElementById('saveAddressBtn');

let deliveryMap = null;
let deliveryMarker = null;
let currentLat = null;
let currentLng = null;


// Modals
const editModal = document.getElementById('editModal');
const closeEditModal = document.getElementById('closeEditModal');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const saveEditBtn = document.getElementById('saveEditBtn');
const editFullName = document.getElementById('editFullName');
const editPhone = document.getElementById('editPhone');

const passwordModal = document.getElementById('passwordModal');
const closePasswordModal = document.getElementById('closePasswordModal');
const cancelPasswordBtn = document.getElementById('cancelPasswordBtn');
const savePasswordBtn = document.getElementById('savePasswordBtn');
const currentPassword = document.getElementById('currentPassword');
const newPassword = document.getElementById('newPassword');
const confirmPassword = document.getElementById('confirmPassword');

// User data
let currentUser = null;

// Check authentication
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../../../auth/html/user-login.html';
        return;
    }
    
    await initProfileMap(); // Init map first
    loadUserData();
    initEventListeners();
    updateNavbarCartCount();
});


async function initProfileMap() {
    const container = document.getElementById('deliveryMap');
    if (!container) return;

    // Default to HCM if no user coordinates
    const lat = currentLat || 10.7769;
    const lng = currentLng || 106.7009;

    const picker = await initLeafletPicker('deliveryMap', {
        center: [lat, lng],
        onSelect: (p) => {
            currentLat = p.lat;
            currentLng = p.lng;
            deliveryAddressInput.value = p.formattedAddress || `${p.lat.toFixed(6)}, ${p.lng.toFixed(6)}`;
        }
    });
    
    deliveryMap = picker.map;
    deliveryMarker = picker.marker;

    // Optional: Attach autocomplete if Mapbox token exists
    try {
        const storeRes = await fetch('http://localhost:5000/api/store');
        const storeData = await storeRes.json();
        if (storeData.mapboxAccessToken) {
            await loadMapboxPlaces(storeData.mapboxAccessToken);
            await attachPlacesAutocomplete(deliveryAddressInput, {
                onPlace: (p) => {
                    currentLat = p.lat;
                    currentLng = p.lng;
                    deliveryAddressInput.value = p.formattedAddress;
                    if (deliveryMap) {
                        deliveryMap.setView([p.lat, p.lng], 16);
                        deliveryMarker.setLatLng([p.lat, p.lng]);
                    }
                }
            });
        }
    } catch (e) {
        console.warn('Mapbox autocomplete not available:', e);
    }
}



// Load user data from localStorage and API
function loadUserData() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    currentUser = user;
    
    if (fullNameEl) fullNameEl.textContent = user.full_name || 'Chưa cập nhật';
    if (emailEl) emailEl.textContent = user.email || 'Chưa cập nhật';
    if (phoneEl) phoneEl.textContent = user.phone || 'Chưa cập nhật';
    if (joinedDateEl) joinedDateEl.textContent = user.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : 'Chưa có dữ liệu';
    
    const roleNames = {
        'admin': 'Quản trị viên',
        'staff': 'Nhân viên',
        'customer': 'Khách hàng'
    };
    if (roleEl) roleEl.textContent = roleNames[user.role] || 'Người dùng';
    
    // Update avatar (Không dùng userAvatar riêng biệt nữa để tránh đầy bộ nhớ)
    const avatarUrl = user.avatar_url || `https://ui-avatars.com/api/?background=E67E22&color=fff&rounded=true&size=128&name=${encodeURIComponent(user.full_name || 'User')}`;
    if (profileAvatar) profileAvatar.src = avatarUrl;
    if (avatarImg) avatarImg.src = avatarUrl;
    
    // Update short name on navbar
    const shortName = user.full_name ? user.full_name.split(' ').pop() : 'User';
    if (userNameShort) userNameShort.textContent = shortName;

    // Load extra info from API
    fetchProfileDetails();
}

async function fetchProfileDetails() {
    try {
        const data = await get('/customer/profile');
        if (data) {
            currentUser = { ...currentUser, ...data };
            
            // Cập nhật UI với dữ liệu mới từ API
            updateUIWithFetchedData(currentUser);
        }
    } catch (e) {
        console.error('Error fetching profile details:', e);
    }
}

function updateUIWithFetchedData(user) {
    if (fullNameEl) fullNameEl.textContent = user.full_name || 'Chưa cập nhật';
    if (emailEl) emailEl.textContent = user.email || '--';
    if (phoneEl) phoneEl.textContent = user.phone || '--';
    
    const avatarUrl = user.avatar_url || `https://ui-avatars.com/api/?background=E67E22&color=fff&rounded=true&size=128&name=${encodeURIComponent(user.full_name || 'User')}`;
    if (profileAvatar) profileAvatar.src = avatarUrl;
    if (avatarImg) avatarImg.src = avatarUrl;

    const deliverySection = document.getElementById('deliveryAddressSection');
    const staffSection = document.getElementById('staffInfoSection');

    // Hiển thị section theo Role
    if (user.role === 'customer') {
        if (deliverySection) deliverySection.classList.remove('hidden');
        if (staffSection) staffSection.classList.add('hidden');
        
        if (deliveryAddressInput) deliveryAddressInput.value = user.delivery_address || '';
        if (autoFillAddressCheckbox) autoFillAddressCheckbox.checked = user.auto_fill_address !== 0;
        currentLat = user.delivery_lat;
        currentLng = user.delivery_lng;
        
        if (deliveryMap && currentLat && currentLng) {
            const pos = [currentLat, currentLng];
            deliveryMap.setView(pos, 16);
            deliveryMarker.setLatLng(pos);
        }
    } else {
        // Admin hoặc Staff
        if (deliverySection) deliverySection.classList.add('hidden');
        if (staffSection) staffSection.classList.remove('hidden');

        const posEl = document.getElementById('staffPosition');
        const salEl = document.getElementById('staffSalary');
        const hireEl = document.getElementById('staffHireDate');
        const idEl = document.getElementById('staffIdentity');
        const accEl = document.getElementById('staffBankAcc');
        const bankEl = document.getElementById('staffBankName');

        if (posEl) posEl.textContent = user.position || 'Chưa cập nhật';
        if (salEl) salEl.textContent = user.salary ? formatCurrency(user.salary) : 'Chưa cập nhật';
        if (hireEl) hireEl.textContent = user.hire_date ? new Date(user.hire_date).toLocaleDateString('vi-VN') : 'Chưa cập nhật';
        if (idEl) idEl.textContent = user.identity_number || 'Chưa cập nhật';
        if (accEl) accEl.textContent = user.bank_account || 'Chưa cập nhật';
        if (bankEl) bankEl.textContent = user.bank_name || 'Chưa cập nhật';
    }
}

async function saveDeliveryAddress() {
    if (!currentLat || !currentLng) {
        showToast('Vui lòng chọn vị trí trên bản đồ', 'error');
        return;
    }

    try {
        saveAddressBtn.disabled = true;
        saveAddressBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        
        await put('/customer/profile/address', {
            delivery_address: deliveryAddressInput.value,
            delivery_lat: currentLat,
            delivery_lng: currentLng,
            auto_fill_address: autoFillAddressCheckbox.checked
        });

        showToast('Đã lưu địa chỉ giao hàng mặc định', 'success');
    } catch (e) {
        showToast(e.message, 'error');
    } finally {
        saveAddressBtn.disabled = false;
        saveAddressBtn.textContent = 'Lưu địa chỉ';
    }
}


// Change avatar
function changeAvatar() {
    avatarUpload.click();
}

avatarUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const avatarUrl = event.target.result;
            
            // Cập nhật giao diện ngay lập tức
            if (profileAvatar) profileAvatar.src = avatarUrl;
            if (avatarImg) avatarImg.src = avatarUrl;
            
            // Lưu lên server
            updateAvatarOnServer(avatarUrl);
        };
        reader.readAsDataURL(file);
    }
});

async function updateAvatarOnServer(avatarUrl) {
    try {
        await put('/customer/profile', { avatar_url: avatarUrl });
        
        // Cập nhật object user trong localStorage (Bỏ avatar_url Base64 để tránh đầy bộ nhớ)
        currentUser.avatar_url = avatarUrl;
        const storageUser = { ...currentUser };
        delete storageUser.avatar_url;
        localStorage.setItem('user', JSON.stringify(storageUser));
        
        showToast('Đã lưu ảnh đại diện thành công', 'success');
    } catch (e) {
        console.error('Lỗi lưu avatar:', e);
        showToast('Không thể lưu ảnh lên máy chủ', 'error');
    }
}

// Edit profile
function openEditModal() {
    editFullName.value = currentUser.full_name || '';
    editPhone.value = currentUser.phone || '';
    editModal.classList.remove('hidden');
}

function closeEditModalFunc() {
    editModal.classList.add('hidden');
}

async function saveProfile() {
    const newFullName = editFullName.value.trim();
    const newPhone = editPhone.value.trim();
    
    if (!newFullName) {
        showToast('Vui lòng nhập họ và tên', 'error');
        return;
    }
    
    try {
        saveEditBtn.disabled = true;
        saveEditBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

        await put('/customer/profile', {
            full_name: newFullName,
            phone: newPhone
        });
        
        // Cập nhật local
        currentUser.full_name = newFullName;
        currentUser.phone = newPhone;
        
        const storageUser = { ...currentUser };
        delete storageUser.avatar_url;
        localStorage.setItem('user', JSON.stringify(storageUser));
        
        updateUIWithFetchedData(currentUser);
        
        // Cập nhật tên hiển thị trên navbar
        const shortName = newFullName.split(' ').pop();
        if (userNameShort) userNameShort.textContent = shortName;
        
        showToast('Cập nhật thông tin thành công', 'success');
        closeEditModalFunc();
    } catch (error) {
        console.error('Update profile error:', error);
        showToast(error.message || 'Cập nhật thất bại', 'error');
    } finally {
        saveEditBtn.disabled = false;
        saveEditBtn.textContent = 'Lưu thay đổi';
    }
}

// Change password
function openPasswordModal() {
    const usernameHidden = document.getElementById('username_hidden');
    if (usernameHidden) usernameHidden.value = currentUser.email || '';
    passwordModal.classList.remove('hidden');
}

function closePasswordModalFunc() {
    passwordModal.classList.add('hidden');
    currentPassword.value = '';
    newPassword.value = '';
    confirmPassword.value = '';
}

async function changePassword() {
    const current = currentPassword.value;
    const newPass = newPassword.value;
    const confirm = confirmPassword.value;
    
    if (!current || !newPass || !confirm) {
        showToast('Vui lòng nhập đầy đủ thông tin', 'error');
        return;
    }
    
    if (newPass.length < 6) {
        showToast('Mật khẩu mới phải có ít nhất 6 ký tự', 'error');
        return;
    }
    
    if (newPass !== confirm) {
        showToast('Mật khẩu xác nhận không khớp', 'error');
        return;
    }
    
    try {
        // TODO: Gọi API đổi mật khẩu
        showToast('Đã gửi yêu cầu đổi mật khẩu', 'success');
        closePasswordModalFunc();
    } catch (error) {
        console.error('Change password error:', error);
        showToast('Đổi mật khẩu thất bại', 'error');
    }
}



// Event listeners
function initEventListeners() {
    if (editProfileBtn) editProfileBtn.addEventListener('click', openEditModal);
    if (changePasswordBtn) changePasswordBtn.addEventListener('click', openPasswordModal);
    if (changeAvatarBtn) changeAvatarBtn.addEventListener('click', changeAvatar);
    if (closeEditModal) closeEditModal.addEventListener('click', closeEditModalFunc);
    if (cancelEditBtn) cancelEditBtn.addEventListener('click', closeEditModalFunc);
    
    const editProfileForm = document.getElementById('editProfileForm');
    const changePasswordForm = document.getElementById('changePasswordForm');

    if (editProfileForm) {
        editProfileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveProfile();
        });
    }

    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            changePassword();
        });
    }

    if (closePasswordModal) closePasswordModal.addEventListener('click', closePasswordModalFunc);
    if (cancelPasswordBtn) cancelPasswordBtn.addEventListener('click', closePasswordModalFunc);
    
    // Close modals when clicking outside
    if (editModal) {
        editModal.addEventListener('click', (e) => {
            if (e.target === editModal) closeEditModalFunc();
        });
    }
    if (passwordModal) {
        passwordModal.addEventListener('click', (e) => {
            if (e.target === passwordModal) closePasswordModalFunc();
        });
    }
    
    initLogout();
    if (saveAddressBtn) saveAddressBtn.addEventListener('click', saveDeliveryAddress);
}


// Update navbar cart count
function updateNavbarCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const cartCountSpan = document.getElementById('cartCount');
    if (cartCountSpan) {
        if (totalItems > 0) {
            cartCountSpan.textContent = totalItems;
            cartCountSpan.style.display = 'inline-block';
        } else {
            cartCountSpan.style.display = 'none';
        }
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
            .custom-toast.info { background: #3B82F6; }
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
