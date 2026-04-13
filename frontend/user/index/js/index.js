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
    initCounterAnimation();
    initMobileMenu();
    initDropdown();
    updateUserInfo();
    initLogout();
    updateCartBadge();
});

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

    if (optionModal) {
        optionModal.addEventListener('click', (e) => {
            if (e.target === optionModal) closeModal();
        });
    }
}

async function loadFeaturedMenu() {
    const menuGrid = document.querySelector('.menu-grid');
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

function renderFeaturedMenu(menuItems) {
    const menuGrid = document.querySelector('.menu-grid');
    if (!menuGrid) return;

    if (!menuItems || menuItems.length === 0) {
        menuGrid.innerHTML = '<div class="loading-spinner">Chưa có món nào</div>';
        return;
    }

    menuGrid.innerHTML = menuItems.map(item => `
        <div class="menu-card" data-item-id="${item.item_id}">
            <div class="menu-card-img">
                <img src="${item.image_url || 'https://via.placeholder.com/300x200?text=No+Image'}"
                    alt="${escapeHtml(item.item_name)}"
                    style="width: 100%; height: 100%; object-fit: cover; border-radius: 12px;">
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
        currentPrice = data.final_price;
        if (displayPrice) displayPrice.textContent = formatCurrency(currentPrice);
    } catch (error) {
        console.error('Lỗi tính giá:', error);
    }
}

function addToCartAndGoToPayment() {
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

function initMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }
}

function updateCartBadge() {
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
    const token = localStorage.getItem('token');
    const avatarImg = document.getElementById('avatarImg');
    const userNameShort = document.getElementById('userNameShort');
    const savedAvatar = localStorage.getItem('userAvatar');

    const displayName = user.full_name || 'Khách';

    if (avatarImg) {
        avatarImg.src = savedAvatar ||
            `https://ui-avatars.com/api/?background=E67E22&color=fff&rounded=true&size=32&name=${encodeURIComponent(displayName)}`;
    }
    if (userNameShort) {
        userNameShort.textContent = user.full_name
            ? user.full_name.split(' ').pop()
            : 'Khách';
    }

    // Thay đổi dropdown theo trạng thái đăng nhập
    const dropdownMenu = document.getElementById('dropdownMenu');
    if (dropdownMenu) {
        if (token && user.full_name) {
            // Đã đăng nhập → hiện đầy đủ
            dropdownMenu.innerHTML = `
                <a href="../../profile/html/profile.html"><i class="fas fa-user-circle"></i> Thông tin cá nhân</a>
                <a href="../../settings/html/settings.html"><i class="fas fa-cog"></i> Cài đặt</a>
                <hr>
                <a href="#" id="logoutDropdownBtn"><i class="fas fa-sign-out-alt"></i> Đăng xuất</a>
            `;
            initLogout(); // gắn lại event sau khi render
        } else {
            // Khách vãng lai → chỉ hiện đăng nhập
            dropdownMenu.innerHTML = `
                <a href="../../../auth/html/auth.html"><i class="fas fa-sign-in-alt"></i> Đăng nhập</a>
            `;
        }
    }
}

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