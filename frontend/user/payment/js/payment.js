/**
 * PAYMENT PAGE - CAFE MANAGEMENT (ĐÃ SIMPLIFY)
 * Chỉ giữ: Tiền mặt + PayOS
 */

// State
let orderItems = [];
let subtotal = 0;
let tax = 0;
let total = 0;
let appliedDiscount = null;

// DOM Elements
const orderItemsContainer = document.getElementById('orderItems');
function initCouponEvents() {
    const applyBtn = document.getElementById('applyCouponBtn');
    const couponInput = document.getElementById('couponCode');
    
    if (applyBtn) {
        applyBtn.addEventListener('click', async () => {
            const code = couponInput.value.trim();
            if (!code) return;
            
            applyBtn.disabled = true;
            applyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('http://localhost:5000/api/discounts/apply', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ code, orderAmount: subtotal })
                });
                
                const data = await response.json();
                const msgEl = document.getElementById('couponMessage');
                
                if (response.ok) {
                    appliedDiscount = data.discount;
                    msgEl.textContent = `Áp dụng thành công! Giảm ${formatCurrency(data.discount.discountAmount)}`;
                    msgEl.className = 'coupon-message success';
                    updateOrderSummary();
                } else {
                    appliedDiscount = null;
                    msgEl.textContent = data.message;
                    msgEl.className = 'coupon-message error';
                    updateOrderSummary();
                }
            } catch (error) {
                console.error('Lỗi apply coupon:', error);
            } finally {
                applyBtn.disabled = false;
                applyBtn.textContent = 'Áp dụng';
            }
        });
    }
}

function updateOrderSummary() {
    const subtotalEl = document.getElementById('subtotal');
    const discountRow = document.querySelector('.discount-row');
    const discountEl = document.getElementById('discountAmount');
    const taxEl = document.getElementById('tax');
    const shippingRow = document.getElementById('shippingRow');
    const totalEl = document.getElementById('totalPrice');
    
    subtotalEl.textContent = formatCurrency(subtotal);
    
    tax = subtotal * 0.1;
    if (taxEl) taxEl.textContent = formatCurrency(tax);
    
    // 🆕 Phí ship (20k nếu là delivery)
    const orderType = document.querySelector('input[name="orderType"]:checked')?.value;
    const shippingFee = orderType === 'delivery' ? 20000 : 0;
    
    if (shippingRow) {
        shippingRow.style.display = shippingFee > 0 ? 'flex' : 'none';
    }

    let currentTotal = subtotal + tax + shippingFee; // Tổng gồm thuế + ship
    
    if (appliedDiscount) {
        discountRow.style.display = 'flex';
        discountEl.textContent = `-${formatCurrency(appliedDiscount.discountAmount)}`;
        currentTotal -= appliedDiscount.discountAmount;
    } else {
        discountRow.style.display = 'none';
    }
    
    totalEl.textContent = formatCurrency(Math.max(0, currentTotal));
    total = currentTotal;
}
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
    initCouponEvents(); // 🆕 Init coupon logic
    initOrderTypeEvents(); // 🆕 Init order type selection
    loadAvailableCoupons(); // 🆕 Load and recommend coupons
    
    // Kiểm tra callback từ PayOS
    checkPayOSCallback();
});

