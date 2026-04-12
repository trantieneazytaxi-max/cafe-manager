/**
 * ADMIN PASSWORD REQUESTS - CAFE MANAGEMENT
 */

// State
let requests = [];
let currentRequest = null;

// DOM Elements
const requestsTableBody = document.getElementById('requestsTableBody');
const pendingCountEl = document.getElementById('pendingCount');
const expiringCountEl = document.getElementById('expiringCount');
const refreshBtn = document.getElementById('refreshBtn');
const resetModal = document.getElementById('resetModal');
const resetEmail = document.getElementById('resetEmail');
const newPassword = document.getElementById('newPassword');
const confirmPassword = document.getElementById('confirmPassword');
const closeResetModal = document.getElementById('closeResetModal');
const cancelResetBtn = document.getElementById('cancelResetBtn');
const confirmResetBtn = document.getElementById('confirmResetBtn');

// Check authentication
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    if (!token || role !== 'admin') {
        window.location.href = '../../auth/html/admin-login.html';
        return;
    }
    
    loadAdminInfo();
    loadRequests();
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

// Load requests
async function loadRequests() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/forgot-password/requests', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Không thể tải yêu cầu');
        
        requests = await response.json();
        updateStats();
        renderRequests();
        
    } catch (error) {
        console.error('Lỗi tải requests:', error);
        if (requestsTableBody) {
            requestsTableBody.innerHTML = '<td><td colspan="8" class="loading">Không thể tải dữ liệu</td></tr>';
        }
    }
}

// Update statistics
function updateStats() {
    const now = new Date();
    const pending = requests.length;
    const expiring = requests.filter(r => {
        const expiresAt = new Date(r.expires_at);
        const hoursLeft = (expiresAt - now) / (1000 * 60 * 60);
        return hoursLeft <= 24 && hoursLeft > 0;
    }).length;
    
    if (pendingCountEl) pendingCountEl.textContent = pending;
    if (expiringCountEl) expiringCountEl.textContent = expiring;
}

// Render requests table
function renderRequests() {
    if (!requestsTableBody) return;
    
    if (requests.length === 0) {
        requestsTableBody.innerHTML = '<tr><td colspan="8" class="loading">Không có yêu cầu nào</td></tr>';
        return;
    }
    
    requestsTableBody.innerHTML = requests.map(req => {
        const expiresAt = new Date(req.expires_at);
        const now = new Date();
        const isExpired = expiresAt < now;
        
        return `
            <tr>
                <td>${req.id}</td>
                <td>${escapeHtml(req.email)}</td>
                <td>${escapeHtml(req.full_name)}</td>
                <td>${req.role === 'staff' ? 'Nhân viên' : 'Quản trị viên'}</td>
                <td>${formatDateTime(req.created_at)}</td>
                <td>${formatDateTime(req.expires_at)}</td>
                <td>
                    <span class="status-badge ${isExpired ? 'status-expired' : 'status-pending'}">
                        ${isExpired ? 'Đã hết hạn' : 'Đang chờ'}
                    </span>
                </td>
                <td>
                    ${!isExpired ? `
                        <button class="action-btn btn-reset" onclick="openResetModal(${req.id}, '${escapeHtml(req.email)}')">
                            <i class="fas fa-key"></i>
                        </button>
                    ` : ''}
                </td>
            </tr>
        `;
    }).join('');
}

// Open reset modal
window.openResetModal = function(requestId, email) {
    currentRequest = requests.find(r => r.id === requestId);
    if (!currentRequest) return;
    
    resetEmail.textContent = email;
    newPassword.value = '';
    confirmPassword.value = '';
    resetModal.classList.remove('hidden');
};

// Reset password
async function resetPassword() {
    const password = newPassword.value.trim();
    const confirm = confirmPassword.value.trim();
    
    if (!password) {
        alert('Vui lòng nhập mật khẩu mới');
        return;
    }
    
    if (password.length < 6) {
        alert('Mật khẩu phải có ít nhất 6 ký tự');
        return;
    }
    
    if (password !== confirm) {
        alert('Mật khẩu xác nhận không khớp');
        return;
    }
    
    confirmResetBtn.disabled = true;
    confirmResetBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/forgot-password/reset', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                token: currentRequest.token,
                email: currentRequest.email,
                new_password: password
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Đặt lại mật khẩu thành công! Email đã được gửi đến nhân viên.');
            resetModal.classList.add('hidden');
            loadRequests(); // Reload danh sách
        } else {
            alert(data.message || 'Có lỗi xảy ra');
        }
    } catch (error) {
        console.error('Reset error:', error);
        alert('Không thể đặt lại mật khẩu');
    } finally {
        confirmResetBtn.disabled = false;
        confirmResetBtn.innerHTML = 'Xác nhận đặt lại';
    }
}

// Close reset modal
function closeResetModalFunc() {
    resetModal.classList.add('hidden');
    currentRequest = null;
}

// Format functions
function formatDateTime(dateStr) {
    if (!dateStr) return '---';
    const date = new Date(dateStr);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
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
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadRequests);
    }
    
    if (closeResetModal) closeResetModal.addEventListener('click', closeResetModalFunc);
    if (cancelResetBtn) cancelResetBtn.addEventListener('click', closeResetModalFunc);
    if (confirmResetBtn) confirmResetBtn.addEventListener('click', resetPassword);
    
    // Click outside modal
    if (resetModal) {
        resetModal.addEventListener('click', (e) => {
            if (e.target === resetModal) closeResetModalFunc();
        });
    }
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