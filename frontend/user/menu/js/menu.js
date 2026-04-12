/**
 * MENU PAGE - CAFE MANAGEMENT
 * Lấy dữ liệu từ database thật qua API
 */

// State
let allItems = [];
let categories = [];
let currentCategory = 'all';
let searchKeyword = '';
let cart = JSON.parse(localStorage.getItem('cart') || '[]');

// DOM Elements
const menuGrid = document.getElementById('menuGrid');
const categoryTabs = document.getElementById('categoryTabs');
const searchInput = document.getElementById('searchInput');

// ========== MODAL ELEMENTS (khai báo sau DOM load) ==========
let optionModal, modalItemName, sizeButtons, tempButtons, displayPrice, closeModalBtn, cancelBtn, confirmBtn;

// ========== MODAL STATE ==========
let currentSelectedItem = null;
let selectedSizeId = null;
let selectedTempId = null;
let currentPrice = 0;

// Check authentication
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../../../auth/html/auth.html';
        return;
    }
    
    // Khởi tạo modal elements sau khi DOM đã load
    initModalElements();
    
    loadCategories();
    loadMenuItems();
    initEventListeners();
    initMobileMenu();
    
    // Khởi tạo dropdown profile
    initDropdown();
    updateUserInfo();
    initLogout();
    
    // Cập nhật số lượng giỏ hàng
    updateNavbarCartCount();
});

// Khởi tạo modal elements
function initModalElements() {
    optionModal = document.getElementById('optionModal');
    modalItemName = document.getElementById('modalItemName');
    sizeButtons = document.getElementById('sizeButtons');
    tempButtons = document.getElementById('tempButtons');
    displayPrice = document.getElementById('displayPrice');
    closeModalBtn = document.getElementById('closeModalBtn');
    cancelBtn = document.getElementById('cancelBtn');
    confirmBtn = document.getElementById('confirmBtn');
    
    // Gắn sự kiện cho modal
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    if (confirmBtn) confirmBtn.addEventListener('click', addToCartWithOptions);
    
    // Đóng modal khi click ra ngoài
    if (optionModal) {
        optionModal.addEventListener('click', (e) => {
            if (e.target === optionModal) closeModal();
        });
    }
}

// Load categories from API
async function loadCategories() {
    try {
        console.log('Đang tải danh mục...');
        const response = await fetch('http://localhost:5000/api/menu/categories');
        const data = await response.json();
        
        if (response.ok) {
            categories = data;
            console.log('Đã tải', categories.length, 'danh mục');
        } else {
            throw new Error('Không thể tải danh mục');
        }
        renderCategories();
    } catch (error) {
        console.error('Lỗi tải danh mục:', error);
        showToast('Không thể tải danh mục', 'error');
    }
}

// Render category tabs
function renderCategories() {
    if (!categoryTabs) return;
    
    const tabsHtml = `
        <div class="category-tab ${currentCategory === 'all' ? 'active' : ''}" data-category="all">
            <i class="fas fa-utensils"></i>
            <span>Tất cả</span>
        </div>
        ${categories.map(cat => `
            <div class="category-tab ${currentCategory === cat.category_id ? 'active' : ''}" data-category="${cat.category_id}">
                <i class="fas fa-tag"></i>
                <span>${escapeHtml(cat.category_name)}</span>
            </div>
        `).join('')}
    `;
    
    categoryTabs.innerHTML = tabsHtml;
    
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentCategory = tab.getAttribute('data-category');
            filterAndRenderItems();
        });
    });
}

// Load menu items from API
async function loadMenuItems() {
    try {
        console.log('Đang tải thực đơn...');
        const response = await fetch('http://localhost:5000/api/menu/items');
        const data = await response.json();
        
        console.log('Response status:', response.status);
        console.log('Số lượng món:', data.length);
        
        if (response.ok) {
            allItems = data;
        } else {
            throw new Error('Không thể tải thực đơn');
        }
        filterAndRenderItems();
    } catch (error) {
        console.error('Lỗi tải thực đơn:', error);
        showToast('Không thể tải thực đơn', 'error');
        menuGrid.innerHTML = `
            <div class="no-results">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Không thể tải dữ liệu</h3>
                <p>Vui lòng thử lại sau</p>
            </div>
        `;
    }
}

