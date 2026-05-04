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
let storeConfig = { lat: null, lng: null, address: '', storeName: '' };
let storeApiKeyPresent = false;
let mapsInitPromise = null;

function getDeliveryKm() {
    const hidden = document.getElementById('deliveryDistanceKm');
    if (hidden && hidden.value !== '') {
        const v = parseFloat(hidden.value);
        if (Number.isFinite(v)) return v;
    }
    const slider = document.getElementById('deliveryDistance');
    return slider ? parseFloat(slider.value) : 3;
}

function refreshSurchargeUI(km) {
    const surchargeWarning = document.getElementById('surchargeWarning');
    const surchargeCheckbox = document.getElementById('surchargeAccepted');
    const deliveryFeeEl = document.getElementById('deliveryFeeDisplay');
    if (deliveryFeeEl) deliveryFeeEl.textContent = formatCurrency(calculateDeliveryFee(km, subtotal));
    if (km > 5) {
        surchargeWarning?.classList.remove('hidden');
    } else {
        surchargeWarning?.classList.add('hidden');
        if (surchargeCheckbox) surchargeCheckbox.checked = false;
    }
}

async function loadStoreConfig() {
    try {
        const response = await fetch('http://localhost:5000/api/store');
        const data = await response.json();
        storeApiKeyPresent = Boolean(data.mapboxAccessToken);
        storeConfig = {
            lat: data.lat,
            lng: data.lng,
            address: data.address || '',
            storeName: data.storeName || ''
        };
        const label = document.getElementById('storeOriginLabel');
        if (label) {
            label.textContent = storeConfig.address
                ? storeConfig.address
                : '(Chưa cấu hình — vào Admin → Cài đặt hệ thống và chọn địa chỉ trên Mapbox)';
        }
        const hint = document.getElementById('mapsKeyHint');
        if (hint && !storeApiKeyPresent) {
            hint.classList.remove('hidden');
        }
    } catch (e) {
        console.error('loadStoreConfig', e);
        const label = document.getElementById('storeOriginLabel');
        if (label) label.textContent = 'Không tải được địa chỉ quán';
    }
}

function applySavedDeliveryCoords() {
    const latEl = document.getElementById('deliveryLat');
    const lngEl = document.getElementById('deliveryLng');
    if (!latEl || !lngEl) return;
    const lat = parseFloat(latEl.value);
    const lng = parseFloat(lngEl.value);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    if (storeConfig.lat == null || storeConfig.lng == null) return;
    let km = haversineKm(storeConfig.lat, storeConfig.lng, lat, lng);
    km = Math.round(km * 10) / 10;
    km = Math.max(0.5, Math.min(25, km));
    const hidden = document.getElementById('deliveryDistanceKm');
    if (hidden) hidden.value = String(km);
    const computedSpan = document.getElementById('distanceValueComputed');
    if (computedSpan) computedSpan.textContent = km;
    document.getElementById('distanceComputedBlock')?.classList.remove('hidden');
    document.getElementById('distanceManualBlock')?.classList.add('hidden');
    refreshSurchargeUI(km);
    updateOrderSummary();
}

function ensureMapsInit() {
    if (!mapsInitPromise) {
        mapsInitPromise = initMapsForPayment();
    }
    return mapsInitPromise;
}

async function initMapsForPayment() {
    await loadStoreConfig();
    const mapSection = document.getElementById('mapPickerSection');
    if (mapSection) mapSection.classList.remove('hidden');

    try {
        const storePos = [storeConfig.lat || 21.0278, storeConfig.lng || 105.8342];
        const picker = await initLeafletPicker('mapPicker', {
            center: storePos,
            storePos: storePos,
            onSelect: (p) => {
                document.getElementById('deliveryLat').value = p.lat;
                document.getElementById('deliveryLng').value = p.lng;
                
                const hidden = document.getElementById('deliveryDistanceKm');
                if (hidden) hidden.value = String(p.distance);
                
                const computedSpan = document.getElementById('distanceValueComputed');
                if (computedSpan) computedSpan.textContent = p.distance;
                
                document.getElementById('distanceComputedBlock')?.classList.remove('hidden');
                document.getElementById('distanceManualBlock')?.classList.add('hidden');
                
                refreshSurchargeUI(parseFloat(p.distance));
                updateOrderSummary();
            }
        });
    } catch (e) {
        console.error('Lỗi init Leaflet:', e);
    }
}


