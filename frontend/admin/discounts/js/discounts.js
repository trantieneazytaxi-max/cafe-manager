document.addEventListener('DOMContentLoaded', () => {
    loadDiscounts();
    setupEventListeners();
});

async function loadDiscounts() {
    const grid = document.getElementById('discountGrid');
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/discounts/admin/list', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const discounts = await response.json();

        if (discounts.length === 0) {
            grid.innerHTML = '<p>Chưa có mã giảm giá nào.</p>';
            return;
        }

        grid.innerHTML = discounts.map(d => `
            <div class="discount-card">
                <span class="discount-badge badge-${d.type}">${d.type}</span>
                <h3>${d.code}</h3>
                <div class="value">
                    ${d.discount_type === 'percentage' ? d.discount_value + '%' : formatPrice(d.discount_value)}
                </div>
                <div class="details">
                    <p>${d.description || 'Không có mô tả'}</p>
                    <small>Đơn tối thiểu: ${formatPrice(d.min_order_amount)}</small><br>
                    ${d.expiry_date ? `<small>Hết hạn: ${new Date(d.expiry_date).toLocaleDateString('vi-VN')}</small>` : ''}
                </div>
                <div class="stats">
                    <span>Đã dùng: ${d.usage_count}/${d.usage_limit || '∞'}</span>
                    <span>${d.is_active ? '✅ Đang chạy' : '❌ Đã dừng'}</span>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Lỗi load discounts:', error);
        grid.innerHTML = '<p>Lỗi tải dữ liệu.</p>';
    }
}

function setupEventListeners() {
    const modal = document.getElementById('discountModal');
    const addBtn = document.getElementById('addDiscountBtn');
    const closeBtn = document.querySelector('.close-btn');
    const cancelBtn = document.getElementById('cancelBtn');
    const form = document.getElementById('discountForm');
    const typeSelect = document.getElementById('type');
    const pointsGroup = document.getElementById('pointsGroup');

    addBtn.onclick = () => modal.classList.remove('hidden');
    closeBtn.onclick = () => modal.classList.add('hidden');
    cancelBtn.onclick = () => modal.classList.add('hidden');

    typeSelect.onchange = (e) => {
        pointsGroup.style.display = e.target.value === 'loyalty' ? 'block' : 'none';
    };

    form.onsubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/discounts/admin/create', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                alert('Tạo mã thành công!');
                modal.classList.add('hidden');
                form.reset();
                loadDiscounts();
            } else {
                const err = await response.json();
                alert('Lỗi: ' + err.message);
            }
        } catch (error) {
            alert('Lỗi kết nối server');
        }
    };
}

function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}
