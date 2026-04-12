/**
 * ADMIN REGISTER PAGE - CAFE MANAGEMENT
 */

// DOM Elements
const registerForm = document.getElementById('registerForm');
const toast = document.getElementById('toast');

// Admin registration key (mã đăng ký admin cố định)
const ADMIN_REGISTRATION_KEY = 'ADMIN2026';

// Handle register
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const fullName = document.getElementById('fullName').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const adminKey = document.getElementById('adminKey').value;
        
        // Validation
        if (!fullName || !email || !phone || !password || !adminKey) {
            showToast('Vui lòng nhập đầy đủ thông tin', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            showToast('Mật khẩu xác nhận không khớp', 'error');
            return;
        }
        
        if (password.length < 6) {
            showToast('Mật khẩu phải có ít nhất 6 ký tự', 'error');
            return;
        }
        
        if (adminKey !== ADMIN_REGISTRATION_KEY) {
            showToast('Mã đăng ký Admin không đúng', 'error');
            return;
        }
        
        if (!isValidEmail(email)) {
            showToast('Email không hợp lệ', 'error');
            return;
        }
        
        if (!isValidPhone(phone)) {
            showToast('Số điện thoại không hợp lệ', 'error');
            return;
        }
        
        // Disable button
        const submitBtn = registerForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
        submitBtn.disabled = true;
        
        try {
            // Gọi API register admin
            const response = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    full_name: fullName,
                    email: email,
                    phone: phone,
                    password: password,
                    role: 'admin'
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                showToast('Đăng ký Admin thành công! Vui lòng đăng nhập', 'success');
                
                // Chuyển sang trang đăng nhập sau 1.5 giây
                setTimeout(() => {
                    window.location.href = 'admin-login.html';
                }, 1500);
            } else {
                throw new Error(data.message || 'Đăng ký thất bại');
            }
        } catch (error) {
            console.error('Register error:', error);
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

// Helper functions
function isValidEmail(email) {
    const re = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;
    return re.test(email);
}

function isValidPhone(phone) {
    const re = /^[0-9]{10,11}$/;
    return re.test(phone);
}

function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}