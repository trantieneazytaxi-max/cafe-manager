/**
 * PAYMENT PAGE - CAFE MANAGEMENT (ĐÃ SIMPLIFY)
 * Chỉ giữ: Tiền mặt + PayOS
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
const payosSection = document.getElementById('payosSection');
const cashAmount = document.getElementById('cashAmount');
const changeAmount = document.getElementById('changeAmount');
const confirmBtn = document.getElementById('confirmBtn');
const successModal = document.getElementById('successModal');
const closeModalBtn = document.getElementById('closeModalBtn');

// Check authentication & load data
document.addEventListener('DOMContentLoaded', () => {
    loadOrderData();
    initPaymentMethodSwitch();
    initEventListeners();
    
    // Kiểm tra callback từ PayOS
    checkPayOSCallback();
});

// Kiểm tra callback từ PayOS
async function checkPayOSCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const orderCode = urlParams.get('orderCode');
    const status = urlParams.get('status');
    
    if (orderCode && status) {
        if (status === 'PAID' || status.toLowerCase() === 'success') {
            await finalizePayOSOrder(orderCode);
        } else if (status === 'CANCELLED' || status.toLowerCase() === 'cancel') {
            showToast('Thanh toán đã bị hủy', 'error');
        }
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

// Hoàn tất đơn hàng sau PayOS thành công
async function finalizePayOSOrder(orderCode) {
    const token = localStorage.getItem('token');
    
    try {
        const selectedTableStr = sessionStorage.getItem('selectedTable');
        const selectedTable = selectedTableStr ? JSON.parse(selectedTableStr) : null;
        
        const orderData = {
            table_id: selectedTable ? selectedTable.table_id : 1, // Fallback nếu lỗi
            items: orderItems.map(item => ({
                item_id: item.item_id,
                quantity: item.quantity || 1,
                price: item.price,
                size_id: item.size_id || null,
                temp_id: item.temp_id || null
            })),
            payment_method: 'payos',
            total_amount: total,
            note: `PayOS #${orderCode}`
        };
        
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
            localStorage.removeItem('cart');
            sessionStorage.removeItem('tempOrder');
            sessionStorage.removeItem('payosOrderCode');
            
            window.location.href = '../../payment-success/html/payment-success.html';
        } else {
            throw new Error(data.message || 'Lưu đơn hàng thất bại');
        }
    } catch (error) {
        console.error('Finalize PayOS order error:', error);
        showToast('Lỗi xử lý đơn hàng: ' + error.message, 'error');
    }
}

// Load order data
function loadOrderData() {
    const tempOrder = sessionStorage.getItem('tempOrder');
    if (tempOrder) {
        orderItems = JSON.parse(tempOrder);
    } else {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        orderItems = cart;
    }
    
    calculateTotals();
    renderOrderItems();
}

// Calculate totals
function calculateTotals() {
    subtotal = orderItems.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    tax = subtotal * 0.1;
    total = subtotal + tax;
    
    subtotalEl.textContent = formatCurrency(subtotal);
    taxEl.textContent = formatCurrency(tax);
    totalEl.textContent = formatCurrency(total);
}

// Render order items
function renderOrderItems() {
    if (!orderItemsContainer) return;
    
    if (orderItems.length === 0) {
        orderItemsContainer.innerHTML = `<div class="empty-cart"><i class="fas fa-shopping-cart"></i><p>Không có đơn hàng nào</p></div>`;
        return;
    }
    
    orderItemsContainer.innerHTML = orderItems.map(item => `
        <div class="order-item">
            <div class="order-item-info">
                <div class="order-item-name">${escapeHtml(item.item_name)}</div>
            </div>
            <div class="order-item-quantity">x${item.quantity || 1}</div>
            <div class="order-item-price">${formatCurrency(item.price * (item.quantity || 1))}</div>
        </div>
    `).join('');
}

// Switch payment method
function initPaymentMethodSwitch() {
    const paymentMethods = document.querySelectorAll('input[name="paymentMethod"]');
    
    paymentMethods.forEach(method => {
        method.addEventListener('change', (e) => {
            cashSection.classList.add('hidden');
            payosSection.classList.add('hidden');
            
            if (e.target.value === 'cash') {
                cashSection.classList.remove('hidden');
            } else if (e.target.value === 'payos') {
                payosSection.classList.remove('hidden');
            }
        });
    });
}

// Confirm payment
async function confirmPayment() {
    const selectedMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value;
    
    if (!selectedMethod) {
        showToast('Vui lòng chọn phương thức thanh toán', 'error');
        return;
    }
    
    if (selectedMethod === 'cash') {
        const cash = parseFloat(cashAmount?.value) || 0;
        if (cash < total) {
            showToast('Số tiền khách đưa không đủ', 'error');
            return;
        }
        await processOrder('cash');
    } else if (selectedMethod === 'payos') {
        await processPayOS();
    }
}


// Process PayOS
async function processPayOS() {
    const confirmBtn = document.getElementById('confirmBtn');
    const originalText = confirmBtn.innerHTML;
    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang tạo...';
    confirmBtn.disabled = true;

    try {
        const response = await fetch('http://localhost:5000/api/payment/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: Math.round(total),
                // ✅ SỬA: Description tối đa 25 ký tự
                description: "Thanh toan Cafe",
                
                items: orderItems.map(item => ({
                    name: item.item_name,
                    quantity: item.quantity || 1,
                    price: Math.round(item.price)
                }))
            })
        });
        
        const data = await response.json();
        
        if (data.success && data.checkoutUrl) {
            sessionStorage.setItem('payosOrderCode', data.orderCode.toString());
            window.location.href = data.checkoutUrl;
        } else {
            throw new Error(data.message || 'Không thể tạo link thanh toán');
        }
    } catch (error) {
        console.error('PayOS error:', error);
        showToast('Lỗi tạo đơn PayOS: ' + error.message, 'error');
    } finally {
        confirmBtn.innerHTML = originalText;
        confirmBtn.disabled = false;
    }
}

// Process cash order
async function processOrder(paymentMethod) {
    const token = localStorage.getItem('token');
    const confirmBtn = document.getElementById('confirmBtn');
    const originalText = confirmBtn.innerHTML;
    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
    confirmBtn.disabled = true;

    try {
        const selectedTableStr = sessionStorage.getItem('selectedTable');
        const selectedTable = selectedTableStr ? JSON.parse(selectedTableStr) : null;
        
        if (!selectedTable || !selectedTable.table_id) {
            showToast('Vui lòng chọn bàn trước khi thanh toán', 'error');
            setTimeout(() => window.location.href = '../../tables/html/tables.html', 1500);
            return;
        }

        const orderData = {
            table_id: selectedTable.table_id,
            items: orderItems.map(item => ({
                item_id: item.item_id,
                quantity: item.quantity || 1,
                price: item.price,
                size_id: item.size_id || null,
                temp_id: item.temp_id || null
            })),
            payment_method: paymentMethod,
            total_amount: total,
            note: `Thanh toán tiền mặt - ${new Date().toLocaleString('vi-VN')}`
        };
        
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
            localStorage.removeItem('cart');
            sessionStorage.removeItem('tempOrder');
            window.location.href = '../../payment-success/html/payment-success.html';
        } else {
            throw new Error(data.message || 'Thanh toán thất bại');
        }
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        confirmBtn.innerHTML = originalText;
        confirmBtn.disabled = false;
    }
}

// Event listeners
function initEventListeners() {
    if (cashAmount) cashAmount.addEventListener('input', () => {
        const cash = parseFloat(cashAmount.value) || 0;
        const change = cash - total;
        changeAmount.textContent = formatCurrency(Math.max(0, change));
    });
    
    if (confirmBtn) confirmBtn.addEventListener('click', confirmPayment);
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            successModal.classList.add('hidden');
            window.location.href = '../../index/html/index.html';
        });
    }
}

// Các hàm hỗ trợ
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function escapeHtml(str) {
    return str ? str.replace(/[&<>"']/g, match => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[match]) : '';
}

function showToast(message, type = 'success') {
    let toast = document.querySelector('.custom-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = `custom-toast ${type}`;
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.display = 'block';
    setTimeout(() => toast.style.display = 'none', 3000);
}