/**
 * PHONE NUMBER VERIFICATION - CAFE MANAGEMENT
 * Xác thực SMS với OTP 6 ký tự (chữ hoa + số)
 */

// DOM Elements
const methodDropdown = document.getElementById('methodDropdown');
const phoneSection = document.getElementById('phoneSection');
const emailSection = document.getElementById('emailSection');
const phoneInput = document.getElementById('phoneInput');
const emailInput = document.getElementById('emailInput');
const sendSmsBtn = document.getElementById('sendSmsBtn');
const sendEmailBtn = document.getElementById('sendEmailBtn');
const otpSection = document.getElementById('otpSection');
const otpInputs = document.querySelectorAll('.otp-digit');
const timerSeconds = document.getElementById('timerSeconds');
const timerProgress = document.querySelector('.timer-progress');
const verifyBtn = document.getElementById('verifyBtn');
const resendBtn = document.getElementById('resendBtn');
const successMessage = document.getElementById('successMessage');

let currentMethod = 'phone';
let timerInterval = null;
let timeLeft = 60;
let isVerified = false;
let generatedOtp = '';

const CIRCLE_CIRCUMFERENCE = 283;
if (timerProgress) {
    timerProgress.style.strokeDasharray = CIRCLE_CIRCUMFERENCE;
    timerProgress.style.strokeDashoffset = CIRCLE_CIRCUMFERENCE;
}

function generateOTP() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let otp = '';
    for (let i = 0; i < 6; i++) {
        otp += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return otp;
}

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
    
    generatedOtp = generateOTP();
    console.log(`[MOCK] OTP gửi qua ${method === 'email' ? 'EMAIL' : 'SMS'} đến ${contact}: ${generatedOtp}`);
    showToast(`Mã OTP của bạn là: ${generatedOtp} (chỉ để test)`, 'info');
    startTimer();
    otpSection.classList.remove('hidden');
    if (otpInputs[0]) otpInputs[0].focus();
    return true;
}

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

async function resendOTP() {
    const contact = currentMethod === 'email' ? emailInput.value.trim() : phoneInput.value.trim();
    if (!contact) {
        showToast('Vui lòng nhập thông tin liên hệ', 'error');
        return;
    }
    generatedOtp = generateOTP();
    console.log(`[MOCK] Gửi lại OTP: ${generatedOtp}`);
    showToast(`Mã OTP mới: ${generatedOtp} (chỉ để test)`, 'info');
    startTimer();
    otpInputs.forEach(input => {
        input.disabled = false;
        input.value = '';
        input.classList.remove('error');
    });
    if (verifyBtn) {
        verifyBtn.disabled = false;
        verifyBtn.style.opacity = '1';
        verifyBtn.style.cursor = 'pointer';
    }
    if (resendBtn) resendBtn.classList.add('hidden');
    if (otpInputs[0]) otpInputs[0].focus();
}

function verifyOTP() {
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
    if (enteredOtp !== generatedOtp) {
        showToast('Mã xác thực không đúng. Vui lòng thử lại.', 'error');
        otpInputs.forEach(input => {
            input.classList.add('error');
            setTimeout(() => input.classList.remove('error'), 500);
        });
        return;
    }
    
    isVerified = true;
    if (timerInterval) clearInterval(timerInterval);
    successMessage.classList.remove('hidden');
    otpSection.classList.add('hidden');
    
    const contact = currentMethod === 'email' ? emailInput.value.trim() : phoneInput.value.trim();
    localStorage.setItem('verified_' + currentMethod, contact);
    localStorage.setItem('is_verified', 'true');
    showToast('Xác thực thành công!', 'success');
    
    // ✅ ĐÃ SỬA: Đường dẫn đúng
    setTimeout(() => {
        window.location.href = '../../index/html/index.html';
    }, 2000);
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
    }
    if (resendBtn) resendBtn.classList.add('hidden');
    timeLeft = 60;
    if (timerProgress) timerProgress.style.strokeDashoffset = CIRCLE_CIRCUMFERENCE;
    if (timerSeconds) timerSeconds.textContent = '60';
    generatedOtp = '';
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
                phoneSection.classList.add('hidden');
                emailSection.classList.remove('hidden');
            } else {
                selectedIcon.className = 'fas fa-phone-alt';
                selectedText.textContent = 'Xác thực qua SMS';
                phoneSection.classList.remove('hidden');
                emailSection.classList.add('hidden');
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
if (sendSmsBtn) sendSmsBtn.addEventListener('click', async () => await sendOTP('phone', phoneInput.value.trim()));
if (sendEmailBtn) sendEmailBtn.addEventListener('click', async () => await sendOTP('email', emailInput.value.trim()));
if (verifyBtn) verifyBtn.addEventListener('click', verifyOTP);
if (resendBtn) resendBtn.addEventListener('click', resendOTP);

if (phoneInput) phoneInput.addEventListener('keypress', (e) => { if (e.key === 'Enter' && sendSmsBtn) sendSmsBtn.click(); });
if (emailInput) emailInput.addEventListener('keypress', (e) => { if (e.key === 'Enter' && sendEmailBtn) sendEmailBtn.click(); });

// Auto fill from temp registration
document.addEventListener('DOMContentLoaded', () => {
    const tempUser = sessionStorage.getItem('tempRegistration');
    if (tempUser) {
        const user = JSON.parse(tempUser);
        if (user.verificationMethod === 'phone' && user.phone) {
            phoneInput.value = user.phone;
        } else if (user.verificationMethod === 'email' && user.email) {
            emailInput.value = user.email;
            if (user.verificationMethod === 'email') {
                currentMethod = 'email';
                const selectedIcon = document.querySelector('.dropdown-selected i:first-child');
                const selectedText = document.querySelector('.dropdown-selected span');
                if (selectedIcon) selectedIcon.className = 'fas fa-envelope';
                if (selectedText) selectedText.textContent = 'Xác thực qua Email';
                phoneSection.classList.add('hidden');
                emailSection.classList.remove('hidden');
            }
        }
    }
});