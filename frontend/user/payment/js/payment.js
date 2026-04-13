/**
 * PAYMENT PAGE - CAFE MANAGEMENT
 * Xử lý thanh toán tiền mặt và chuyển khoản
 */

// State
let orderItems = [];
let subtotal = 0;
let tax = 0;
let total = 0;

// DOM Elements
const orderItemsContainer = document.getElementById('orderItems');
const subtotalEl = document.getElementById('subtotal');
const taxEl = document.getElementById('tax');
const totalEl = document.getElementById('total');
const cashSection = document.getElementById('cashSection');
const bankSection = document.getElementById('bankSection');
const cashAmount = document.getElementById('cashAmount');
const changeAmount = document.getElementById('changeAmount');
const bankAmount = document.getElementById('bankAmount');
const confirmBtn = document.getElementById('confirmBtn');
const successModal = document.getElementById('successModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const qrcodeDiv = document.getElementById('qrcode');

// Check authentication
document.addEventListener('DOMContentLoaded', () => {
    loadOrderData();
    initPaymentMethodSwitch();
    initEventListeners();
    initMobileMenu();
    initLogout();
    updateNavbarCartCount();
});

// Load order data from sessionStorage (from orders page)
function loadOrderData() {
    const tempOrder = sessionStorage.getItem('tempOrder');
    if (tempOrder) {
        orderItems = JSON.parse(tempOrder);
        calculateTotals();
        renderOrderItems();
    } else {
        // Fallback: load from cart
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        orderItems = cart;
        calculateTotals();
        renderOrderItems();
    }
}

// Calculate totals
function calculateTotals() {
    subtotal = orderItems.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    tax = subtotal * 0.1;
    total = subtotal + tax;
    
    if (subtotalEl) subtotalEl.textContent = formatCurrency(subtotal);
    if (taxEl) taxEl.textContent = formatCurrency(tax);
    if (totalEl) totalEl.textContent = formatCurrency(total);
    if (bankAmount) bankAmount.textContent = formatCurrency(total);
}

// Render order items
function renderOrderItems() {
    if (!orderItemsContainer) return;
    
    if (orderItems.length === 0) {
        orderItemsContainer.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <p>Không có đơn hàng nào</p>
            </div>
        `;
        return;
    }
    
    orderItemsContainer.innerHTML = orderItems.map((item, index) => `
        <div class="order-item">
            <div class="order-item-info">
                <div class="order-item-name">${escapeHtml(item.item_name)}</div>
                <div class="order-item-options">
                    ${renderItemOptions(item)}
                </div>
            </div>
            <div class="order-item-quantity">x${item.quantity || 1}</div>
            <div class="order-item-price">${formatCurrency(item.price * (item.quantity || 1))}</div>
        </div>
    `).join('');
}

// Render item options (size, temperature)
function renderItemOptions(item) {
    let optionsHtml = '';
    
    if (item.size_id) {
        let sizeName = '';
        if (item.size_id === 1) sizeName = 'Size S';
        else if (item.size_id === 2) sizeName = 'Size M';
        else if (item.size_id === 3) sizeName = 'Size L';
        optionsHtml += `<span>${sizeName}</span>`;
    }
    
    if (item.temp_id) {
        let tempName = '';
        if (item.temp_id === 1) tempName = 'Nóng';
        else if (item.temp_id === 2) tempName = 'Lạnh';
        else if (item.temp_id === 3) tempName = 'Đá';
        optionsHtml += `<span>${tempName}</span>`;
    }
    
    return optionsHtml;
}

// Calculate change for cash payment
function calculateChange() {
    const cash = parseFloat(cashAmount?.value) || 0;
    const change = cash - total;
    
    if (changeAmount) {
        if (change >= 0) {
            changeAmount.textContent = formatCurrency(change);
            changeAmount.style.color = '#10B981';
        } else {
            changeAmount.textContent = formatCurrency(Math.abs(change));
            changeAmount.style.color = '#EF4444';
        }
    }
}

// Generate QR code for bank transfer
// Generate QR code for bank transfer
function generateQRCode() {
    if (!qrcodeDiv) return;
    
    // Clear existing QR
    qrcodeDiv.innerHTML = '';
    
    // Rút gọn nội dung QR code (chỉ lấy thông tin quan trọng)
    const orderId = 'ORD' + new Date().getTime().toString().slice(-8);
    const amount = total;
    
    // Format theo tiêu chuẩn VietQR (đơn giản hóa)
    // Cấu trúc: https://img.vietqr.io/VIETCOMBANK/1234567890/QR?amount=xxx&addInfo=xxx
    const bankCode = 'VIETCOMBANK';
    const accountNumber = '1234567890';
    const accountName = 'CA PHE THONG MINH';
    const addInfo = `TT ${orderId}`;
    
    // Tạo URL VietQR ngắn gọn
    const qrUrl = `https://img.vietqr.io/${bankCode}/${accountNumber}/QR?amount=${Math.round(amount)}&addInfo=${encodeURIComponent(addInfo)}&accountName=${encodeURIComponent(accountName)}`;
    
    // Hoặc dùng nội dung đơn giản hơn nếu muốn tự tạo
    const simpleContent = `Số tiền: ${formatCurrency(amount)}\nNội dung: ${addInfo}\nNgân hàng: Vietcombank\nSố TK: ${accountNumber}`;
    
    // Giới hạn độ dài (tối đa 200 ký tự)
    const finalContent = simpleContent.length > 200 ? simpleContent.substring(0, 200) : simpleContent;
    
    console.log('QR Content length:', finalContent.length);
    
    try {
        new QRCode(qrcodeDiv, {
            text: finalContent,
            width: 150,
            height: 150,
            colorDark: '#5C3A21',
            colorLight: '#FFFFFF',
            correctLevel: QRCode.CorrectLevel.M  // Giảm độ chính xác để chứa được nhiều dữ liệu hơn
        });
    } catch (error) {
        console.error('QR Code error:', error);
        // Fallback: Hiển thị thông báo thay vì QR code
        qrcodeDiv.innerHTML = `
            <div style="text-align: center; padding: 10px;">
                <i class="fas fa-qrcode" style="font-size: 48px; color: #E67E22;"></i>
                <p style="font-size: 12px; margin-top: 8px;">Quét mã QR từ ứng dụng ngân hàng</p>
                <p style="font-size: 11px; color: #8B7355;">Chuyển khoản đến: ${accountNumber}</p>
            </div>
        `;
    }
}

// Switch between payment methods
function initPaymentMethodSwitch() {
    const paymentMethods = document.querySelectorAll('input[name="paymentMethod"]');
    
    paymentMethods.forEach(method => {
        method.addEventListener('change', (e) => {
            if (e.target.value === 'cash') {
                cashSection.classList.remove('hidden');
                bankSection.classList.add('hidden');
            } else {
                cashSection.classList.add('hidden');
                bankSection.classList.remove('hidden');
                generateQRCode();
            }
        });
    });
}

// Confirm payment
// Confirm payment and save order
async function confirmPayment() {
    const selectedMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
    
    if (selectedMethod === 'cash') {
        const cash = parseFloat(cashAmount?.value) || 0;
        if (cash < total) {
            showToast('Số tiền khách đưa không đủ', 'error');
            return;
        }
    }
    
    // Lấy thông tin bàn đã chọn
    const selectedTable = sessionStorage.getItem('selectedTable');
    if (!selectedTable) {
        showToast('Vui lòng chọn bàn trước khi thanh toán', 'error');
        setTimeout(() => {
            window.location.href = '../../tables/html/tables.html';
        }, 1500);
        return;
    }
    
    const table = JSON.parse(selectedTable);
    const token = localStorage.getItem('token');
    
    // Chuẩn bị dữ liệu đơn hàng
    const orderData = {
        table_id: table.table_id,
        items: orderItems.map(item => ({
            item_id: item.item_id,
            quantity: item.quantity || 1,
            price: item.price,
            size_id: item.size_id || null,
            temp_id: item.temp_id || null
        })),
        payment_method: selectedMethod === 'cash' ? 'cash' : 'bank_transfer',
        total_amount: total,
        note: `Bàn ${table.table_number} - ${new Date().toLocaleString('vi-VN')}`
    };
    
    // Disable button
    const confirmBtn = document.getElementById('confirmBtn');
    const originalText = confirmBtn.innerHTML;
    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
    confirmBtn.disabled = true;
    
    try {
        const response = await fetch('http://localhost:5000/api/orders/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(orderData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Xóa giỏ hàng và bàn đã chọn
            localStorage.removeItem('cart');
            sessionStorage.removeItem('tempOrder');
            sessionStorage.removeItem('selectedTable');
            
            // Hiển thị modal thành công
            successModal.classList.remove('hidden');
        } else {
            throw new Error(data.message || 'Thanh toán thất bại');
        }
        
    } catch (error) {
        console.error('Payment error:', error);
        showToast(error.message, 'error');
        confirmBtn.innerHTML = originalText;
        confirmBtn.disabled = false;
    }
}

// Event listeners
function initEventListeners() {
    if (cashAmount) {
        cashAmount.addEventListener('input', calculateChange);
    }
    
    if (confirmBtn) {
        confirmBtn.addEventListener('click', confirmPayment);
    }
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            successModal.classList.add('hidden');
            window.location.href = '../../index/html/index.html';
        });
    }
}

// Update navbar cart count
function updateNavbarCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const badges = document.querySelectorAll('.cart-badge');
    badges.forEach(badge => {
        if (totalItems > 0) {
            badge.textContent = totalItems;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    });
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

// Escape HTML
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
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

// Mobile menu
function initMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');
    
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }
}

// Logout
function initLogout() {
    const logoutBtn = document.getElementById('logoutDropdownBtn');
    if (!logoutBtn) return;
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '../../../auth/html/auth.html';
    });
}