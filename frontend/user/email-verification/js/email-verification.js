/**
 * EMAIL VERIFICATION - CAFE MANAGEMENT
 * Xác thực email với OTP 6 ký tự (chữ hoa + số)
 * Đã sửa: Gọi API thật, không hiển thị OTP
 */

// DOM Elements
const methodDropdown = document.getElementById('methodDropdown');
const emailSection = document.getElementById('emailSection');
const phoneSection = document.getElementById('phoneSection');
const emailInput = document.getElementById('emailInput');
const phoneInput = document.getElementById('phoneInput');
const sendEmailBtn = document.getElementById('sendEmailBtn');
const sendSmsBtn = document.getElementById('sendSmsBtn');
const otpSection = document.getElementById('otpSection');
const otpInputs = document.querySelectorAll('.otp-digit');
const timerSeconds = document.getElementById('timerSeconds');
const timerProgress = document.querySelector('.timer-progress');
const verifyBtn = document.getElementById('verifyBtn');
const resendBtn = document.getElementById('resendBtn');
const successMessage = document.getElementById('successMessage');

let currentMethod = 'email';
let timerInterval = null;
let timeLeft = 60;
let isVerified = false;
let currentContact = '';  // Lưu email hoặc số điện thoại đang xác thực

const CIRCLE_CIRCUMFERENCE = 283;
if (timerProgress) {
    timerProgress.style.strokeDasharray = CIRCLE_CIRCUMFERENCE;
    timerProgress.style.strokeDashoffset = CIRCLE_CIRCUMFERENCE;
}

// ========== HIỂN THỊ THÔNG BÁO ==========
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
    toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i> ${message}`;
    toast.style.display = 'flex';
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

function isValidEmail(email) {
    const re = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;
    return re.test(email);
}

function isValidPhone(phone) {
    const re = /^[0-9]{10,11}$/;
    return re.test(phone);
}

// ========== GỬI OTP (GỌI API THẬT) ==========
async function sendOTP(method, contact) {
    if (method === 'email') {
        if (!contact || !isValidEmail(contact)) {
            showToast('Vui lòng nhập email hợp lệ', 'error');
            return false;
        }
    } else {
        if (!contact || !isValidPhone(contact)) {
            showToast('Vui lòng nhập số điện thoại hợp lệ (10-11 số)', 'error');
            return false;
        }
    }
    
    // Lưu contact để dùng sau
    currentContact = contact;
    
    // Hiển thị loading
    const sendBtn = method === 'email' ? sendEmailBtn : sendSmsBtn;
    const originalText = sendBtn.innerHTML;
    sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang gửi...';
    sendBtn.disabled = true;
    
    try {
        const endpoint = method === 'email' ? '/api/verification/send-email' : '/api/verification/send-sms';
        const payload = method === 'email' ? { email: contact, purpose: 'register' } : { phone: contact, purpose: 'register' };
        
        const response = await fetch(`http://localhost:5000${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // ✅ Gửi thành công - Không hiển thị OTP
            showToast(`Mã xác thực đã được gửi đến ${method === 'email' ? 'email' : 'số điện thoại'} của bạn`, 'success');
            startTimer();
            otpSection.classList.remove('hidden');
            if (otpInputs[0]) otpInputs[0].focus();
            
            // Lưu contact vào sessionStorage
            if (method === 'email') {
                sessionStorage.setItem('verifyEmail', contact);
                sessionStorage.setItem('verifyPhone', '');
            } else {
                sessionStorage.setItem('verifyPhone', contact);
                sessionStorage.setItem('verifyEmail', '');
            }
            
            return true;
        } else {
            showToast(data.message || 'Gửi mã thất bại', 'error');
            return false;
        }
    } catch (error) {
        console.error('Send OTP error:', error);
        showToast('Lỗi kết nối đến server', 'error');
        return false;
    } finally {
        sendBtn.innerHTML = originalText;
        sendBtn.disabled = false;
    }
}

// ========== BẮT ĐẦU ĐẾM NGƯỢC ==========
function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timeLeft = 60;
    updateTimerDisplay();
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;
            handleTimerExpired();
        }
    }, 1000);
}

