/**
 * STAFF LOGIN PAGE - CAFE MANAGEMENT
 */

// DOM Elements
const loginForm = document.getElementById('loginForm');
const toast = document.getElementById('toast');

// Forgot Password Elements
const forgotPasswordBtn = document.getElementById('forgotPasswordBtn');
const forgotModal = document.getElementById('forgotModal');
const closeForgotModal = document.getElementById('closeForgotModal');
const cancelForgotBtn = document.getElementById('cancelForgotBtn');
const submitForgotBtn = document.getElementById('submitForgotBtn');
const forgotEmail = document.getElementById('forgotEmail');

// Handle login
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('rememberMe').checked;
        
        if (!email || !password) {
            showToast('Vui lòng nhập email và mật khẩu', 'error');
            return;
        }
        
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
        submitBtn.disabled = true;
        
        try {
            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                if (data.user.role !== 'staff') {
                    throw new Error('Tài khoản không có quyền Nhân viên');
                }
                
                if (rememberMe) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('role', data.user.role);
                    localStorage.setItem('user', JSON.stringify(data.user));
                } else {
                    sessionStorage.setItem('token', data.token);
                    sessionStorage.setItem('role', data.user.role);
                    sessionStorage.setItem('user', JSON.stringify(data.user));
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('role', data.user.role);
                    localStorage.setItem('user', JSON.stringify(data.user));
                }
                
                showToast(`Chào mừng Nhân viên ${data.user.full_name}!`, 'success');
                
                setTimeout(() => {
                    window.location.href = '../../dashboard/html/staff-dashboard.html';
                }, 1000);
            } else {
                // 🆕 Xử lý lỗi 403 (tài khoản bị vô hiệu hóa)
                if (response.status === 403) {
                    showToast(data.message || 'Tài khoản của bạn đã bị vô hiệu hóa! Vui lòng liên hệ quản trị viên.', 'error');
                } else {
                    throw new Error(data.message || 'Đăng nhập thất bại');
                }
            }
        } catch (error) {
            console.error('Login error:', error);
            showToast(error.message, 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

// ========== FORGOT PASSWORD ==========
if (forgotPasswordBtn) {
    forgotPasswordBtn.addEventListener('click', (e) => {
        e.preventDefault();
        forgotModal.classList.remove('hidden');
    });
}

if (closeForgotModal) {
    closeForgotModal.addEventListener('click', () => {
        forgotModal.classList.add('hidden');
        forgotEmail.value = '';
    });
}

if (cancelForgotBtn) {
    cancelForgotBtn.addEventListener('click', () => {
        forgotModal.classList.add('hidden');
        forgotEmail.value = '';
    });
}

if (submitForgotBtn) {
    submitForgotBtn.addEventListener('click', async () => {
        const email = forgotEmail.value.trim();
        
        if (!email) {
            showToast('Vui lòng nhập email', 'error');
            return;
        }
        
        // Disable button
        submitForgotBtn.disabled = true;
        submitForgotBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
        
        try {
            const response = await fetch('http://localhost:5000/api/forgot-password/request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                showToast(data.message, 'success');
                forgotModal.classList.add('hidden');
                forgotEmail.value = '';
            } else {
                showToast(data.message || 'Có lỗi xảy ra', 'error');
            }
        } catch (error) {
            console.error('Forgot password error:', error);
            showToast('Không thể gửi yêu cầu', 'error');
        } finally {
            submitForgotBtn.disabled = false;
            submitForgotBtn.innerHTML = 'Gửi yêu cầu';
        }
    });
}

// Click outside modal to close
if (forgotModal) {
    forgotModal.addEventListener('click', (e) => {
        if (e.target === forgotModal) {
            forgotModal.classList.add('hidden');
            forgotEmail.value = '';
        }
    });
}

// Toggle password visibility
document.querySelectorAll('.toggle-password').forEach(icon => {
    icon.addEventListener('click', () => {
        const targetId = icon.getAttribute('data-target');
        const input = document.getElementById(targetId);
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        }
    });
});

// Show toast
function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}