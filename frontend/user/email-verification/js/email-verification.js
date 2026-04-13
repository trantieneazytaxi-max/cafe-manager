/**
 * EMAIL VERIFICATION - OTP 6 CHỮ SỐ
 * Khớp với backend API
 */

// ================= DOM =================
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

// ================= STATE =================
let currentMethod = 'email';
let timerInterval = null;
let timeLeft = 300; // 5 phút = 300s (khớp với backend)
let isVerified = false;
let currentContact = '';

const BASE_URL = 'http://localhost:5000';
const CIRCLE_CIRCUMFERENCE = 283;

// ================= INIT =================
if (timerProgress) {
    timerProgress.style.strokeDasharray = CIRCLE_CIRCUMFERENCE;
    timerProgress.style.strokeDashoffset = CIRCLE_CIRCUMFERENCE;
}

// ================= TOAST =================
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
                display: flex;
                align-items: center;
                gap: 10px;
                z-index: 1000;
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                animation: slideIn 0.3s ease;
            }
            .custom-toast.success { background: #10B981; }
            .custom-toast.error { background: #EF4444; }
            .custom-toast.info { background: #3B82F6; }
            @keyframes slideIn {
                from { transform: translateX(100%); }
                to { transform: translateX(0); }
            }
        `;
        document.head.appendChild(style);
    }

    const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle';
    toast.className = `custom-toast ${type}`;
    toast.innerHTML = `<i class="fas fa-${icon}"></i> ${message}`;
    toast.style.display = 'flex';

    setTimeout(() => toast.style.display = 'none', 3000);
}

// ================= VALIDATION =================
const isValidEmail = email => /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/.test(email);
const isValidPhone = phone => /^[0-9]{10,11}$/.test(phone);

// ================= SEND OTP =================
async function sendOTP(method, contact) {
    if (method === 'email' && !isValidEmail(contact)) {
        return showToast('Email không hợp lệ', 'error');
    }

    if (method === 'phone' && !isValidPhone(contact)) {
        return showToast('SĐT không hợp lệ', 'error');
    }

    currentContact = contact;

    const btn = method === 'email' ? sendEmailBtn : sendSmsBtn;
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang gửi...';

    try {
        const endpoint = method === 'email' ? '/api/verification/send-email' : '/api/verification/send-sms';
        const payload = method === 'email' 
            ? { email: contact, purpose: 'register' } 
            : { phone: contact, purpose: 'register' };

        const res = await fetch(BASE_URL + endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || 'Gửi OTP thất bại');
        }

        showToast(data.message || 'Đã gửi OTP', 'success');
        otpSection.classList.remove('hidden');
        startTimer();
        otpInputs[0].focus();

    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

// ================= VERIFY OTP =================
async function verifyOTP() {
    const otp = Array.from(otpInputs).map(i => i.value).join('');

    if (otp.length !== 6) {
        return showToast('Nhập đủ 6 chữ số', 'error');
    }

    verifyBtn.disabled = true;
    verifyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xác thực...';

    try {
        const payload = {
            otp_code: otp,
            purpose: 'register'
        };

        // Thêm email hoặc phone tùy theo method
        if (currentMethod === 'email') {
            payload.email = currentContact;
        } else {
            payload.phone = currentContact;
        }

        const res = await fetch(BASE_URL + '/api/verification/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (res.ok && data.success) {
            isVerified = true;
            clearInterval(timerInterval);

            showToast('✅ Xác thực thành công!', 'success');
            successMessage.classList.remove('hidden');
            otpSection.classList.add('hidden');

            // Chuyển về trang index sau 2s
            setTimeout(() => {
                window.location.href = '../../index/html/index.html';
            }, 2000);

        } else {
            throw new Error(data.message || 'OTP không đúng');
        }

    } catch (error) {
        showToast(error.message, 'error');

        // Hiệu ứng lỗi
        otpInputs.forEach(i => i.classList.add('error'));
        setTimeout(() => {
            otpInputs.forEach(i => {
                i.value = '';
                i.classList.remove('error');
            });
            otpInputs[0].focus();
        }, 800);

    } finally {
        verifyBtn.disabled = false;
        verifyBtn.innerHTML = '<i class="fas fa-check-circle"></i> Xác thực';
    }
}

// ================= TIMER (5 PHÚT) =================
function startTimer() {
    clearInterval(timerInterval);
    timeLeft = 300; // 5 phút

    timerInterval = setInterval(() => {
        timeLeft--;

        // Hiển thị định dạng MM:SS
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerSeconds.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        const progress = (timeLeft / 300) * CIRCLE_CIRCUMFERENCE;
        timerProgress.style.strokeDashoffset = CIRCLE_CIRCUMFERENCE - progress;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            handleExpire();
        }
    }, 1000);
}

function handleExpire() {
    otpInputs.forEach(i => i.disabled = true);
    verifyBtn.disabled = true;
    resendBtn.classList.remove('hidden');
    showToast('OTP đã hết hạn', 'error');
}

// ================= RESEND OTP =================
async function resendOTP() {
    resendBtn.disabled = true;
    resendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang gửi...';

    try {
        const endpoint = '/api/verification/resend';
        const payload = currentMethod === 'email'
            ? { email: currentContact, purpose: 'register' }
            : { phone: currentContact, purpose: 'register' };

        const res = await fetch(BASE_URL + endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.message);

        showToast('Đã gửi lại OTP', 'success');
        startTimer();

        otpInputs.forEach(i => {
            i.value = '';
            i.disabled = false;
        });

        verifyBtn.disabled = false;
        resendBtn.classList.add('hidden');
        otpInputs[0].focus();

    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        resendBtn.disabled = false;
        resendBtn.innerHTML = '<i class="fas fa-redo-alt"></i> Gửi lại';
    }
}

// ================= OTP INPUT - CHỈ NHẬN SỐ =================
otpInputs.forEach((input, index) => {
    input.setAttribute('maxlength', '1');
    input.setAttribute('inputmode', 'numeric');
    input.setAttribute('pattern', '[0-9]');

    // ✅ XỬ LÝ PASTE
    input.addEventListener('paste', e => {
        e.preventDefault();
        
        const pasteData = e.clipboardData.getData('text')
            .replace(/\D/g, ''); // Chỉ lấy số
        
        if (pasteData.length === 6) {
            pasteData.split('').forEach((digit, i) => {
                if (otpInputs[i]) {
                    otpInputs[i].value = digit;
                }
            });
            
            otpInputs[5].focus();
            
            setTimeout(() => {
                if (!isVerified && timeLeft > 0) {
                    verifyOTP();
                }
            }, 200);
            
            return;
        }
        
        // Paste ít hơn 6 số
        pasteData.split('').forEach((digit, i) => {
            const targetIndex = index + i;
            if (targetIndex < otpInputs.length) {
                otpInputs[targetIndex].value = digit;
            }
        });
    });

    // ✅ XỬ LÝ INPUT - CHỈ NHẬN SỐ
    input.addEventListener('input', e => {
        // Chỉ lấy số
        let val = e.target.value.replace(/\D/g, '');
        
        if (val.length > 1) {
            val = val.charAt(0);
        }
        
        if (e.target.value !== val) {
            e.target.value = val;
            return;
        }
        
        if (val && index < otpInputs.length - 1) {
            otpInputs[index + 1].focus();
        }
        
        const allFilled = Array.from(otpInputs).every(i => i.value);
        if (allFilled && !isVerified && timeLeft > 0) {
            setTimeout(() => verifyOTP(), 150);
        }
    });

    // ✅ XỬ LÝ BACKSPACE
    input.addEventListener('keydown', e => {
        if (e.key === 'Backspace') {
            if (!input.value && index > 0) {
                otpInputs[index - 1].focus();
                otpInputs[index - 1].value = '';
            }
        }
    });

    // ✅ CHỈ CHO PHÉP NHẬP SỐ
    input.addEventListener('keypress', e => {
        if (!/[0-9]/.test(e.key)) {
            e.preventDefault();
        }
    });
});

// ================= EVENTS =================
sendEmailBtn?.addEventListener('click', () => sendOTP('email', emailInput.value.trim()));
sendSmsBtn?.addEventListener('click', () => sendOTP('phone', phoneInput.value.trim()));
verifyBtn?.addEventListener('click', verifyOTP);
resendBtn?.addEventListener('click', resendOTP);

// ================= DROPDOWN =================
methodDropdown?.querySelectorAll('.dropdown-option').forEach(opt => {
    opt.addEventListener('click', () => {
        currentMethod = opt.dataset.method;
        emailSection.classList.toggle('hidden', currentMethod !== 'email');
        phoneSection.classList.toggle('hidden', currentMethod !== 'phone');
        reset();
    });
});

// ================= RESET =================
function reset() {
    clearInterval(timerInterval);
    timeLeft = 300;
    isVerified = false;
    otpSection.classList.add('hidden');
    successMessage.classList.add('hidden');
    otpInputs.forEach(i => {
        i.value = '';
        i.disabled = false;
    });
    resendBtn.classList.add('hidden');
}

// ================= AUTO-LOAD TỪ SESSION =================
document.addEventListener('DOMContentLoaded', () => {
    const tempReg = sessionStorage.getItem('tempRegistration');
    if (tempReg) {
        try {
            const user = JSON.parse(tempReg);
            if (user.email && user.selectedVerificationMethod === 'email') {
                emailInput.value = user.email;
                currentContact = user.email;
            }
        } catch (e) {
            console.error('Parse error:', e);
        }
    }
});