function updateTimerDisplay() {
    if (timerSeconds) timerSeconds.textContent = timeLeft;
    if (timerProgress) {
        const progress = (timeLeft / 60) * CIRCLE_CIRCUMFERENCE;
        timerProgress.style.strokeDashoffset = CIRCLE_CIRCUMFERENCE - progress;
    }
}

function handleTimerExpired() {
    otpInputs.forEach(input => input.disabled = true);
    if (verifyBtn) {
        verifyBtn.disabled = true;
        verifyBtn.style.opacity = '0.5';
        verifyBtn.style.cursor = 'not-allowed';
    }
    if (resendBtn) resendBtn.classList.remove('hidden');
    showToast('Mã xác thực đã hết hạn. Vui lòng gửi lại.', 'error');
}

// ========== GỬI LẠI OTP ==========
async function resendOTP() {
    if (!currentContact) {
        showToast('Vui lòng nhập thông tin liên hệ', 'error');
        return;
    }
    
    if (resendBtn) {
        resendBtn.disabled = true;
        resendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang gửi...';
    }
    
    try {
        const method = currentMethod;
        const endpoint = method === 'email' ? '/api/verification/send-email' : '/api/verification/send-sms';
        const payload = method === 'email' ? { email: currentContact, purpose: 'register' } : { phone: currentContact, purpose: 'register' };
        
        const response = await fetch(`http://localhost:5000${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast(`Đã gửi lại mã xác thực`, 'success');
            startTimer();
            
            // Reset OTP inputs
            otpInputs.forEach(input => {
                input.value = '';
                input.disabled = false;
                input.classList.remove('error');
            });
            
            if (verifyBtn) {
                verifyBtn.disabled = false;
                verifyBtn.style.opacity = '1';
                verifyBtn.style.cursor = 'pointer';
            }
            
            if (resendBtn) resendBtn.classList.add('hidden');
            if (otpInputs[0]) otpInputs[0].focus();
        } else {
            showToast(data.message || 'Gửi lại thất bại', 'error');
        }
    } catch (error) {
        console.error('Resend OTP error:', error);
        showToast('Lỗi kết nối đến server', 'error');
    } finally {
        if (resendBtn) {
            resendBtn.disabled = false;
            resendBtn.innerHTML = '<i class="fas fa-redo-alt"></i> Gửi lại mã';
        }
    }
}

// ========== XÁC THỰC OTP ==========
async function verifyOTP() {
    const enteredOtp = Array.from(otpInputs).map(input => input.value).join('');
    
    if (enteredOtp.length !== 6) {
        showToast('Vui lòng nhập đầy đủ 6 ký tự', 'error');
        otpInputs.forEach(input => {
            if (!input.value) {
                input.classList.add('error');
                setTimeout(() => input.classList.remove('error'), 500);
            }
        });
        return;
    }
    
    // Disable nút xác thực
    if (verifyBtn) {
        verifyBtn.disabled = true;
        verifyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xác thực...';
    }
    
    try {
        const email = sessionStorage.getItem('verifyEmail');
        const phone = sessionStorage.getItem('verifyPhone');
        
        const payload = {
            otp_code: enteredOtp,
            purpose: 'register'
        };
        
        if (email && email !== '') {
            payload.email = email;
        } else if (phone && phone !== '') {
            payload.phone = phone;
        }
        
        const response = await fetch('http://localhost:5000/api/verification/verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Xác thực thành công
            isVerified = true;
            if (timerInterval) clearInterval(timerInterval);
            successMessage.classList.remove('hidden');
            otpSection.classList.add('hidden');
            
            // Xóa thông tin tạm
            sessionStorage.removeItem('verifyEmail');
            sessionStorage.removeItem('verifyPhone');
            
            showToast('Xác thực thành công!', 'success');
            
            // Chuyển về trang index
            setTimeout(() => {
                window.location.href = '../../index/html/index.html';
            }, 2000);
        } else {
            showToast(data.message || 'Mã xác thực không đúng', 'error');
            otpInputs.forEach(input => {
                input.classList.add('error');
                setTimeout(() => input.classList.remove('error'), 500);
            });
            if (verifyBtn) {
                verifyBtn.disabled = false;
                verifyBtn.innerHTML = '<i class="fas fa-check-circle"></i> Xác thực';
            }
        }
    } catch (error) {
        console.error('Verify OTP error:', error);
        showToast('Lỗi kết nối đến server', 'error');
        if (verifyBtn) {
            verifyBtn.disabled = false;
            verifyBtn.innerHTML = '<i class="fas fa-check-circle"></i> Xác thực';
        }
    }
}

function resetVerification() {
    if (timerInterval) clearInterval(timerInterval);
    otpSection.classList.add('hidden');
    successMessage.classList.add('hidden');
    otpInputs.forEach(input => {
        input.value = '';
        input.disabled = false;
        input.classList.remove('error');
    });
    if (verifyBtn) {
        verifyBtn.disabled = false;
        verifyBtn.style.opacity = '1';
        verifyBtn.style.cursor = 'pointer';
        verifyBtn.innerHTML = '<i class="fas fa-check-circle"></i> Xác thực';
    }
    if (resendBtn) {
        resendBtn.classList.add('hidden');
        resendBtn.disabled = false;
        resendBtn.innerHTML = '<i class="fas fa-redo-alt"></i> Gửi lại mã';
    }
    timeLeft = 60;
    if (timerProgress) timerProgress.style.strokeDashoffset = CIRCLE_CIRCUMFERENCE;
    if (timerSeconds) timerSeconds.textContent = '60';
    isVerified = false;
}

// Dropdown handling
if (methodDropdown) {
    const dropdownSelected = methodDropdown.querySelector('.dropdown-selected');
    const dropdownOptions = methodDropdown.querySelectorAll('.dropdown-option');
    dropdownSelected.addEventListener('click', (e) => {
        e.stopPropagation();
        methodDropdown.classList.toggle('open');
    });
    document.addEventListener('click', () => methodDropdown.classList.remove('open'));
    dropdownOptions.forEach(option => {
        option.addEventListener('click', () => {
            const method = option.getAttribute('data-method');
            currentMethod = method;
            const selectedIcon = dropdownSelected.querySelector('i:first-child');
            const selectedText = dropdownSelected.querySelector('span');
            if (method === 'email') {
                selectedIcon.className = 'fas fa-envelope';
                selectedText.textContent = 'Xác thực qua Email';
                emailSection.classList.remove('hidden');
                phoneSection.classList.add('hidden');
            } else {
                selectedIcon.className = 'fas fa-phone-alt';
                selectedText.textContent = 'Xác thực qua SMS';
                emailSection.classList.add('hidden');
                phoneSection.classList.remove('hidden');
            }
            resetVerification();
            methodDropdown.classList.remove('open');
        });
    });
}

// OTP input handlers
otpInputs.forEach((input, index) => {
    input.addEventListener('input', (e) => {
        let value = e.target.value.toUpperCase();
        value = value.replace(/[^A-Z0-9]/g, '');
        input.value = value;
        if (value && index < otpInputs.length - 1) otpInputs[index + 1].focus();
        const allFilled = Array.from(otpInputs).every(inp => inp.value.length === 1);
        if (allFilled && !isVerified && timeLeft > 0) verifyOTP();
    });
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !e.target.value && index > 0) otpInputs[index - 1].focus();
    });
});

// Button events
if (sendEmailBtn) sendEmailBtn.addEventListener('click', async () => await sendOTP('email', emailInput.value.trim()));
if (sendSmsBtn) sendSmsBtn.addEventListener('click', async () => await sendOTP('phone', phoneInput.value.trim()));
if (verifyBtn) verifyBtn.addEventListener('click', verifyOTP);
if (resendBtn) resendBtn.addEventListener('click', resendOTP);

if (emailInput) emailInput.addEventListener('keypress', (e) => { if (e.key === 'Enter' && sendEmailBtn) sendEmailBtn.click(); });
if (phoneInput) phoneInput.addEventListener('keypress', (e) => { if (e.key === 'Enter' && sendSmsBtn) sendSmsBtn.click(); });

// Auto fill from temp registration
document.addEventListener('DOMContentLoaded', () => {
    const tempUser = sessionStorage.getItem('tempRegistration');
    if (tempUser) {
        const user = JSON.parse(tempUser);
        if (user.verificationMethod === 'email' && user.email) {
            emailInput.value = user.email;
            currentContact = user.email;
            sessionStorage.setItem('verifyEmail', user.email);
        }
    }
});