// DOM Elements
const orderItemsContainer = document.getElementById('orderItems');
function initCouponEvents() {
    const applyBtn = document.getElementById('applyCouponBtn');
    const couponInput = document.getElementById('couponCode');
    const clearBtn = document.getElementById('clearCouponBtn');
    const scanQrBtn = document.getElementById('scanQrBtn');
    
    if (scanQrBtn) {
        scanQrBtn.addEventListener('click', () => {
            // Simulate QR Scan
            showToast('Đang mở máy quét mã QR...', 'info');
            setTimeout(() => {
                couponInput.value = 'QR_DISCOUNT_10';
                applyBtn.click();
            }, 1500);
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            appliedDiscount = null;
            couponInput.value = '';
            document.getElementById('couponMessage').textContent = '';
            clearBtn.classList.add('hidden');
            applyBtn.classList.remove('hidden');
            updateOrderSummary();
            showToast('Đã bỏ qua mã giảm giá', 'info');
        });
    }
    
    if (applyBtn) {
        applyBtn.addEventListener('click', async () => {
            const code = couponInput.value.trim();
            if (!code) {
                showToast('Vui lòng nhập mã giảm giá', 'warning');
                return;
            }
            
            if (!subtotal || subtotal <= 0) {
                showToast('Không có đơn hàng để áp dụng mã', 'warning');
                return;
            }
            
            applyBtn.disabled = true;
            applyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            
            try {
                const token = localStorage.getItem('token');
                const headers = {
                    'Content-Type': 'application/json'
                };
                if (token) {
                    headers.Authorization = `Bearer ${token}`;
                }

                const response = await fetch('http://localhost:5000/api/discounts/apply', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ code, orderAmount: subtotal })
                });
                
                const data = await response.json();
                const msgEl = document.getElementById('couponMessage');
                
                if (response.ok) {
                    appliedDiscount = data.discount;
                    msgEl.textContent = `Áp dụng thành công! Giảm ${formatCurrency(data.discount.discountAmount)}`;
                    msgEl.className = 'coupon-message success';
                    
                    applyBtn.classList.add('hidden');
                    if (clearBtn) clearBtn.classList.remove('hidden');
                    
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

// Tính phí giao hàng theo khoảng cách (km)
// Miễn phí vận chuyển cho đơn >= 199.000đ và <= 5km
// ≤5km: 20k cố định | >5km: 20k + phụ thu 5k/km vượt quá
function calculateDeliveryFee(distanceKm, currentSubtotal = 0) {
    if (currentSubtotal >= 199000 && distanceKm <= 5) {
        return 0; // Freeship
    }
    const baseFee = 20000; // Phí cố định 20k cho ≤5km
    if (distanceKm <= 5) {
        return baseFee;
    } else {
        const extraKm = distanceKm - 5;
        return baseFee + Math.round(extraKm * 5000);
    }
}


// Kiểm tra có vượt quá bán kính tiêu chuẩn không
function isOutsideStandardRadius() {
    const orderType = document.querySelector('input[name="orderType"]:checked')?.value;
    if (orderType !== 'delivery') return false;
    return getDeliveryKm() > 5;
}

function updateOrderSummary() {
    const subtotalEl = document.getElementById('subtotal');
    const discountRow = document.querySelector('.discount-row');
    const discountEl = document.getElementById('discountAmount');
    const taxEl = document.getElementById('tax');
    const shippingRow = document.getElementById('shippingRow');
    const shippingFeeEl = document.getElementById('shippingFee');
    const totalEl = document.getElementById('totalPrice');
    
    subtotalEl.textContent = formatCurrency(subtotal);
    
    tax = subtotal * 0.1;
    if (taxEl) taxEl.textContent = formatCurrency(tax);
    
    // Phí ship linh hoạt theo km (chỉ khi delivery)
    const orderType = document.querySelector('input[name="orderType"]:checked')?.value;
    let shippingFee = 0;
    
    if (orderType === 'delivery') {
        shippingFee = calculateDeliveryFee(getDeliveryKm(), subtotal);
    }

    
    if (shippingRow) {
        shippingRow.style.display = shippingFee > 0 ? 'flex' : 'none';
    }
    if (shippingFeeEl) {
        shippingFeeEl.textContent = formatCurrency(shippingFee);
    }

    let currentTotal = subtotal + tax + shippingFee;
    
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
document.addEventListener('DOMContentLoaded', async () => {
    await loadStoreConfig();
    loadOrderData();
    const token = localStorage.getItem('token');
    if (token) {
        await fetchUserProfile(token);
        applySavedDeliveryCoords();
    }
    initPaymentMethodSwitch();
    initEventListeners();
    initCouponEvents();
    initOrderTypeEvents();
    loadAvailableCoupons();
    checkPayOSCallback();
    
    // Check if user is Admin/Staff to show Fast Confirm option
    const userStr = localStorage.getItem('user');
    if (userStr) {
        const user = JSON.parse(userStr);
        if (user.role === 'admin' || user.role === 'staff') {
            window.isAdminOrStaff = true;
        }
    }

    const fastConfirmBtn = document.getElementById('fastConfirmBtn');
    if (fastConfirmBtn) {
        // Map to 'vietqr' for internal fast confirm to satisfy DB constraint
        fastConfirmBtn.addEventListener('click', () => processOrder('vietqr'));
    }

    const closeReceiptBtn = document.getElementById('closeReceiptBtn');
    if (closeReceiptBtn) {
        closeReceiptBtn.addEventListener('click', () => {
            window.location.href = '../../index/html/index.html';
        });
    }
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
            
            // Chỉ tự động điền nếu người dùng bật setting auto_fill_address
            if (data.auto_fill_address !== 0) {
                const addr = document.getElementById('deliveryAddress');
                const latEl = document.getElementById('deliveryLat');
                const lngEl = document.getElementById('deliveryLng');
                if (addr && data.delivery_address) addr.value = data.delivery_address;
                if (latEl && data.delivery_lat != null) latEl.value = String(data.delivery_lat);
                if (lngEl && data.delivery_lng != null) lngEl.value = String(data.delivery_lng);
                
                // Nếu đang ở tab delivery, áp dụng tọa độ ngay
                const orderType = document.querySelector('input[name="orderType"]:checked')?.value;
                if (orderType === 'delivery') {
                    applySavedDeliveryCoords();
                }
            }
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

    // Hàm cập nhật UI theo loại đơn
    function applyOrderTypeUI(type) {
        // Địa chỉ + phí giao hàng: CHỈ hiện khi chọn "Giao hàng"
        if (type === 'delivery') {
            addressGroup.classList.remove('hidden');
            ensureMapsInit();
        } else {
            addressGroup.classList.add('hidden');
        }

        // Thông tin khách (tên + SĐT):
        // - "Tự đến lấy" hoặc "Giao hàng": luôn hiện
        // - "Tại chỗ": chỉ hiện nếu chưa đăng nhập
        if (type !== 'dine-in' || !token) {
            guestSection.classList.remove('hidden');
        } else {
            guestSection.classList.add('hidden');
        }

        // Cập nhật tổng tiền (phí ship chỉ có khi delivery)
        updateOrderSummary();
    }

    // Chạy ngay khi load trang để set đúng trạng thái ban đầu
    const initialType = document.querySelector('input[name="orderType"]:checked')?.value || 'dine-in';
    applyOrderTypeUI(initialType);
    updateCashPaymentMessage(); // Update message on initial load

    // Lắng nghe thay đổi
    typeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            applyOrderTypeUI(e.target.value);
            updateCashPaymentMessage(); // Update cash message when order type changes
        });
    });

    // Distance slider for delivery fee
    const distanceSlider = document.getElementById('deliveryDistance');
    if (distanceSlider) {
        distanceSlider.addEventListener('input', (e) => {
            const km = parseFloat(e.target.value);
            const hidden = document.getElementById('deliveryDistanceKm');
            if (hidden) hidden.value = String(km);
            const distanceValueEl = document.getElementById('distanceValue');
            if (distanceValueEl) distanceValueEl.textContent = km;
            refreshSurchargeUI(km);
            const percent = ((km - 1) / (15 - 1)) * 100;
            const color = km > 5 ? '#e74c3c' : '#e67e22';
            distanceSlider.style.background = `linear-gradient(to right, ${color} 0%, ${color} ${percent}%, #eee ${percent}%, #eee 100%)`;
            updateOrderSummary();
        });
        const initPercent = ((3 - 1) / (15 - 1)) * 100;
        distanceSlider.style.background = `linear-gradient(to right, #e67e22 0%, #e67e22 ${initPercent}%, #eee ${initPercent}%, #eee 100%)`;
        const hiddenKm = document.getElementById('deliveryDistanceKm');
        if (hiddenKm && !hiddenKm.value) hiddenKm.value = distanceSlider.value;
    }
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
        const deliveryAddress = (document.getElementById('deliveryAddress').value || '').trim().slice(0, 255);

        if (orderType === 'delivery') {
            if (!deliveryAddress) {
                showToast('Vui lòng nhập địa chỉ giao hàng', 'error');
                return;
            }
            if (storeApiKeyPresent && storeConfig.lat != null && storeConfig.lng != null) {
                const dLat = document.getElementById('deliveryLat').value;
                const dLng = document.getElementById('deliveryLng').value;
                if (!dLat || !dLng) {
                    showToast('Vui lòng chọn địa chỉ từ gợi ý Mapbox (chọn một kết quả trong danh sách)', 'error');
                    return;
                }
            }
        }

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
                updateCashPaymentMessage(); // Update message based on order type
                document.getElementById('adminFastConfirm')?.classList.add('hidden');
            } else if (e.target.value === 'payos') {
                payosSection.classList.remove('hidden');
                // Hide counter notice when switching to PayOS
                document.getElementById('counterPaymentNotice').classList.add('hidden');
                
                if (window.isAdminOrStaff) {
                    document.getElementById('adminFastConfirm')?.classList.remove('hidden');
                }
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

    // Kiểm tra phụ thu giao hàng xa (>5km)
    if (isOutsideStandardRadius()) {
        const surchargeCheckbox = document.getElementById('surchargeAccepted');
        if (!surchargeCheckbox || !surchargeCheckbox.checked) {
            showToast('Vui lòng xác nhận đồng ý phụ thu giao hàng xa trước khi thanh toán', 'error');
            // Scroll to surcharge warning
            document.getElementById('surchargeWarning')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
    }
    
    if (selectedMethod === 'cash') {
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
        const deliveryAddress = (document.getElementById('deliveryAddress').value || '').trim().slice(0, 255);

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
        if (orderType === 'delivery' && storeApiKeyPresent && storeConfig.lat != null && storeConfig.lng != null) {
            const dLat = document.getElementById('deliveryLat').value;
            const dLng = document.getElementById('deliveryLng').value;
            if (!dLat || !dLng) {
                showToast('Vui lòng chọn địa chỉ từ gợi ý Mapbox (chọn một kết quả trong danh sách)', 'error');
                resetConfirmBtn(confirmBtn, originalText);
                return;
            }
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
            note: buildOrderNote(orderType, paymentMethod)
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
            
            sessionStorage.setItem('lastOrderCode', data.order_code);
            sessionStorage.setItem('lastOrderId', data.order_id);
            window.location.href = '../../payment-success/html/payment-success.html?method=' + paymentMethod;

            
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

function showPremiumReceipt(orderData, items) {
    const modal = document.getElementById('receiptModal');
    if (!modal) return;

    document.getElementById('receiptOrderCode').textContent = orderData.order_code || '#CM-0000';
    document.getElementById('receiptDate').textContent = new Date().toLocaleString('vi-VN');
    
    const list = document.getElementById('receiptItemsList');
    if (list) {
        list.innerHTML = items.map(item => `
            <tr>
                <td>${escapeHtml(item.item_name)} x ${item.quantity || 1}</td>
                <td style="text-align: right;">${formatCurrency(item.price * (item.quantity || 1))}</td>
            </tr>
        `).join('');
    }
    
    document.getElementById('receiptSubtotal').textContent = formatCurrency(subtotal);
    document.getElementById('receiptShip').textContent = formatCurrency(orderData.shipping_fee || 0);
    document.getElementById('receiptKm').textContent = orderData.distance_km || 0;
    document.getElementById('receiptTotal').textContent = formatCurrency(orderData.total_amount);
    
    modal.classList.remove('hidden');
}


// Event listeners
function initEventListeners() {
    if (cashAmount) cashAmount.addEventListener('input', () => {
        const cash = parseFloat(cashAmount.value) || 0;
        const change = cash - total;
        changeAmount.textContent = formatCurrency(Math.max(0, change));
    });
    
    if (confirmBtn) confirmBtn.addEventListener('click', confirmPayment);
    
    const confirmNoDiscountBtn = document.getElementById('confirmNoDiscountBtn');
    if (confirmNoDiscountBtn) {
        confirmNoDiscountBtn.addEventListener('click', () => {
            appliedDiscount = null;
            const couponInput = document.getElementById('couponCode');
            if (couponInput) couponInput.value = '';
            document.getElementById('clearCouponBtn')?.classList.add('hidden');
            document.getElementById('couponMessage').textContent = '';
            updateOrderSummary();
            confirmPayment();
        });
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            successModal.classList.add('hidden');
            window.location.href = '../../index/html/index.html';
        });
    }
}
// Tạo ghi chú đơn hàng
function buildOrderNote(orderType, paymentMethod) {
    const parts = [];
    
    // Đá riêng chỉ khi giao xa >5km và khách đã xác nhận phụ thu
    if (orderType === 'delivery' && isOutsideStandardRadius()) {
        const surchargeCheckbox = document.getElementById('surchargeAccepted');
        if (surchargeCheckbox && surchargeCheckbox.checked) {
            parts.push('Đá riêng');
        }
    }
    
    // Ghi chú từ khách (nếu có)
    const userNote = sessionStorage.getItem('tempOrderNote') || '';
    if (userNote.trim()) {
        parts.push(userNote.trim());
    }
    
    // Phương thức thanh toán
    parts.push(paymentMethod === 'cash' ? 'Thanh toán tiền mặt' : 'Thanh toán online');
    
    // Thông tin giao hàng
    if (orderType === 'delivery') {
        const km = getDeliveryKm();
        parts.push(`Giao ${km}km`);
        if (km > 5) {
            parts.push('Có phụ thu giao xa');
        }
    }
    
    return parts.join(' | ');
}

// Update cash payment message based on order type
function updateCashPaymentMessage() {
    const orderType = document.querySelector('input[name="orderType"]:checked')?.value;
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value;
    const counterNotice = document.getElementById('counterPaymentNotice');
    
    if (paymentMethod === 'cash' && (orderType === 'dine-in' || orderType === 'takeaway')) {
        counterNotice.classList.remove('hidden');
    } else {
        counterNotice.classList.add('hidden');
    }
}

// Các hàm hỗ trợ
// Dùng formatCurrency từ api.js


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