async function loadAvailableCoupons() {
    const listEl = document.getElementById('couponsList');
    if (!listEl) return;

    try {
        const response = await fetch('http://localhost:5000/api/discounts/redeemable');
        const coupons = await response.json();
        
        if (coupons.length === 0) {
            listEl.innerHTML = '<div class="no-coupons">Không có mã giảm giá nào khả dụng</div>';
            return;
        }

        // Tìm mã tốt nhất (giảm nhiều nhất)
        let bestCoupon = null;
        let maxDiscount = 0;

        const processedCoupons = coupons.map(c => {
            let discountValue = 0;
            const isValid = subtotal >= (c.min_order_amount || 0);
            
            if (isValid) {
                if (c.discount_type === 'percentage') {
                    discountValue = (subtotal * c.discount_value) / 100;
                } else {
                    discountValue = c.discount_value;
                }
                
                if (discountValue > maxDiscount) {
                    maxDiscount = discountValue;
                    bestCoupon = c;
                }
            }
            
            return { ...c, discountCalculated: discountValue, isValid };
        });

        renderCoupons(processedCoupons, bestCoupon);

        // Tự động áp dụng mã tốt nhất nếu có
        if (bestCoupon && !appliedDiscount) {
            applyCouponCode(bestCoupon.code);
        }

    } catch (error) {
        console.error('Error loading coupons:', error);
        listEl.innerHTML = '<div class="no-coupons">Lỗi tải mã giảm giá</div>';
    }
}

function renderCoupons(coupons, bestCoupon) {
    const listEl = document.getElementById('couponsList');
    listEl.innerHTML = coupons.map(c => `
        <div class="coupon-card ${bestCoupon && c.code === bestCoupon.code ? 'recommended' : ''} ${!c.isValid ? 'disabled' : ''}">
            ${bestCoupon && c.code === bestCoupon.code ? '<div class="recommend-badge">Tốt nhất</div>' : ''}
            <div class="coupon-info">
                <h4>${c.code}</h4>
                <p>${c.description || `Giảm ${c.discount_type === 'percentage' ? c.discount_value + '%' : formatCurrency(c.discount_value)}`}</p>
                <small>Đơn tối thiểu: ${formatCurrency(c.min_order_amount || 0)}</small>
            </div>
            <button class="btn-apply-coupon" 
                    onclick="applyCouponCode('${c.code}')" 
                    ${!c.isValid ? 'disabled' : ''}>
                Áp dụng
            </button>
        </div>
    `).join('');
}

window.applyCouponCode = async function(code) {
    const couponInput = document.getElementById('couponCode');
    if (couponInput) couponInput.value = code;
    
    // Trigger click on actual apply button to reuse existing logic
    const applyBtn = document.getElementById('applyCouponBtn');
    if (applyBtn) applyBtn.click();
};

async function fetchUserProfile(token) {
    try {
        const response = await fetch('http://localhost:5000/api/customer/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok) {
            const guestNameInput = document.getElementById('guestName');
            const guestPhoneInput = document.getElementById('guestPhone');
            if (guestNameInput) guestNameInput.value = data.full_name || '';
            if (guestPhoneInput) guestPhoneInput.value = data.phone || '';
        }
    } catch (error) {
        console.error('Error fetching profile for auto-fill:', error);
    }
}

