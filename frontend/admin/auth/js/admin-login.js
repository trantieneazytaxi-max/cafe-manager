/**
 * ADMIN LOGIN PAGE - CAFE MANAGEMENT
 */

// DOM Elements
const loginForm = document.getElementById('loginForm');
const toast = document.getElementById('toast');

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
        
        // Disable button
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
        submitBtn.disabled = true;
        
        try {
            // Gọi API login
            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Kiểm tra role phải là admin
                if (data.user.role !== 'admin') {
                    throw new Error('Tài khoản không có quyền Admin');
                }
                
                // Lưu token
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
                
                showToast(`Chào mừng Admin ${data.user.full_name}!`, 'success');
                
                // Chuyển sang dashboard admin
                setTimeout(() => {
                    window.location.href = '../../dashboard/html/admin-dashboard.html';
                }, 1000);
            } else {
                throw new Error(data.message || 'Đăng nhập thất bại');
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

function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}