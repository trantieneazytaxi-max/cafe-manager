/**
 * ORDER TRACKING LOGIC
 */

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const orderCode = urlParams.get('code') || sessionStorage.getItem('lastOrderCode');
    
    if (!orderCode) {
        window.location.href = '../../index/html/index.html';
        return;
    }

    // Khởi tạo hiển thị ban đầu
    document.getElementById('orderCode').textContent = orderCode;
    
    // Bắt đầu theo dõi
    trackOrder(orderCode);
    
    // Tự động làm mới mỗi 5 giây
    let interval = setInterval(() => trackOrder(orderCode), 5000);
    
    // Dừng làm mới nếu tab bị ẩn để tiết kiệm tài nguyên
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            if (interval) clearInterval(interval);
            interval = null;
        } else {
            if (!interval) interval = setInterval(() => trackOrder(orderCode), 5000);
        }
    });
});

async function trackOrder(query) {
    try {
        const response = await fetch(`http://localhost:5000/api/orders/track/${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error('Không tìm thấy đơn hàng');
        
        const order = await response.json();
        updateUI(order);
        
    } catch (error) {
        console.error('Lỗi tracking:', error);
    }
}

function updateUI(order) {
    // Thông tin cơ bản
    document.getElementById('orderCode').textContent = order.order_code;
    document.getElementById('orderDate').textContent = new Date(order.created_at).toLocaleString('vi-VN');
    document.getElementById('orderTotal').textContent = formatCurrency(order.total_amount);
    document.getElementById('orderType').textContent = translateType(order.order_type);
    document.getElementById('orderLocation').textContent = order.table_number ? `Bàn số ${order.table_number}` : (order.guest_name || 'Khách vãng lai');
    
    // Ghi chú (nếu có - lấy từ DB o.note)
    // Lưu ý: Backend API track/:query cần trả về thêm o.note
    if (order.note) {
        document.getElementById('orderNote').textContent = order.note;
    }

    // Tính toán thời gian chờ dự kiến
    // Mỗi món trong hàng đợi mất khoảng 3 phút. 
    // Nếu đơn đã Ready hoặc Completed thì thời gian chờ là 0.
    const estTimeEl = document.getElementById('estimatedTime');
    if (['ready', 'completed'].includes(order.status)) {
        estTimeEl.textContent = 'Sẵn sàng!';
    } else {
        const waitTime = Math.max(5, order.total_items_in_queue * 3); // Tối thiểu 5 phút
        estTimeEl.textContent = `~${waitTime} phút`;
    }

    // Cập nhật Timeline
    updateTimeline(order.status);
}

function updateTimeline(status) {
    const steps = ['pending', 'confirmed', 'preparing', 'ready', 'completed'];
    const statusMap = {
        'pending': 0,
        'paid': 1,      // 'paid' coi như đã xác nhận
        'confirmed': 1,
        'preparing': 2,
        'ready': 3,
        'completed': 4,
        'cancelled': -1
    };

    const currentStepIndex = statusMap[status] !== undefined ? statusMap[status] : 0;
    const progressLine = document.getElementById('progressLine');
    
    // Reset all steps
    steps.forEach((step, index) => {
        const el = document.getElementById(`step-${step}`);
        if (!el) return;
        
        el.classList.remove('active', 'completed');
        
        if (index < currentStepIndex) {
            el.classList.add('completed');
        } else if (index === currentStepIndex) {
            el.classList.add('active');
        }
    });

    // Update progress line height
    if (progressLine) {
        const percentage = (currentStepIndex / (steps.length - 1)) * 100;
        progressLine.style.height = `${percentage}%`;
    }

    // Nếu bị hủy
    if (status === 'cancelled') {
        const pendingStep = document.getElementById('step-pending');
        if (pendingStep) {
            pendingStep.querySelector('h3').textContent = 'Đã hủy đơn';
            pendingStep.querySelector('p').textContent = 'Đơn hàng của bạn đã bị hủy. Vui lòng liên hệ quán để biết thêm chi tiết.';
            pendingStep.classList.add('active');
            pendingStep.style.color = '#ff0055';
        }
    }
}

function translateType(type) {
    switch(type) {
        case 'dine-in': return 'Dùng tại chỗ';
        case 'takeaway': return 'Mang đi';
        case 'delivery': return 'Giao hàng';
        default: return type;
    }
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}
