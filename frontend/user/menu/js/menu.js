/**
 * USER MENU - RESTORED COFFEE THEME WITH NEW FEATURES
 */

let allItems = [];
let categories = [];
let cart = JSON.parse(localStorage.getItem('cart') || '[]');

// Modal State
let currentSelectedItem = null;
let selectedSize = null;
let selectedToppings = [];
let currentBasePrice = 0;

document.addEventListener('DOMContentLoaded', () => {
    initModalEvents();
    loadCategories();
    loadMenuItems();
    initSearch();
    updateNavbarCartCount();
});

function initModalEvents() {
    const closeBtn = document.getElementById('closeModalBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const confirmBtn = document.getElementById('confirmBtn');
    const modal = document.getElementById('optionModal');

    if (closeBtn) closeBtn.onclick = closeModal;
    if (cancelBtn) cancelBtn.onclick = closeModal;
    if (confirmBtn) confirmBtn.onclick = addToCartWithOptions;
    if (modal) {
        modal.onclick = (e) => { if (e.target === modal) closeModal(); };
    }
}

async function loadCategories() {
    try {
        const response = await fetch('http://localhost:5000/api/menu/categories');
        categories = await response.json();
        renderCategoryTabs();
    } catch (error) { console.error('Lỗi tải danh mục:', error); }
}

async function loadMenuItems() {
    try {
        const response = await fetch('http://localhost:5000/api/menu/items');
        allItems = await response.json();
        renderMenu();
    } catch (error) {
        console.error('Lỗi tải thực đơn:', error);
        document.getElementById('menuGrid').innerHTML = '<p style="text-align: center; grid-column: 1/-1;">Lỗi tải dữ liệu. Vui lòng thử lại.</p>';
    }
}

function renderCategoryTabs() {
    const container = document.getElementById('categoryTabs');
    const tabsHtml = categories.map(cat => `
        <div class="category-tab" data-category="${cat.category_id}">
            <i class="fas fa-coffee"></i>
            <span>${cat.category_name}</span>
        </div>
    `).join('');
    container.innerHTML = `
        <div class="category-tab active" data-category="all">
            <i class="fas fa-utensils"></i>
            <span>Tất cả</span>
        </div>
    ` + tabsHtml;

    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderMenu(tab.dataset.category);
        });
    });
}

function renderMenu(categoryId = 'all') {
    const menuGrid = document.getElementById('menuGrid');
    const recommendedGrid = document.getElementById('recommendedGrid');
    const recommendedSection = document.getElementById('recommendedSection');

    // 1. Render Recommended
    const recommendedItems = allItems.filter(i => i.is_recommended && !i.is_paused);
    if (recommendedItems.length > 0 && categoryId === 'all') {
        recommendedSection.style.display = 'block';
        recommendedGrid.innerHTML = recommendedItems.map(item => renderItemCard(item)).join('');
    } else {
        recommendedSection.style.display = 'none';
    }

    // 2. Render Main Menu
    let filteredItems = allItems;
    if (categoryId !== 'all') {
        filteredItems = allItems.filter(item => item.category_id == categoryId);
    }
    
    menuGrid.innerHTML = filteredItems.map(item => renderItemCard(item)).join('');
}

function renderItemCard(item) {
    const isPaused = item.is_paused;
    return `
        <div class="menu-card ${isPaused ? 'paused' : ''}" onclick="${isPaused ? '' : `openOptionModal(${item.item_id})`}">
            ${item.is_recommended ? '<span class="hot-badge"><i class="fas fa-fire"></i> HOT</span>' : ''}
            ${isPaused ? '<span class="paused-badge">HẾT HÀNG</span>' : ''}
            <div class="menu-card-img">
                <img src="${item.image_url || 'https://via.placeholder.com/300x200?text=Coffee'}" alt="${item.item_name}" style="width: 100%; height: 100%; object-fit: cover;">
                <span class="category-badge">${item.category_name}</span>
            </div>
            <div class="menu-card-content">
                <h3>${item.item_name}</h3>
                <p>${item.description || 'Hương vị thơm ngon khó cưỡng.'}</p>
                <div class="menu-card-footer">
                    <span class="price-badge">${formatCurrency(item.price)}</span>
                    <button class="add-to-cart-btn" ${isPaused ? 'disabled' : ''}>
                        <i class="fas fa-cart-plus"></i> ${isPaused ? 'Hết hàng' : 'Chọn'}
                    </button>
                </div>
            </div>
        </div>
    `;
}