// Filter items based on category and search
function filterAndRenderItems() {
    let filtered = [...allItems];
    
    if (currentCategory !== 'all') {
        filtered = filtered.filter(item => item.category_id == currentCategory);
    }
    
    if (searchKeyword) {
        const keyword = searchKeyword.toLowerCase();
        filtered = filtered.filter(item => 
            item.item_name.toLowerCase().includes(keyword) ||
            (item.description && item.description.toLowerCase().includes(keyword))
        );
    }
    
    renderMenuItems(filtered);
}

// Render menu items to grid
function renderMenuItems(items) {
    if (!menuGrid) return;
    
    if (items.length === 0) {
        menuGrid.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>Không tìm thấy món ăn</h3>
                <p>Vui lòng thử lại với từ khóa khác</p>
            </div>
        `;
        return;
    }
    
    menuGrid.innerHTML = items.map(item => `
        <div class="menu-card" data-item-id="${item.item_id}">
            <div class="menu-card-img">
                <img src="${item.image_url || 'https://via.placeholder.com/300x200?text=No+Image'}" 
                    alt="${escapeHtml(item.item_name)}"
                    style="width: 100%; height: 100%; object-fit: cover;">
                <span class="category-badge">${escapeHtml(item.category_name)}</span>
                <span class="price-badge">${formatCurrency(item.price)}</span>
            </div>
            <div class="menu-card-content">
                <h3>${escapeHtml(item.item_name)}</h3>
                <p>${escapeHtml(item.description || 'Món ngon đặc sắc')}</p>
                <div class="menu-card-footer">
                    <div class="quantity-control" data-item-id="${item.item_id}">
                        <button class="qty-minus" data-id="${item.item_id}">-</button>
                        <span class="qty-value" id="qty-${item.item_id}">${getCartQuantity(item.item_id)}</span>
                        <button class="qty-plus" data-id="${item.item_id}">+</button>
                    </div>
                    <button class="add-to-cart-btn" data-id="${item.item_id}">
                        <i class="fas fa-cart-plus"></i> Thêm
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    attachCartEvents();
}

// Get quantity of an item in cart
function getCartQuantity(itemId) {
    const cartItem = cart.find(item => item.item_id === itemId);
    return cartItem ? cartItem.quantity : 0;
}

// Update quantity display
function updateQuantityDisplay(itemId) {
    const qtySpan = document.getElementById(`qty-${itemId}`);
    if (qtySpan) {
        qtySpan.textContent = getCartQuantity(itemId);
    }
}

// Update quantity in cart
function updateQuantity(itemId, delta) {
    const cartItem = cart.find(item => item.item_id === itemId);
    const item = allItems.find(i => i.item_id === itemId);
    
    if (!item) return;
    
    if (cartItem) {
        const newQuantity = cartItem.quantity + delta;
        if (newQuantity <= 0) {
            cart = cart.filter(item => item.item_id !== itemId);
        } else {
            cartItem.quantity = newQuantity;
        }
    } else if (delta > 0) {
        cart.push({
            item_id: item.item_id,
            item_name: item.item_name,
            price: item.price,
            quantity: 1
        });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateQuantityDisplay(itemId);
    updateCartCount();
    showToast(`Đã ${delta > 0 ? 'thêm' : 'cập nhật'} ${item.item_name} vào giỏ hàng`, 'success');
    
    // Cập nhật số lượng trên navbar
    updateNavbarCartCount();
}

// Update cart count
function updateCartCount() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
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
            .custom-toast.info { background: #3B82F6; }
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

// Search functionality
function initEventListeners() {
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchKeyword = e.target.value.trim();
            filterAndRenderItems();
        });
    }
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

// ========== MODAL FUNCTIONS ==========
function openOptionModal(item) {
    if (!optionModal) {
        console.error('Modal chưa được khởi tạo');
        return;
    }
    console.log('Mở modal cho:', item.item_name);
    currentSelectedItem = item;
    selectedSizeId = null;
    selectedTempId = null;
    if (modalItemName) modalItemName.textContent = item.item_name;
    loadItemOptions(item.item_id);
}

async function loadItemOptions(itemId) {
    try {
        console.log('Đang tải tùy chọn cho món:', itemId);
        const response = await fetch(`http://localhost:5000/api/menu/items/${itemId}/options`);
        const data = await response.json();
        console.log('Dữ liệu tùy chọn:', data);
        
        // Size options
        const sizeOptionsDiv = document.getElementById('sizeOptions');
        if (sizeOptionsDiv) {
            if (data.has_size && data.sizes && data.sizes.length > 0) {
                sizeOptionsDiv.style.display = 'block';
                if (sizeButtons) {
                    sizeButtons.innerHTML = data.sizes.map(size => `
                        <button class="option-btn" data-size-id="${size.size_id}" data-multiplier="${size.price_multiplier}">
                            ${size.size_name} (${size.size_code})
                        </button>
                    `).join('');
                    
                    document.querySelectorAll('[data-size-id]').forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            document.querySelectorAll('[data-size-id]').forEach(b => b.classList.remove('selected'));
                            btn.classList.add('selected');
                            selectedSizeId = parseInt(btn.getAttribute('data-size-id'));
                            calculatePrice();
                        });
                    });
                }
            } else {
                sizeOptionsDiv.style.display = 'none';
            }
        }
        
        // Temperature options - LỌC NHIỆT ĐỘ THEO MÓN
        const tempOptionsDiv = document.getElementById('tempOptions');
        if (tempOptionsDiv) {
            if (data.has_temperature && data.temperatures && data.temperatures.length > 0) {
                tempOptionsDiv.style.display = 'block';
                
                // Lọc nhiệt độ phù hợp với từng loại món
                let temperaturesToShow = [...data.temperatures];
                
                // Danh sách món chỉ uống lạnh/đá (không nóng)
                const coldOnlyItems = [10, 11, 12]; // Sinh tố xoài, Nước cam ép, Soda chanh
                
                if (coldOnlyItems.includes(currentSelectedItem?.item_id)) {
                    // Chỉ hiển thị Lạnh và Đá, ẩn Nóng
                    temperaturesToShow = data.temperatures.filter(t => t.temp_code !== 'HOT');
                }
                
                if (tempButtons) {
                    tempButtons.innerHTML = temperaturesToShow.map(temp => `
                        <button class="option-btn" data-temp-id="${temp.temp_id}">
                            ${temp.temp_name}
                        </button>
                    `).join('');
                    
                    document.querySelectorAll('[data-temp-id]').forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            document.querySelectorAll('[data-temp-id]').forEach(b => b.classList.remove('selected'));
                            btn.classList.add('selected');
                            selectedTempId = parseInt(btn.getAttribute('data-temp-id'));
                            calculatePrice();
                        });
                    });
                }
            } else {
                tempOptionsDiv.style.display = 'none';
            }
        }
        
        // Nếu không có tùy chọn gì
        if (!data.has_size && !data.has_temperature) {
            currentPrice = currentSelectedItem.price;
            if (displayPrice) displayPrice.textContent = formatCurrency(currentPrice);
        }
        
        if (optionModal) optionModal.classList.remove('hidden');
        
    } catch (error) {
        console.error('Lỗi tải tùy chọn:', error);
        showToast('Không thể tải tùy chọn', 'error');
    }
}

