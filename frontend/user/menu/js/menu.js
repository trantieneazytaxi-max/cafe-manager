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
let currentQuantity = 1;


document.addEventListener('DOMContentLoaded', async () => {
    initModalEvents();
    loadCategories();
    await loadMenuItems();
    initSearch();
    updateNavbarCartCount();
    initSort();
    handleSearchQueryParam();
});

function initSort() {
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            const activeTab = document.querySelector('.category-tab.active');
            renderMenu(activeTab ? activeTab.dataset.category : 'all');
        });
    }
}

function handleSearchQueryParam() {
    const params = new URLSearchParams(window.location.search);
    const search = params.get('search');
    if (search) {
        searchMenuItems(search);
    }
}


function initModalEvents() {
    const closeBtn = document.getElementById('closeModalBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const confirmBtn = document.getElementById('confirmBtn');
    const modal = document.getElementById('optionModal');

    if (closeBtn) closeBtn.onclick = closeModal;
    if (cancelBtn) cancelBtn.onclick = closeModal;
    if (confirmBtn) confirmBtn.onclick = addToCartWithOptions;

    const incBtn = document.getElementById('modalIncreaseBtn');
    const decBtn = document.getElementById('modalDecreaseBtn');
    const qtyDisplay = document.getElementById('modalQuantity');

    if (incBtn) {
        incBtn.addEventListener('click', () => {
            currentQuantity++;
            if (qtyDisplay) qtyDisplay.textContent = currentQuantity;
            updateModalPrice();
        });
    }

    if (decBtn) {
        decBtn.addEventListener('click', () => {
            if (currentQuantity > 1) {
                currentQuantity--;
                if (qtyDisplay) qtyDisplay.textContent = currentQuantity;
                updateModalPrice();
            }
        });
    }

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
        const data = await response.json();
        allItems = Array.isArray(data) ? data : [];
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

    // Apply Sorting
    const sortType = document.getElementById('sortSelect')?.value || 'default';
    if (sortType !== 'default') {
        filteredItems = [...filteredItems].sort((a, b) => {
            if (sortType === 'name-asc') return a.item_name.localeCompare(b.item_name);
            if (sortType === 'name-desc') return b.item_name.localeCompare(a.item_name);
            if (sortType === 'price-asc') return a.price - b.price;
            if (sortType === 'price-desc') return b.price - a.price;
            if (sortType === 'newest') return new Date(b.created_at || 0) - new Date(a.created_at || 0);
            return 0;
        });
    }

    const itemsToShow = filteredItems.filter(i => !i.is_paused);
    if (itemsToShow.length === 0) {
        menuGrid.innerHTML = '<p style="text-align: center; grid-column: 1/-1;">Không có món nào trong danh mục này.</p>';
        return;
    }
    menuGrid.innerHTML = itemsToShow.map(item => renderItemCard(item)).join('');
}

// Export function for global search
window.searchMenuItems = function(query) {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = query;
    
    const menuGrid = document.getElementById('menuGrid');
    const recommendedSection = document.getElementById('recommendedSection');
    
    if (!query) {
        renderMenu();
        return;
    }

    recommendedSection.style.display = 'none';
    const results = allItems.filter(item => 
        (item.item_name.toLowerCase().includes(query.toLowerCase()) || 
        (item.description && item.description.toLowerCase().includes(query.toLowerCase())))
        && !item.is_paused
    );

    if (results.length === 0) {
        menuGrid.innerHTML = `<p style="text-align: center; grid-column: 1/-1;">Không tìm thấy món nào khớp với "${query}"</p>`;
    } else {
        menuGrid.innerHTML = results.map(item => renderItemCard(item)).join('');
    }
};


function renderItemCard(item) {
    const isPaused = item.is_paused;
    return `
        <div class="menu-card ${isPaused ? 'paused' : ''}" onclick="${isPaused ? '' : `openOptionModal(${item.item_id})`}">
            ${item.is_recommended ? '<span class="hot-badge"><i class="fas fa-fire"></i> HOT</span>' : ''}
            ${isPaused ? '<span class="paused-badge">HẾT HÀNG</span>' : ''}
            <div class="menu-card-img">
                <img src="${getImgUrl(item.image_url)}" alt="${item.item_name}">
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
    currentQuantity = 1;
    const qtyDisplay = document.getElementById('modalQuantity');
    if (qtyDisplay) qtyDisplay.textContent = currentQuantity;
    
    selectedSize = null;
    selectedToppings = [];

    document.getElementById('modalItemName').textContent = item.item_name;
    document.getElementById('modalItemDesc').textContent = item.description || '';
    
    const optionsBody = document.getElementById('custOptionsBody');
    optionsBody.innerHTML = '';
    if (document.getElementById('itemNote')) document.getElementById('itemNote').value = '';

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
    
    const finalTotal = total * currentQuantity;
    document.getElementById('displayPrice').textContent = formatCurrency(finalTotal);
}

function updateModalPrice() {
    calculatePrice();
}


function addToCartWithOptions() {
    if (!currentSelectedItem) return;

    let totalPerItem = currentBasePrice;
    if (selectedSize) totalPerItem += selectedSize.extra;
    selectedToppings.forEach(t => totalPerItem += t.price);

    const cartItem = {
        item_id: currentSelectedItem.item_id,
        item_name: currentSelectedItem.item_name,
        price: totalPerItem * currentQuantity,
        quantity: currentQuantity,

        customizations: {
            size: selectedSize ? selectedSize.name : 'Mặc định',
            toppings: selectedToppings.map(t => t.name),
            note: document.getElementById('itemNote')?.value || ''
        },
        image_url: currentSelectedItem.image_url
    };

    cart.push(cartItem);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateNavbarCartCount();
    closeModal();
    alert(`Đã thêm ${currentSelectedItem.item_name} vào giỏ hàng!`);
}

// Dùng formatCurrency từ api.js


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
            searchMenuItems(e.target.value);
        });
    }
}

