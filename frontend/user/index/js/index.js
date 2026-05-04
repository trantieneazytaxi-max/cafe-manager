/**
 * USER INDEX PAGE - CAFE MANAGEMENT
 * Xử lý logic cho trang chủ người dùng
 */

// Global variables
let allFeaturedItems = [];
let optionModal, modalItemName, sizeButtons, tempButtons, displayPrice, closeModalBtn, cancelBtn, confirmBtn;
let currentSelectedItem = null;
let selectedSizeId = null;
let selectedTempId = null;
let currentPrice = 0;
let currentQuantity = 1;


document.addEventListener('DOMContentLoaded', async () => {
    // Không kiểm tra token - cho phép khách vãng lai truy cập tự do
    const userInfo = JSON.parse(localStorage.getItem('user') || '{}');

    initModalElements();

    if (userInfo.full_name) {
        const userNameElement = document.querySelector('.user-name');
        if (userNameElement) {
            userNameElement.textContent = userInfo.full_name;
        }
    }

    await loadFeaturedMenu();
    await loadRecommendations();
    await loadHeroBanners();
    initCounterAnimation();
});

async function loadHeroBanners() {
    try {
        const response = await fetch('http://localhost:5000/api/store');
        if (!response.ok) return;
        const data = await response.json();
        
        if (data.heroBanners) {
            let banners = [];
            try {
                banners = JSON.parse(data.heroBanners);
            } catch (e) {
                if (data.heroBanners.trim() !== '') {
                    banners = [data.heroBanners.trim()];
                }
            }
            
            if (banners.length > 0) {
                const heroSection = document.querySelector('.hero');
                if (!heroSection) return;
                
                let currentIdx = 0;
                
                // Set first banner
                heroSection.style.backgroundImage = `url('${banners[0]}')`;
                heroSection.style.backgroundSize = 'cover';
                heroSection.style.backgroundPosition = 'center';
                
                // Preload images
                const parsedBanners = banners.map(line => {
                    const parts = line.split('|');
                    return {
                        image: parts[0].trim(),
                        link: parts[1] ? parts[1].trim() : '../../menu/html/menu.html'
                    };
                });

                const ctaBtn = document.querySelector('.hero .btn-primary');
                
                const updateBanner = (idx) => {
                    heroSection.style.transition = 'background-image 1s ease-in-out';
                    heroSection.style.backgroundImage = `url('${parsedBanners[idx].image}')`;
                    if (ctaBtn) ctaBtn.href = parsedBanners[idx].link;
                };

                // Set first banner
                updateBanner(0);
                
                if (parsedBanners.length > 1) {
                    setInterval(() => {
                        currentIdx = (currentIdx + 1) % parsedBanners.length;
                        updateBanner(currentIdx);
                    }, 5000);
                }
            }
        }
    } catch (e) {
        console.error('Lỗi tải banner:', e);
    }
}

function initModalElements() {
    optionModal = document.getElementById('optionModal');
    modalItemName = document.getElementById('modalItemName');
    sizeButtons = document.getElementById('sizeButtons');
    tempButtons = document.getElementById('tempButtons');
    displayPrice = document.getElementById('displayPrice');
    closeModalBtn = document.getElementById('closeModalBtn');
    cancelBtn = document.getElementById('cancelBtn');
    confirmBtn = document.getElementById('confirmBtn');

    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    if (confirmBtn) confirmBtn.addEventListener('click', addToCartAndGoToPayment);

    const incBtn = document.getElementById('modalIncreaseBtn');
    const decBtn = document.getElementById('modalDecreaseBtn');
    const qtyDisplay = document.getElementById('modalQuantity');

    if (incBtn) {
        incBtn.addEventListener('click', () => {
            currentQuantity++;
            if (qtyDisplay) qtyDisplay.textContent = currentQuantity;
            updatePrice();
        });
    }

    if (decBtn) {
        decBtn.addEventListener('click', () => {
            if (currentQuantity > 1) {
                currentQuantity--;
                if (qtyDisplay) qtyDisplay.textContent = currentQuantity;
                updatePrice();
            }
        });
    }


    if (optionModal) {
        optionModal.addEventListener('click', (e) => {
            if (e.target === optionModal) closeModal();
        });
    }
}

async function loadFeaturedMenu() {
    const menuGrid = document.getElementById('featuredMenu');
    if (!menuGrid) return;

    try {
        const response = await fetch('http://localhost:5000/api/menu/items');
        const data = await response.json();

        if (response.ok && data.length > 0) {
            allFeaturedItems = data.slice(0, 4);
            renderFeaturedMenu(allFeaturedItems);
        } else {
            throw new Error('Không thể tải thực đơn');
        }

    } catch (error) {
        console.error('Lỗi khi tải thực đơn:', error);
        const mockMenu = [
            { item_id: 1, item_name: 'Cà phê đen', price: 25000, category_name: 'Cà phê' },
            { item_id: 2, item_name: 'Cà phê sữa', price: 30000, category_name: 'Cà phê' },
            { item_id: 5, item_name: 'Cappuccino', price: 45000, category_name: 'Cà phê' },
            { item_id: 9, item_name: 'Trà sữa trân châu', price: 45000, category_name: 'Trà' }
        ];
        allFeaturedItems = mockMenu;
        renderFeaturedMenu(mockMenu);
    }
}