async function calculatePrice() {
    if (!currentSelectedItem) return;
    
    try {
        const response = await fetch(`http://localhost:5000/api/menu/items/${currentSelectedItem.item_id}/calculate-price`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ size_id: selectedSizeId, temp_id: selectedTempId })
        });
        const data = await response.json();
        currentPrice = data.final_price;
        if (displayPrice) displayPrice.textContent = formatCurrency(currentPrice);
    } catch (error) {
        console.error('Lỗi tính giá:', error);
    }
}

function addToCartWithOptions() {
    if (!currentSelectedItem) return;
    
    const cartItem = {
        item_id: currentSelectedItem.item_id,
        item_name: currentSelectedItem.item_name,
        price: currentPrice || currentSelectedItem.price,
        original_price: currentSelectedItem.price,
        quantity: 1,
        size_id: selectedSizeId,
        temp_id: selectedTempId
    };
    
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    cart.push(cartItem);
    localStorage.setItem('cart', JSON.stringify(cart));
    
    showToast(`Đã thêm ${currentSelectedItem.item_name} vào giỏ hàng`, 'success');
    closeModal();
    
    updateNavbarCartCount();
}

function closeModal() {
    if (optionModal) optionModal.classList.add('hidden');
}

// Gắn sự kiện click vào card và nút thêm
function attachCartEvents() {
    // Click vào card (không phải nút)
    document.querySelectorAll('.menu-card').forEach(card => {
        card.removeEventListener('click', handleCardClick);
        card.addEventListener('click', handleCardClick);
    });
    
    // Nút thêm vào giỏ
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.removeEventListener('click', handleAddToCartClick);
        btn.addEventListener('click', handleAddToCartClick);
    });
    
    // Nút tăng/giảm số lượng
    document.querySelectorAll('.qty-minus').forEach(btn => {
        btn.removeEventListener('click', handleMinusClick);
        btn.addEventListener('click', handleMinusClick);
    });
    
    document.querySelectorAll('.qty-plus').forEach(btn => {
        btn.removeEventListener('click', handlePlusClick);
        btn.addEventListener('click', handlePlusClick);
    });
}