function openOptionModal(id) {
    const item = allItems.find(i => i.item_id == id);
    if (!item) return;

    currentSelectedItem = item;
    currentBasePrice = item.price;
    selectedSize = null;
    selectedToppings = [];

    document.getElementById('modalItemName').textContent = item.item_name;
    document.getElementById('modalItemDesc').textContent = item.description || '';
    
    const optionsBody = document.getElementById('custOptionsBody');
    optionsBody.innerHTML = '';

    const custom = typeof item.customizations === 'string' ? JSON.parse(item.customizations) : item.customizations;

    if (custom) {
        // Sizes
        if (custom.sizes && custom.sizes.length > 0) {
            const sizeHtml = `
                <div class="cust-group">
                    <label class="cust-label">Chọn kích cỡ:</label>
                    <div class="cust-options">
                        ${custom.sizes.map(s => `
                            <button class="option-btn" onclick="selectSize(this, '${s.name}', ${s.extraPrice})">${s.name} (+${formatCurrency(s.extraPrice)})</button>
                        `).join('')}
                    </div>
                </div>
            `;
            optionsBody.insertAdjacentHTML('beforeend', sizeHtml);
        }

        // Toppings
        if (custom.toppings && custom.toppings.length > 0) {
            const toppingHtml = `
                <div class="cust-group">
                    <label class="cust-label">Thêm topping:</label>
                    <div class="cust-options">
                        ${custom.toppings.map(t => `
                            <button class="option-btn" onclick="toggleTopping(this, '${t.name}', ${t.price})">${t.name} (+${formatCurrency(t.price)})</button>
                        `).join('')}
                    </div>
                </div>
            `;
            optionsBody.insertAdjacentHTML('beforeend', toppingHtml);
        }
    }

    calculatePrice();
    document.getElementById('optionModal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('optionModal').classList.add('hidden');
}

function selectSize(btn, name, extra) {
    btn.parentElement.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedSize = { name, extra };
    calculatePrice();
}

function toggleTopping(btn, name, price) {
    btn.classList.toggle('selected');
    if (btn.classList.contains('selected')) {
        selectedToppings.push({ name, price });
    } else {
        selectedToppings = selectedToppings.filter(t => t.name !== name);
    }
    calculatePrice();
}

function calculatePrice() {
    let total = currentBasePrice;
    if (selectedSize) total += selectedSize.extra;
    selectedToppings.forEach(t => total += t.price);
    document.getElementById('displayPrice').textContent = formatCurrency(total);
}

function addToCartWithOptions() {
    if (!currentSelectedItem) return;

    let finalPrice = currentBasePrice;
    if (selectedSize) finalPrice += selectedSize.extra;
    selectedToppings.forEach(t => finalPrice += t.price);

    const cartItem = {
        item_id: currentSelectedItem.item_id,
        item_name: currentSelectedItem.item_name,
        price: finalPrice,
        quantity: 1,
        customizations: {
            size: selectedSize ? selectedSize.name : 'Mặc định',
            toppings: selectedToppings.map(t => t.name)
        },
        image_url: currentSelectedItem.image_url
    };

    cart.push(cartItem);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateNavbarCartCount();
    closeModal();
    alert(`Đã thêm ${currentSelectedItem.item_name} vào giỏ hàng!`);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function updateNavbarCartCount() {
    const total = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const badge = document.getElementById('cartCount');
    if (badge) {
        badge.textContent = total;
        badge.style.display = total > 0 ? 'inline-block' : 'none';
    }
}

function initSearch() {
    const input = document.getElementById('searchInput');
    if (input) {
        input.addEventListener('input', (e) => {
            const keyword = e.target.value.toLowerCase();
            const filtered = allItems.filter(i => 
                i.item_name.toLowerCase().includes(keyword) || 
                (i.description && i.description.toLowerCase().includes(keyword))
            );
            document.getElementById('recommendedSection').style.display = keyword ? 'none' : 'block';
            document.getElementById('menuGrid').innerHTML = filtered.map(item => renderItemCard(item)).join('');
        });
    }
}
