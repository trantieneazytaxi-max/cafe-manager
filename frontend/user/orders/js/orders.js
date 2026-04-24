/**
 * ORDERS PAGE - CAFE MANAGEMENT
 * Giỏ hàng, chọn món, tính tiền
 */

// State
let cart = [];
let selectedItems = new Set();

// DOM Elements
const cartItemsList = document.getElementById('cartItemsList');
const selectAllCheckbox = document.getElementById('selectAllCheckbox');
const subtotalEl = document.getElementById('subtotal');
const taxEl = document.getElementById('tax');
const totalEl = document.getElementById('total');
const selectedCountEl = document.getElementById('selectedCount');
const checkoutBtn = document.getElementById('checkoutBtn');
const cartCountSpan = document.getElementById('cartCount');

document.addEventListener('DOMContentLoaded', () => {
    loadCart();
    initEventListeners();
    updateNavbarCartCount();
});

function loadCart() {
    const savedCart = localStorage.getItem('cart');
    cart = savedCart ? JSON.parse(savedCart) : [];
    
    // Auto-select all items by default
    selectedItems.clear();
    cart.forEach((_, index) => selectedItems.add(index));
    
    renderCart();
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateNavbarCartCount();
}

function updateNavbarCartCount() {
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    if (cartCountSpan) {
        cartCountSpan.textContent = totalItems;
        cartCountSpan.style.display = totalItems > 0 ? 'inline-block' : 'none';
    }
}

function renderCart() {
    if (!cartItemsList) return;

    if (cart.length === 0) {
        cartItemsList.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <h3>Đơn hàng trống</h3>
                <p>Hãy thêm món từ <a href="../../menu/html/menu.html">Thực đơn</a></p>
            </div>
        `;
        updateSummary();
        if (checkoutBtn) checkoutBtn.disabled = true;
        return;
    }

    cartItemsList.innerHTML = cart.map((item, index) => `
        <div class="cart-item" data-index="${index}">
            <div class="cart-item-select">
                <input type="checkbox" class="item-checkbox" data-index="${index}" ${selectedItems.has(index) ? 'checked' : ''}>
            </div>
            <div class="cart-item-info">
                <div class="cart-item-details">
                    <div class="cart-item-name">${escapeHtml(item.item_name)}</div>
                    <div class="cart-item-options">
                        ${renderItemOptions(item)}
                    </div>
                </div>
                <div class="cart-item-price">${formatCurrency(item.price)}</div>
                <div class="cart-item-quantity">
                    <button class="qty-minus" data-index="${index}">-</button>
                    <span>${item.quantity || 1}</span>
                    <button class="qty-plus" data-index="${index}">+</button>
                </div>
                <div class="cart-item-total">${formatCurrency((item.price) * (item.quantity || 1))}</div>
                <button class="cart-item-remove" data-index="${index}">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        </div>
    `).join('');

    attachItemEvents();
    updateSummary();

    if (checkoutBtn) {
        checkoutBtn.disabled = selectedItems.size === 0;
    }
}

function renderItemOptions(item) {
    let optionsHtml = '';

    if (item.size_id) {
        let sizeName = '';
        if (item.size_id === 1) sizeName = 'Size S (Nhỏ)';
        else if (item.size_id === 2) sizeName = 'Size M (Vừa)';
        else if (item.size_id === 3) sizeName = 'Size L (Lớn)';
        optionsHtml += `<span>${sizeName}</span>`;
    }

    if (item.temp_id) {
        let tempName = '';
        if (item.temp_id === 1) tempName = 'Nóng';
        else if (item.temp_id === 2) tempName = 'Lạnh';
        else if (item.temp_id === 3) tempName = 'Đá';
        optionsHtml += `<span>${tempName}</span>`;
    }

    return optionsHtml || '<span>Mặc định</span>';
}

function attachItemEvents() {
    document.querySelectorAll('.item-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const index = parseInt(checkbox.getAttribute('data-index'));
            if (checkbox.checked) {
                selectedItems.add(index);
            } else {
                selectedItems.delete(index);
            }
            updateSelectAllCheckbox();
            updateSummary();
            if (checkoutBtn) checkoutBtn.disabled = selectedItems.size === 0;
        });
    });

    document.querySelectorAll('.qty-plus').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.getAttribute('data-index'));
            cart[index].quantity = (cart[index].quantity || 1) + 1;
            saveCart();
            renderCart();
        });
    });

    document.querySelectorAll('.qty-minus').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.getAttribute('data-index'));
            const newQuantity = (cart[index].quantity || 1) - 1;
            if (newQuantity <= 0) {
                cart.splice(index, 1);
                const newSelected = new Set();
                selectedItems.forEach(i => {
                    if (i < index) newSelected.add(i);
                    else if (i > index) newSelected.add(i - 1);
                });
                selectedItems = newSelected;
            } else {
                cart[index].quantity = newQuantity;
            }
            saveCart();
            renderCart();
        });
    });

    document.querySelectorAll('.cart-item-remove').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.getAttribute('data-index'));
            cart.splice(index, 1);
            const newSelected = new Set();
            selectedItems.forEach(i => {
                if (i < index) newSelected.add(i);
                else if (i > index) newSelected.add(i - 1);
            });
            selectedItems = newSelected;
            saveCart();
            renderCart();
        });
    });
}

function updateSelectAllCheckbox() {
    if (!selectAllCheckbox) return;
    const allChecked = cart.length > 0 && selectedItems.size === cart.length;
    selectAllCheckbox.checked = allChecked;
    selectAllCheckbox.indeterminate = selectedItems.size > 0 && selectedItems.size < cart.length;
}

function updateSummary() {
    let subtotal = 0;
    let selectedCount = 0;

    selectedItems.forEach(index => {
        const item = cart[index];
        if (item) {
            subtotal += item.price * (item.quantity || 1);
            selectedCount++;
        }
    });

    const tax = subtotal * 0.1;
    const total = subtotal + tax;

    if (subtotalEl) subtotalEl.textContent = formatCurrency(subtotal);
    if (taxEl) taxEl.textContent = formatCurrency(tax);
    if (totalEl) totalEl.textContent = formatCurrency(total);
    if (selectedCountEl) selectedCountEl.textContent = selectedCount;
}

function checkout() {
    if (selectedItems.size === 0) {
        showToast('Vui lòng chọn ít nhất một món', 'error');
        return;
    }

    const selectedCartItems = [];
    selectedItems.forEach(index => {
        selectedCartItems.push(cart[index]);
    });

    sessionStorage.setItem('tempOrder', JSON.stringify(selectedCartItems));
    showToast('Chuyển sang trang thanh toán...', 'success');

    setTimeout(() => {
        window.location.href = '../../payment/html/payment.html';
    }, 1000);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
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

function initEventListeners() {
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                for (let i = 0; i < cart.length; i++) {
                    selectedItems.add(i);
                }
            } else {
                selectedItems.clear();
            }
            renderCart();
            if (checkoutBtn) checkoutBtn.disabled = selectedItems.size === 0;
        });
    }

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', checkout);
    }
}