function initOrderTypeEvents() {
    const typeRadios = document.querySelectorAll('input[name="orderType"]');
    const guestSection = document.getElementById('guestInfoSection');
    const addressGroup = document.getElementById('deliveryAddressGroup');
    const token = localStorage.getItem('token');

    // Nếu chưa đăng nhập, luôn hiện Guest Info
    if (!token) {
        guestSection.classList.remove('hidden');
    } else {
        // 🆕 Nếu đã đăng nhập, tự động lấy thông tin user để fill
        fetchUserProfile(token);
    }

    typeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const type = e.target.value;
            
            // Hiện address nếu chọn delivery
            if (type === 'delivery') {
                addressGroup.classList.remove('hidden');
            } else {
                addressGroup.classList.add('hidden');
            }

            // Hiện guest info nếu mang đi/giao hàng HOÀC chưa đăng nhập
            if (type !== 'dine-in' || !token) {
                guestSection.classList.remove('hidden');
            } else {
                guestSection.classList.add('hidden');
            }

            // 🆕 Cập nhật lại tổng tiền (để cộng/trừ phí ship)
            updateOrderSummary();
        });
    });
}

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
        
        const orderType = document.querySelector('input[name="orderType"]:checked').value;
        const guestName = document.getElementById('guestName').value;
        const guestPhone = document.getElementById('guestPhone').value;
        const deliveryAddress = document.getElementById('deliveryAddress').value;

        const orderData = {
            table_id: orderType === 'dine-in' ? (selectedTable ? selectedTable.table_id : 1) : null,
            items: orderItems.map(item => ({
                item_id: item.item_id,
                quantity: item.quantity || 1,
                price: item.price,
                size_id: item.size_id || null,
                temp_id: item.temp_id || null
            })),
            payment_method: 'payos',
            total_amount: total,
            order_type: orderType,
            guest_name: guestName || (orderType === 'dine-in' ? 'Khách tại bàn' : 'Khách vãng lai'),
            guest_phone: guestPhone || null,
            delivery_address: deliveryAddress || null,
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
    total = subtotal + tax; // Cập nhật global total
    
    const subtotalEl = document.getElementById('subtotal');
    const taxEl = document.getElementById('tax');
    const totalEl = document.getElementById('totalPrice');
    
    if (subtotalEl) subtotalEl.textContent = formatCurrency(subtotal);
    if (taxEl) taxEl.textContent = formatCurrency(tax);
    if (totalEl) totalEl.textContent = formatCurrency(total);
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
        // Tiền khách đưa giờ xử lý bên Staff, User chỉ việc xác nhận
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
function resetConfirmBtn(btn, originalText) {
    btn.innerHTML = originalText;
    btn.disabled = false;
}

async function processOrder(paymentMethod) {
    const token = localStorage.getItem('token');
    const confirmBtn = document.getElementById('confirmBtn');
    const originalText = confirmBtn.innerHTML;
    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
    confirmBtn.disabled = true;

    try {
        const selectedTableStr = sessionStorage.getItem('selectedTable');
        const selectedTable = selectedTableStr ? JSON.parse(selectedTableStr) : null;
        
        const orderType = document.querySelector('input[name="orderType"]:checked').value;
        const guestName = document.getElementById('guestName').value;
        const guestPhone = document.getElementById('guestPhone').value;
        const deliveryAddress = document.getElementById('deliveryAddress').value;

        // Validate guest info - Chỉ bắt buộc với Mang đi / Giao hàng
        if (orderType !== 'dine-in' && (!guestName || !guestPhone)) {
            showToast('Vui lòng nhập họ tên và số điện thoại để chúng tôi liên hệ', 'error');
            resetConfirmBtn(confirmBtn, originalText);
            return;
        }
        if (orderType === 'delivery' && !deliveryAddress) {
            showToast('Vui lòng nhập địa chỉ giao hàng', 'error');
            resetConfirmBtn(confirmBtn, originalText);
            return;
        }

        const orderData = {
            table_id: orderType === 'dine-in' ? (selectedTable ? selectedTable.table_id : null) : null,
            items: orderItems.map(item => ({
                item_id: item.item_id,
                quantity: item.quantity || 1,
                price: item.price,
                size_id: item.size_id || null,
                temp_id: item.temp_id || null
            })),
            payment_method: paymentMethod,
            total_amount: total, // Đã bao gồm thuế và trừ giảm giá trong updateOrderSummary
            discount_id: appliedDiscount ? appliedDiscount.code_id : null,
            discount_amount: appliedDiscount ? appliedDiscount.discountAmount : 0,
            order_type: orderType,
            guest_name: guestName || (orderType === 'dine-in' ? 'Khách tại bàn' : 'Khách vãng lai'),
            guest_phone: guestPhone || null,
            delivery_address: deliveryAddress || null,
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
            
            // Lưu order_code để hiển thị ở trang success
            if (data.order_code) {
                sessionStorage.setItem('lastOrderCode', data.order_code);
            }
            
            // Chuyển hướng
            if (paymentMethod === 'cash') {
                // Cho tiền mặt, có thể chuyển về trang đơn hàng/lịch sử thay vì success splash nếu muốn
                // Nhưng ở đây ta vẫn dùng success page để show mã đơn
                window.location.href = '../../payment-success/html/payment-success.html?method=cash';
            } else {
                window.location.href = '../../payment-success/html/payment-success.html';
            }
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