function handleCardClick(e) {
    if (e.target.closest('.qty-minus') || 
        e.target.closest('.qty-plus') || 
        e.target.closest('.add-to-cart-btn')) {
        return;
    }
    const card = e.currentTarget;
    const itemId = parseInt(card.getAttribute('data-item-id'));
    const item = allItems.find(i => i.item_id === itemId);
    if (item) openOptionModal(item);
}

function handleAddToCartClick(e) {
    e.stopPropagation();
    const btn = e.currentTarget;
    const id = parseInt(btn.getAttribute('data-id'));
    const item = allItems.find(i => i.item_id === id);
    if (item) openOptionModal(item);
}

function handleMinusClick(e) {
    e.stopPropagation();
    const id = parseInt(e.currentTarget.getAttribute('data-id'));
    updateQuantity(id, -1);
}

function handlePlusClick(e) {
    e.stopPropagation();
    const id = parseInt(e.currentTarget.getAttribute('data-id'));
    updateQuantity(id, 1);
}

// Cập nhật số lượng trên navbar
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

// ========== PROFILE DROPDOWN ==========
function initDropdown() {
    const profileBtn = document.getElementById('profileBtn');
    const profileDropdown = document.getElementById('profileDropdown');
    
    if (profileBtn) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle('active');
        });
    }
    
    document.addEventListener('click', () => {
        const dropdown = document.getElementById('profileDropdown');
        if (dropdown) dropdown.classList.remove('active');
    });
}

function updateUserInfo() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const avatarImg = document.getElementById('avatarImg');
    const userNameShort = document.getElementById('userNameShort');
    const savedAvatar = localStorage.getItem('userAvatar');
    
    if (avatarImg) {
        avatarImg.src = savedAvatar || `https://ui-avatars.com/api/?background=E67E22&color=fff&rounded=true&size=32&name=${encodeURIComponent(user.full_name || 'User')}`;
    }
    if (userNameShort) {
        const shortName = user.full_name ? user.full_name.split(' ').pop() : 'User';
        userNameShort.textContent = shortName;
    }
}

function initLogout() {
    const logoutBtn = document.getElementById('logoutDropdownBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = '../../../auth/html/auth.html';
        });
    }
}