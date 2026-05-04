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
        window.location.href = '../../../auth/html/auth.html';
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
    
    fullNameEl.textContent = user.full_name || 'Chưa cập nhật';
    emailEl.textContent = user.email || 'Chưa cập nhật';
    phoneEl.textContent = user.phone || 'Chưa cập nhật';
    joinedDateEl.textContent = user.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : 'Chưa có dữ liệu';
    const roleNames = {
        'admin': 'Quản trị viên',
        'staff': 'Nhân viên',
        'customer': 'Khách hàng'
    };
    roleEl.textContent = roleNames[user.role] || 'Người dùng';
    
    // Update avatar
    const savedAvatar = localStorage.getItem('userAvatar');
    if (savedAvatar) {
        profileAvatar.src = savedAvatar;
        avatarImg.src = savedAvatar;
    } else {
        const avatarUrl = `https://ui-avatars.com/api/?background=E67E22&color=fff&rounded=true&size=128&name=${encodeURIComponent(user.full_name || 'User')}`;
        profileAvatar.src = avatarUrl;
        avatarImg.src = avatarUrl;
    }
    
    // Update short name on navbar
    const shortName = user.full_name ? user.full_name.split(' ').pop() : 'User';
    userNameShort.textContent = shortName;

    // Load extra info from API
    fetchProfileDetails();
}

async function fetchProfileDetails() {
    try {
        const data = await get('/customer/profile');
        if (data) {
            currentUser = { ...currentUser, ...data };
            deliveryAddressInput.value = data.delivery_address || '';
            autoFillAddressCheckbox.checked = data.auto_fill_address !== 0;
            currentLat = data.delivery_lat;
            currentLng = data.delivery_lng;
            
            if (deliveryMap && currentLat && currentLng) {
                const pos = [currentLat, currentLng];
                deliveryMap.setView(pos, 16);
                deliveryMarker.setLatLng(pos);
            }
        }
    } catch (e) {
        console.error('Error fetching profile details:', e);
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
            profileAvatar.src = avatarUrl;
            if (avatarImg) avatarImg.src = avatarUrl;
            localStorage.setItem('userAvatar', avatarUrl);
            
            // Lưu lên server
            updateAvatarOnServer(avatarUrl);
        };
        reader.readAsDataURL(file);
    }
});

async function updateAvatarOnServer(avatarUrl) {
    try {
        await put('/customer/profile', { avatar_url: avatarUrl });
        
        // Cập nhật object user trong localStorage
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        user.avatar_url = avatarUrl;
        localStorage.setItem('user', JSON.stringify(user));
        
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
        // TODO: Gọi API cập nhật thông tin
        // const response = await fetch('http://localhost:5000/api/user/profile', {
        //     method: 'PUT',
        //     headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        //     body: JSON.stringify({ full_name: newFullName, phone: newPhone })
        // });
        
        // Cập nhật local
        currentUser.full_name = newFullName;
        currentUser.phone = newPhone;
        localStorage.setItem('user', JSON.stringify(currentUser));
        
        fullNameEl.textContent = newFullName;
        phoneEl.textContent = newPhone;
        
        // Cập nhật avatar với tên mới
        const newAvatarUrl = `https://ui-avatars.com/api/?background=E67E22&color=fff&rounded=true&size=128&name=${encodeURIComponent(newFullName)}`;
        if (!localStorage.getItem('userAvatar')) {
            profileAvatar.src = newAvatarUrl;
            avatarImg.src = newAvatarUrl;
        }
        
        // Cập nhật tên hiển thị trên navbar
        const shortName = newFullName.split(' ').pop();
        userNameShort.textContent = shortName;
        
        showToast('Cập nhật thông tin thành công', 'success');
        closeEditModalFunc();
    } catch (error) {
        console.error('Update profile error:', error);
        showToast('Cập nhật thất bại', 'error');
    }
}

// Change password
function openPasswordModal() {
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
        // const response = await fetch('http://localhost:5000/api/user/change-password', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        //     body: JSON.stringify({ current_password: current, new_password: newPass })
        // });
        
        showToast('Đổi mật khẩu thành công', 'success');
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
    if (saveEditBtn) saveEditBtn.addEventListener('click', saveProfile);
    if (closePasswordModal) closePasswordModal.addEventListener('click', closePasswordModalFunc);
    if (cancelPasswordBtn) cancelPasswordBtn.addEventListener('click', closePasswordModalFunc);
    if (savePasswordBtn) savePasswordBtn.addEventListener('click', changePassword);
    
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
