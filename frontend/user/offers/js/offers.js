/**
 * OFFERS PAGE - CAFE MANAGEMENT
 */

// State
let allOffers = [];
let currentTab = 'all';

// DOM Elements
const offersGrid = document.getElementById('offersGrid');
const userPointsEl = document.getElementById('userPoints');
const userLoyaltySection = document.getElementById('userLoyaltySection');
const tabButtons = document.querySelectorAll('.tab-btn');

// Init
document.addEventListener('DOMContentLoaded', () => {
    loadUserStatus();
    loadOffers();
    initTabs();
});

// Load User Status
async function loadUserStatus() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch('http://localhost:5000/api/customer/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (response.ok) {
            userLoyaltySection.classList.remove('hidden');
            userPointsEl.textContent = data.loyalty_points || 0;
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

// Load All Offers
async function loadOffers() {
    try {
        const response = await fetch('http://localhost:5000/api/discounts/redeemable');
        allOffers = await response.json();
        renderOffers();
    } catch (error) {
        console.error('Error loading offers:', error);
        offersGrid.innerHTML = '<div class="loading">Không thể tải ưu đãi. Vui lòng thử lại sau.</div>';
    }
}

// Render Offers
function renderOffers() {
    let filtered = allOffers;
    if (currentTab !== 'all') {
        filtered = allOffers.filter(o => o.type === currentTab);
    }

    if (filtered.length === 0) {
        offersGrid.innerHTML = '<div class="loading">Chưa có ưu đãi nào trong mục này.</div>';
        return;
    }

    offersGrid.innerHTML = filtered.map(offer => `
        <div class="offer-card">
            <div class="offer-top">
                <div class="offer-value">
                    ${offer.discount_type === 'percentage' ? offer.discount_value + '%' : formatShortCurrency(offer.discount_value)}
                </div>
                <div class="offer-type-badge">${offer.type === 'loyalty' ? 'Đổi điểm' : 'Mã giảm giá'}</div>
            </div>
            <div class="offer-content">
                <h3>${offer.code}</h3>
                <p>${offer.description || 'Ưu đãi đặc biệt dành cho khách hàng.'}</p>
                <div class="offer-meta">
                    <span><i class="fas fa-shopping-basket"></i> Đơn tối thiểu: ${formatCurrency(offer.min_order_amount)}</span>
                    ${offer.type === 'loyalty' ? `<span><i class="fas fa-star"></i> Yêu cầu: ${offer.points_required} điểm</span>` : ''}
                </div>
            </div>
            <div class="offer-footer">
                ${offer.type === 'loyalty' ? `
                    <button class="btn-redeem" onclick="redeemOffer(${offer.code_id}, ${offer.points_required})">
                        Đổi ngay
                    </button>
                ` : `
                    <div class="copy-code">
                        <span class="code-text">${offer.code}</span>
                        <button class="btn-copy" onclick="copyToClipboard('${offer.code}')" title="Sao chép">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                `}
            </div>
        </div>
    `).join('');
}

// Redeem Loyalty Offer
async function redeemOffer(codeId, pointsRequired) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Vui lòng đăng nhập để đổi điểm!');
        window.location.href = '../../auth/html/user-login.html';
        return;
    }

    const currentPoints = parseInt(userPointsEl.textContent);
    if (currentPoints < pointsRequired) {
        alert('Bạn không đủ điểm để đổi mã này!');
        return;
    }

    if (!confirm(`Xác nhận dùng ${pointsRequired} điểm để đổi mã giảm giá này?`)) return;

    try {
        const response = await fetch('http://localhost:5000/api/discounts/redeem', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ codeId })
        });

        const data = await response.json();
        if (response.ok) {
            alert('Đổi thành công! Mã đã được thêm vào tài khoản của bạn.');
            loadUserStatus(); // Refresh points
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Redeem error:', error);
        alert('Có lỗi xảy ra, vui lòng thử lại.');
    }
}

// Copy to Clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert(`Đã sao chép mã: ${text}`);
    });
}

// Tabs Logic
function initTabs() {
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTab = btn.dataset.tab;
            renderOffers();
        });
    });
}

// Helpers
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
}

function formatShortCurrency(amount) {
    if (amount >= 1000) return (amount / 1000) + 'K';
    return amount;
}
