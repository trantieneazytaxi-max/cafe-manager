document.addEventListener('DOMContentLoaded', () => {
    loadReviews();
});

async function loadReviews() {
    const container = document.getElementById('reviewsList');
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/reviews/admin/list', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const reviews = await response.json();

        if (reviews.length === 0) {
            container.innerHTML = '<div style="text-align: center; grid-column: 1/-1; padding: 50px;"><p>Chưa có đánh giá nào.</p></div>';
            return;
        }

        container.innerHTML = reviews.map(r => `
            <div class="review-card">
                <div class="review-header">
                    <div class="user-info-meta">
                        <img src="${r.avatar_url || 'https://ui-avatars.com/api/?name=' + r.full_name}" class="user-avatar">
                        <div>
                            <div class="user-name">${r.full_name}</div>
                            <div class="order-info">Đơn #${r.order_id} - ${new Date(r.order_date).toLocaleDateString('vi-VN')}</div>
                        </div>
                    </div>
                    <div class="rating">
                        ${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}
                    </div>
                </div>
                
                <div class="review-comment">"${r.comment || 'Không có nhận xét'}"</div>
                
                ${r.staff_reply ? `
                    <div class="reply-box">
                        <div class="reply-header">Phản hồi từ cửa hàng</div>
                        <div class="reply-content">${r.staff_reply}</div>
                        <div style="font-size: 0.7rem; color: #999; margin-top: 5px;">${new Date(r.replied_at).toLocaleString('vi-VN')}</div>
                    </div>
                ` : `
                    <button class="btn-reply" onclick="openReplyModal(${r.review_id})">
                        <i class="fas fa-reply"></i> Phản hồi
                    </button>
                `}
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading reviews:', error);
        container.innerHTML = '<p>Lỗi khi tải đánh giá.</p>';
    }
}

function openReplyModal(reviewId) {
    document.getElementById('replyReviewId').value = reviewId;
    document.getElementById('replyModal').style.display = 'flex';
}

function closeReplyModal() {
    document.getElementById('replyModal').style.display = 'none';
    document.getElementById('replyText').value = '';
}

async function submitReply() {
    const reviewId = document.getElementById('replyReviewId').value;
    const reply = document.getElementById('replyText').value;

    if (!reply.trim()) return alert('Vui lòng nhập phản hồi');

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/reviews/admin/reply/${reviewId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ reply })
        });

        if (response.ok) {
            closeReplyModal();
            loadReviews();
        } else {
            alert('Lỗi khi gửi phản hồi');
        }
    } catch (error) {
        alert('Lỗi kết nối');
    }
}