async function loadRecommendations() {
    const recSection = document.getElementById('recommendationSection');
    const recGrid = document.getElementById('smartRecommendations');
    if (!recGrid) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/recommendations', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (data.success) {
            let items = [];
            if (data.personal && data.personal.length > 0) {
                items = data.personal;
            } else if (data.trending && data.trending.length > 0) {
                items = data.trending.slice(0, 4);
            }

            if (items.length > 0) {
                recSection.style.display = 'block';
                recGrid.innerHTML = items.map(item => renderMenuCard(item)).join('');
                allFeaturedItems = [...allFeaturedItems, ...items];
                attachOrderButtons();
            }
        }
    } catch (error) {
        console.error('Lỗi tải gợi ý:', error);
    }
}

function renderMenuCard(item) {
    return `
        <div class="menu-card" data-item-id="${item.item_id}">
            <div class="menu-card-img">
                <img src="${getImgUrl(item.image_url)}"
                    alt="${escapeHtml(item.item_name)}">
                <span class="category-badge">Đề xuất</span>
                <span class="price-badge">${formatCurrency(item.price)}</span>
            </div>
            <div class="menu-card-content">
                <h3>${escapeHtml(item.item_name)}</h3>
                <p>${escapeHtml(item.description || '')}</p>
                <button class="order-btn" data-item-id="${item.item_id}">
                    <i class="fas fa-shopping-cart"></i> Đặt ngay
                </button>
            </div>
        </div>
    `;
}


function renderFeaturedMenu(menuItems) {
    const menuGrid = document.getElementById('featuredMenu');
    if (!menuGrid) return;

    if (!menuItems || menuItems.length === 0) {
        menuGrid.innerHTML = '<div class="loading-spinner">Chưa có món nào</div>';
        return;
    }

    menuGrid.innerHTML = menuItems.map(item => `
        <div class="menu-card" data-item-id="${item.item_id}">
            <div class="menu-card-img">
                <img src="${getImgUrl(item.image_url)}"
                    alt="${escapeHtml(item.item_name)}">
                <span class="category-badge">${escapeHtml(item.category_name)}</span>
                <span class="price-badge">${formatCurrency(item.price)}</span>
            </div>
            <div class="menu-card-content">
                <h3>${escapeHtml(item.item_name)}</h3>
                <p>${escapeHtml(item.description || item.category_name)}</p>
                <button class="order-btn" data-item-id="${item.item_id}">
                    <i class="fas fa-shopping-cart"></i> Đặt ngay
                </button>
            </div>
        </div>
    `).join('');

    attachOrderButtons();
}

function attachOrderButtons() {
    document.querySelectorAll('.order-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const itemId = parseInt(btn.getAttribute('data-item-id'));
            const item = allFeaturedItems.find(i => i.item_id === itemId);
            if (item) {
                openOptionModal(item);
            }
        });
    });
}

async function openOptionModal(item) {
    if (!optionModal) {
        console.error('Modal chưa được khởi tạo');
        return;
    }

    currentSelectedItem = item;
    selectedSizeId = null;
    selectedTempId = null;
    currentQuantity = 1;
    const qtyDisplay = document.getElementById('modalQuantity');
    if (qtyDisplay) qtyDisplay.textContent = currentQuantity;

    if (modalItemName) modalItemName.textContent = item.item_name;


    await loadItemOptions(item.item_id);
}

async function loadItemOptions(itemId) {
    try {
        const response = await fetch(`http://localhost:5000/api/menu/items/${itemId}/options`);
        const data = await response.json();

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
                        btn.addEventListener('click', () => {
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

        const tempOptionsDiv = document.getElementById('tempOptions');
        if (tempOptionsDiv) {
            if (data.has_temperature && data.temperatures && data.temperatures.length > 0) {
                tempOptionsDiv.style.display = 'block';

                let temperaturesToShow = [...data.temperatures];
                const coldOnlyItems = [10, 11, 12];

                if (coldOnlyItems.includes(currentSelectedItem?.item_id)) {
                    temperaturesToShow = data.temperatures.filter(t => t.temp_code !== 'HOT');
                }

                if (tempButtons) {
                    tempButtons.innerHTML = temperaturesToShow.map(temp => `
                        <button class="option-btn" data-temp-id="${temp.temp_id}">
                            ${temp.temp_name}
                        </button>
                    `).join('');

                    document.querySelectorAll('[data-temp-id]').forEach(btn => {
                        btn.addEventListener('click', () => {
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
        // data.final_price là giá cho 1 món
        currentPrice = data.final_price * currentQuantity;
        if (displayPrice) displayPrice.textContent = formatCurrency(currentPrice);
    } catch (error) {
        console.error('Lỗi tính giá:', error);
    }
}

function updatePrice() {
    calculatePrice();
}


function addToCartAndGoToPayment() {
    if (!currentSelectedItem) return;

    const cartItem = {
        item_id: currentSelectedItem.item_id,
        item_name: currentSelectedItem.item_name,
        price: currentPrice || currentSelectedItem.price,
        original_price: currentSelectedItem.price,
        quantity: currentQuantity,

        size_id: selectedSizeId,
        temp_id: selectedTempId
    };

    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    cart.push(cartItem);
    localStorage.setItem('cart', JSON.stringify(cart));

    showToast(`Đã thêm ${currentSelectedItem.item_name} vào giỏ hàng`, 'success');
    closeModal();

    setTimeout(() => {
        window.location.href = '../../payment/html/payment.html';
    }, 500);
}

function closeModal() {
    if (optionModal) optionModal.classList.add('hidden');
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

function initCounterAnimation() {
    const counters = document.querySelectorAll('.stat-number');

    const animateCounter = (counter) => {
        const target = parseInt(counter.getAttribute('data-count'));
        let current = 0;
        const increment = target / 50;
        const updateCounter = () => {
            current += increment;
            if (current < target) {
                counter.textContent = Math.floor(current);
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = target;
            }
        };
        updateCounter();
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(counter => observer.observe(counter));
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
                z-index: 10000;
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