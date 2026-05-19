document.addEventListener('DOMContentLoaded', () => {
    checkLogin();
    loadLoyaltyPoints();
    loadOrderHistory();
    loadRedeemableOffers();
});

let currentUserPoints = 0;

function checkLogin() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../../auth/html/user-login.html';
    }
}

async function loadLoyaltyPoints() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/customer/loyalty', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (response.ok) {
            currentUserPoints = data.loyalty_points || 0;
            document.getElementById('loyaltyPoints').textContent = currentUserPoints.toLocaleString('vi-VN');
        }
    } catch (error) {
        console.error('Lỗi tải điểm:', error);
    }
}

async function loadRedeemableOffers() {
    const container = document.getElementById('redeemList');
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/discounts/redeemable', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const offers = await response.json();
        
        if (!response.ok) throw new Error('Không thể tải ưu đãi');

        if (offers.length === 0) {
            container.innerHTML = '<p class="no-orders">Hiện không có ưu đãi đổi điểm nào.</p>';
            return;
        }

        container.innerHTML = offers.map(offer => `
            <div class="redeem-card">
                <div class="redeem-info">
                    <h4>Giảm ${offer.discount_type === 'percentage' ? offer.discount_value + '%' : offer.discount_value.toLocaleString() + 'đ'}</h4>
                    <p>${offer.description || 'Ưu đãi đổi điểm'}</p>
                    <span class="redeem-points">${offer.points_required.toLocaleString()} điểm</span>
                </div>
                <button class="btn-redeem" 
                    ${currentUserPoints < offer.points_required ? 'disabled' : ''} 
                    onclick="redeemOffer(${offer.code_id})">
                    Đổi ngay
                </button>
            </div>
        `).join('');

    } catch (error) {
        console.error('Lỗi tải ưu đãi:', error);
        container.innerHTML = '<p>Không thể tải ưu đãi.</p>';
    }
}

async function redeemOffer(codeId) {
    if (!confirm('Bạn có chắc chắn muốn đổi điểm lấy mã giảm giá này?')) return;

    try {
        const token = localStorage.getItem('token');
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
            alert(data.message);
            loadLoyaltyPoints();
            loadRedeemableOffers();
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert('Lỗi kết nối server');
    }
}

async function loadOrderHistory() {
    const container = document.getElementById('historyList');
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/customer/orders', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const orders = await response.json();
        
        if (!response.ok) throw new Error(orders.message);

        if (orders.length === 0) {
            container.innerHTML = `
                <div class="no-orders">
                    <i class="fas fa-receipt"></i>
                    <p>Bạn chưa có đơn hàng nào.</p>
                    <a href="../../index/html/index.html" style="color: var(--primary-color); text-decoration: none;">Đặt món ngay</a>
                </div>
            `;
            return;
        }

        container.innerHTML = orders.map(order => {
            const orderDate = new Date(order.created_at);
            const now = new Date();
            const diffHours = (now - orderDate) / (1000 * 60 * 60);
            const canReview = (order.status === 'completed' || order.status === 'paid' || order.status === 'delivered') && diffHours <= 24;

            return `
                <div class="order-card" onclick="handleCardClick(event, ${order.order_id})">
                    <div class="order-header">
                        <span class="order-code">${order.order_code || '#' + order.order_id}</span>
                        <span class="order-status status-${order.status}">${getStatusText(order.status)}</span>
                    </div>
                    <div class="order-body">
                        <div class="order-info">
                            <span class="table-num">Bàn ${order.table_number || '---'}</span>
                            <span class="order-date">${new Date(order.created_at).toLocaleString('vi-VN')}</span>
                        </div>
                        <div class="order-total">
                            ${order.total_amount.toLocaleString('vi-VN')}₫
                        </div>
                    </div>
                    ${canReview ? `
                    <div class="order-footer" style="padding-top: 10px; margin-top: 10px; border-top: 1px solid #eee; display: flex; justify-content: flex-end;">
                        <button class="btn-review" onclick="openReviewModal(event, ${order.order_id})" style="background: #E67E22; color: white; border: none; padding: 5px 15px; border-radius: 8px; font-size: 0.8rem; cursor: pointer;">
                            <i class="fas fa-star"></i> Đánh giá
                        </button>
                    </div>` : ''}
                </div>
            `;
        }).join('');

        initReviewLogic();
    } catch (error) {
        console.error('Lỗi tải lịch sử:', error);
        container.innerHTML = '<p class="no-orders">Không thể tải lịch sử đơn hàng.</p>';
    }
}

function handleCardClick(e, orderId) {
    if (e.target.closest('.btn-review')) return;
    viewOrderDetails(orderId);
}

function openReviewModal(e, orderId) {
    e.stopPropagation();
    document.getElementById('reviewOrderId').value = orderId;
    document.getElementById('reviewModal').style.display = 'flex';
}

function initReviewLogic() {
    const reviewModal = document.getElementById('reviewModal');
    const closeReviewModal = document.getElementById('closeReviewModal');
    const reviewForm = document.getElementById('reviewForm');
    const stars = document.querySelectorAll('.rating-stars i');
    const ratingInput = document.getElementById('ratingInput');

    if (!reviewModal) return;

    if (closeReviewModal) {
        closeReviewModal.addEventListener('click', () => {
            reviewModal.style.display = 'none';
        });
    }

    stars.forEach(star => {
        star.addEventListener('mouseover', function() {
            highlightStars(this.getAttribute('data-rating'));
        });

        star.addEventListener('click', function() {
            ratingInput.value = this.getAttribute('data-rating');
            highlightStars(ratingInput.value, true);
        });
    });

    const starContainer = document.querySelector('.rating-stars');
    if (starContainer) {
        starContainer.addEventListener('mouseleave', () => {
            highlightStars(ratingInput.value, true);
        });
    }

    function highlightStars(rating) {
        stars.forEach(s => {
            s.style.color = s.getAttribute('data-rating') <= rating ? '#f1c40f' : '#ddd';
        });
    }

    if (reviewForm) {
        reviewForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const orderId = document.getElementById('reviewOrderId').value;
            const rating = ratingInput.value;
            const comment = document.getElementById('reviewComment').value;

            try {
                const token = localStorage.getItem('token');
                const response = await fetch('http://localhost:5000/api/reviews/create', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ orderId, rating, comment })
                });

                const data = await response.json();
                if (response.ok) {
                    alert('Cảm ơn bạn đã đánh giá!');
                    reviewModal.style.display = 'none';
                    loadOrderHistory(); // Refresh to hide review button
                } else {
                    alert(data.message || 'Lỗi gửi đánh giá');
                }
            } catch (error) {
                alert('Lỗi kết nối server');
            }
        });
    }
}

function getStatusText(status) {
    switch(status) {
        case 'paid': return 'Đã thanh toán';
        case 'pending': return 'Chờ xử lý';
        case 'confirmed': return 'Đã xác nhận';
        case 'preparing': return 'Đang pha chế';
        case 'ready': return 'Sẵn sàng phục vụ';
        case 'completed': return 'Hoàn thành';
        case 'cancelled': return 'Đã hủy';
        default: return status;
    }
}

function viewOrderDetails(orderId) {
    window.location.href = `order-detail.html?id=${orderId}`;
}
