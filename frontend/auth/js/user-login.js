


// DOM Elements
const loginForm = document.getElementById('formLogin');
const registerForm = document.getElementById('formRegister');
const toast = document.getElementById('toast');
const forgotPasswordBtn = document.getElementById('forgotPasswordBtn');
const forgotModal = document.getElementById('forgotModal');
const closeModal = document.getElementById('closeModal');

// Tab switching
const tabBtns = document.querySelectorAll('.tab-btn');
const loginFormDiv = document.getElementById('loginForm');
const registerFormDiv = document.getElementById('registerForm');

// Biến lưu phương thức xác thực khi đăng ký
let selectedVerificationMethod = 'email';

// ========== LẤY DANH SÁCH TÀI KHOẢN TỪ LOCALSTORAGE ==========
function getAccounts() {
    const accounts = localStorage.getItem('userAccounts');
    if (accounts) {
        return JSON.parse(accounts);
    }
    // Tài khoản mặc định
    const defaultAccounts = {
        'admin@cafe.com': { password: 'admin123', role: 'admin', full_name: 'Quản trị viên' },
        'staff1@cafe.com': { password: 'staff123', role: 'staff', full_name: 'Nguyễn Thị Nhân Viên' },
        'staff2@cafe.com': { password: 'staff123', role: 'staff', full_name: 'Lê Văn Phục Vụ' }
    };
    localStorage.setItem('userAccounts', JSON.stringify(defaultAccounts));
    return defaultAccounts;
}

// ========== LƯU TÀI KHOẢN MỚI ==========
function saveAccount(email, password, fullName, role) {
    const accounts = getAccounts();
    accounts[email] = {
        password: password,
        role: role,
        full_name: fullName
    };
    localStorage.setItem('userAccounts', JSON.stringify(accounts));
}

// ========== DROPDOWN CHO ĐĂNG KÝ ==========
const registerMethodDropdown = document.getElementById('registerMethodDropdown');

if (registerMethodDropdown) {
    const dropdownSelected = registerMethodDropdown.querySelector('.dropdown-selected');
    const dropdownOptions = registerMethodDropdown.querySelectorAll('.dropdown-option');
    
    dropdownSelected.addEventListener('click', (e) => {
        e.stopPropagation();
        registerMethodDropdown.classList.toggle('open');
    });
    
    document.addEventListener('click', () => {
        registerMethodDropdown.classList.remove('open');
    });
    
    dropdownOptions.forEach(option => {
        option.addEventListener('click', () => {
            const method = option.getAttribute('data-method');
            selectedVerificationMethod = method;
            
            const selectedIcon = dropdownSelected.querySelector('i:first-child');
            const selectedText = dropdownSelected.querySelector('span');
            
            if (method === 'email') {
                selectedIcon.className = 'fas fa-envelope';
                selectedText.textContent = 'Xác thực qua Email';
            } else {
                selectedIcon.className = 'fas fa-phone-alt';
                selectedText.textContent = 'Xác thực qua SMS';
            }
            
            registerMethodDropdown.classList.remove('open');
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {    
    initTabSwitching();
    initPasswordToggle();
    initModalHandlers();
});

// Tab switching
function initTabSwitching() {
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.getAttribute('data-tab');
            
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            if (tab === 'login') {
                loginFormDiv.classList.add('active');
                registerFormDiv.classList.remove('active');
            } else {
                loginFormDiv.classList.remove('active');
                registerFormDiv.classList.add('active');
            }
        });
    });
}

// Toggle password visibility
function initPasswordToggle() {
    const toggleIcons = document.querySelectorAll('.toggle-password');
    
    toggleIcons.forEach(icon => {
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
}

// Modal handlers
function initModalHandlers() {
    if (forgotPasswordBtn) {
        forgotPasswordBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (forgotModal) {
                forgotModal.classList.remove('hidden');
            }
        });
    }
    
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            forgotModal.classList.add('hidden');
        });
    }
    
    if (forgotModal) {
        forgotModal.addEventListener('click', (e) => {
            if (e.target === forgotModal) {
                forgotModal.classList.add('hidden');
            }
        });
    }
    
    const forgotMethodBtns = document.querySelectorAll('.forgot-method-btn');
    forgotMethodBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const method = btn.getAttribute('data-method');
            forgotModal.classList.add('hidden');
            
            if (method === 'email') {
                window.location.href = '../../user/email-verification/html/email-verification.html';
            } else {
                window.location.href = '../../user/phone-number/html/phone-number.html';
            }
        });
    });
}

// Show toast message
function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

// Handle Login
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        const rememberMe = document.getElementById('rememberMe').checked;
        
        if (!email || !password) {
            showToast('Vui lòng nhập đầy đủ email và mật khẩu', 'error');
            return;
        }
        
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
        submitBtn.disabled = true;
        
        try {
            await mockLogin(email, password, rememberMe);
        } catch (error) {
            console.error('Login error:', error);
            showToast(error.message || 'Đăng nhập thất bại', 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

// Handle Register
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const fullName = document.getElementById('regFullName').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const phone = document.getElementById('regPhone').value.trim();
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('regConfirmPassword').value;
        
        if (!fullName || !email || !phone || !password) {
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
        
        if (!isValidEmail(email)) {
            showToast('Email không hợp lệ', 'error');
            return;
        }
        
        if (!isValidPhone(phone)) {
            showToast('Số điện thoại không hợp lệ', 'error');
            return;
        }
        
        const submitBtn = registerForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
        submitBtn.disabled = true;
        
        try {
            await mockRegister(fullName, email, phone, password, selectedVerificationMethod);
        } catch (error) {
            console.error('Register error:', error);
            showToast(error.message || 'Đăng ký thất bại', 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

// ========== MOCK LOGIN (KIỂM TRA CẢ TÀI KHOẢN ĐÃ LƯU) ==========
async function mockLogin(email, password, rememberMe) {
    try {
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Đăng nhập thất bại');
        }
        
        // Lưu token (Bỏ avatar_url để tránh đầy bộ nhớ localStorage)
        const storageUser = { ...data.user };
        delete storageUser.avatar_url;
        const userStr = JSON.stringify(storageUser);

        if (rememberMe) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('role', data.user.role);
            localStorage.setItem('user', userStr);
        } else {
            sessionStorage.setItem('token', data.token);
            sessionStorage.setItem('role', data.user.role);
            sessionStorage.setItem('user', userStr);
            localStorage.setItem('token', data.token);
            localStorage.setItem('role', data.user.role);
            localStorage.setItem('user', userStr);
        }
        
        showToast(`Chào mừng ${data.user.full_name}! Đăng nhập thành công`, 'success');
        
        setTimeout(() => {
            window.location.href = '../../user/index/html/index.html';
        }, 1000);
        
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

// ========== MOCK REGISTER (LƯU TÀI KHOẢN MỚI) ==========
async function mockRegister(fullName, email, phone, password, verificationMethod) {
    try {
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
                role: 'customer'
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Đăng ký thất bại');
        }
        
        // Lưu thông tin tạm để xác thực
        const tempUser = { fullName, email, phone, password, verificationMethod };
        sessionStorage.setItem('tempRegistration', JSON.stringify(tempUser));
        
        showToast('Đăng ký thành công! Chuyển đến trang xác thực...', 'success');
        
        setTimeout(() => {
            if (verificationMethod === 'email') {
                window.location.href = '../../user/email-verification/html/email-verification.html';
            } else {
                window.location.href = '../../user/phone-number/html/phone-number.html';
            }
        }, 1500);
        
    } catch (error) {
        console.error('Register error:', error);
        throw error;
    }
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