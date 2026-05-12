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
                    <div style="margin-top: 10px;">
                        <small><i class="fas fa-shopping-basket"></i> Đơn tối thiểu: ${formatPrice(d.min_order_amount)}</small><br>
                        ${d.expiry_date ? `<small><i class="fas fa-calendar-alt"></i> Hết hạn: ${new Date(d.expiry_date).toLocaleDateString('vi-VN')}</small>` : ''}
                    </div>
                </div>
                <div class="stats">
                    <span><i class="fas fa-user-check"></i> ${d.usage_count}/${d.usage_limit || '∞'}</span>
                    <span style="color: ${d.is_active ? '#00ff88' : '#ff0055'}">${d.is_active ? '● Đang chạy' : '● Đã dừng'}</span>
                </div>
                <div class="stats" style="margin-top: 5px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 5px;">
                    <span>${d.is_public ? '<i class="fas fa-eye"></i> Công khai' : '<i class="fas fa-eye-slash"></i> Riêng tư'}</span>
                </div>
                <div class="actions" style="margin-top: 1.5rem; display: flex; gap: 10px;">
                    <button class="btn-edit" onclick="editDiscount(${d.code_id})" style="background: rgba(0, 243, 255, 0.1); color: #00f3ff; border: 1px solid rgba(0, 243, 255, 0.3); padding: 8px 10px; border-radius: 12px; cursor: pointer; flex: 1; font-family: 'Orbitron', sans-serif; font-size: 0.7rem; letter-spacing: 1px; text-transform: uppercase;">
                        <i class="fas fa-edit"></i> Sửa
                    </button>
                    <button class="btn-delete" onclick="deleteDiscount(${d.code_id})" style="background: rgba(255, 0, 85, 0.1); color: #ff0055; border: 1px solid rgba(255, 0, 85, 0.3); padding: 8px 10px; border-radius: 12px; cursor: pointer; flex: 1; font-family: 'Orbitron', sans-serif; font-size: 0.7rem; letter-spacing: 1px; text-transform: uppercase;">
                        <i class="fas fa-trash-alt"></i> Xóa
                    </button>
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

    addBtn.addEventListener('click', () => {
        console.log('Opening discount modal for create');
        document.getElementById('modalTitle').textContent = 'Tạo mã giảm giá mới';
        document.getElementById('code_id').value = '';
        form.reset();
        modal.classList.remove('hidden');
    });

    if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
    if (cancelBtn) cancelBtn.addEventListener('click', () => modal.classList.add('hidden'));

    if (typeSelect) {
        typeSelect.addEventListener('change', (e) => {
            pointsGroup.style.display = e.target.value === 'loyalty' ? 'block' : 'none';
        });
    }

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            // Xử lý checkbox (FormData không gửi nếu không check)
            data.is_public = document.getElementById('is_public').checked ? 1 : 0;
            data.is_active = document.getElementById('is_active').checked ? 1 : 0;

            const code_id = document.getElementById('code_id').value;
            const url = code_id 
                ? `http://localhost:5000/api/discounts/admin/update/${code_id}`
                : 'http://localhost:5000/api/discounts/admin/create';
            const method = code_id ? 'PUT' : 'POST';

            try {
                const token = localStorage.getItem('token');
                const response = await fetch(url, {
                    method: method,
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                    alert(code_id ? 'Cập nhật thành công!' : 'Tạo mã thành công!');
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
        });
    }
}

function formatPrice(p) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);
}

async function editDiscount(id) {
    const modal = document.getElementById('discountModal');
    const form = document.getElementById('discountForm');
    const title = document.getElementById('modalTitle');
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/discounts/admin/list`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const discounts = await response.json();
        const discount = discounts.find(d => d.code_id == id);
        
        if (!discount) return;
        
        title.textContent = 'Chỉnh sửa mã giảm giá';
        document.getElementById('code_id').value = discount.code_id;
        document.getElementById('code').value = discount.code;
        document.getElementById('description').value = discount.description || '';
        document.getElementById('discount_type').value = discount.discount_type;
        document.getElementById('discount_value').value = discount.discount_value;
        document.getElementById('min_order_amount').value = discount.min_order_amount;
        document.getElementById('max_discount_amount').value = discount.max_discount_amount || '';
        document.getElementById('usage_limit').value = discount.usage_limit || '';
        document.getElementById('expiry_date').value = discount.expiry_date ? discount.expiry_date.split('T')[0] : '';
        document.getElementById('type').value = discount.type;
        document.getElementById('is_public').checked = !!discount.is_public;
        document.getElementById('is_active').checked = !!discount.is_active;
        
        modal.classList.remove('hidden');
    } catch (e) {
        console.error(e);
        alert('Lỗi khi tải thông tin mã');
    }
}

async function deleteDiscount(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa mã giảm giá này?')) return;
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/discounts/admin/delete/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            alert('Đã xóa thành công!');
            loadDiscounts();
        } else {
            alert('Lỗi khi xóa mã');
        }
    } catch (error) {
        alert('Lỗi kết nối');
    }
}
