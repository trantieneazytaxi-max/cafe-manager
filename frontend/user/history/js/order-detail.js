/**
 * ORDER DETAIL JS - CAFE MANAGEMENT
 */

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('id');

    if (!orderId) {
        window.location.href = 'history.html';
        return;
    }

    loadOrderDetail(orderId);
});

async function loadOrderDetail(orderId) {
    const container = document.getElementById('orderDetailContent');
    const actions = document.getElementById('detailActions');

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/orders/${orderId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Không thể tải chi tiết đơn hàng');

        const data = await response.json();
        const { order, items } = data;

        // Render content
        container.innerHTML = `
            <div class="detail-header">
                <h1>Đơn hàng ${order.order_code || '#' + order.order_id}</h1>
                <span class="status-badge status-${order.status}">${getStatusText(order.status)}</span>
            </div>

            <div class="info-grid">
                <div class="info-item">
                    <label>Ngày đặt</label>
                    <p>${new Date(order.created_at).toLocaleString('vi-VN')}</p>
                </div>
                <div class="info-item">
                    <label>Hình thức</label>
                    <p>${order.order_type === 'dine-in' ? 'Tại bàn' : order.order_type === 'takeaway' ? 'Mang đi' : 'Giao hàng'}</p>
                </div>
                <div class="info-item">
                    <label>Thanh toán</label>
                    <p>${order.payment_method === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'}</p>
                </div>
                <div class="info-item">
                    ${order.table_number ? `<label>Bàn số</label><p>${order.table_number}</p>` : 
                      order.delivery_address ? `<label>Địa chỉ</label><p>${order.delivery_address}</p>` : ''}
                </div>
            </div>

            <table class="items-table">
                <thead>
                    <tr>
                        <th>Món ăn</th>
                        <th style="text-align: center;">SL</th>
                        <th style="text-align: right;">Đơn giá</th>
                        <th style="text-align: right;">Thành tiền</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map(item => `
                        <tr>
                            <td>
                                <span class="item-name">${item.item_name}</span>
                                ${item.size_name ? `<span class="item-options">Size: ${item.size_name}</span>` : ''}
                            </td>
                            <td style="text-align: center;">${item.quantity}</td>
                            <td style="text-align: right;">${item.unit_price.toLocaleString('vi-VN')}₫</td>
                            <td style="text-align: right;">${(item.quantity * item.unit_price).toLocaleString('vi-VN')}₫</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="summary-section">
                <div class="summary-row">
                    <span>Tạm tính:</span>
                    <span>${(order.total_amount - (order.shipping_fee || 0) + (order.discount_amount || 0)).toLocaleString('vi-VN')}₫</span>
                </div>
                ${order.discount_amount ? `
                <div class="summary-row" style="color: #e74c3c;">
                    <span>Giảm giá:</span>
                    <span>-${order.discount_amount.toLocaleString('vi-VN')}₫</span>
                </div>` : ''}
                ${order.shipping_fee ? `
                <div class="summary-row">
                    <span>Phí vận chuyển:</span>
                    <span>+${order.shipping_fee.toLocaleString('vi-VN')}₫</span>
                </div>` : ''}
                <div class="summary-row total">
                    <span>Tổng cộng:</span>
                    <span>${order.total_amount.toLocaleString('vi-VN')}₫</span>
                </div>
            </div>

            ${order.note ? `
            <div style="margin-top: 20px; padding: 15px; background: #f9f9f9; border-radius: 10px;">
                <label style="font-size: 0.8rem; color: #8B7355;">Ghi chú:</label>
                <p style="font-size: 0.9rem; color: #5C3A21; margin-top: 5px;">${order.note}</p>
            </div>` : ''}
        `;

        actions.style.display = 'flex';
        
        // Handle PDF Download directly
        const downloadBtn = document.getElementById('downloadInvoice');
        downloadBtn.onclick = (e) => {
            e.preventDefault();
            generateOrderPDF(order, items);
        };

    } catch (error) {
        console.error('Lỗi:', error);
        container.innerHTML = `<p style="text-align: center; color: #e74c3c;">${error.message}</p>`;
    }
}

async function generateOrderPDF(order, items) {
    const originalContent = document.getElementById('downloadInvoice').innerHTML;
    document.getElementById('downloadInvoice').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang tạo...';
    
    // Create a hidden element for PDF generation (receipt style)
    const element = document.createElement('div');
    element.style.padding = '20px';
    element.style.fontFamily = "'Inter', sans-serif, Arial";
    element.style.color = '#333';
    element.style.width = '148mm'; // A5 width
    
    const orderTime = new Date(order.created_at).toLocaleString('vi-VN');
    const orderCode = order.order_code || '#' + order.order_id;
    
    let itemsHtml = items.map(item => `
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px;">
            <div style="flex: 1;">
                <div>${item.item_name}</div>
                <div style="font-size: 12px; color: #777;">SL: ${item.quantity} x ${item.unit_price.toLocaleString('vi-VN')}₫</div>
            </div>
            <div style="font-weight: 500;">${(item.unit_price * item.quantity).toLocaleString('vi-VN')}₫</div>
        </div>
    `).join('');

    element.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #E67E22; margin: 0; font-size: 24px; letter-spacing: 1px;">CÀ PHÊ THÔNG MINH</h1>
            <p style="font-size: 13px; color: #666; margin: 5px 0;">123 Đường Cà Phê, Quận 1, TP.HCM</p>
            <p style="font-size: 13px; color: #666; margin: 0;">Hotline: 0965 147 941</p>
            <div style="margin: 15px 0; border-top: 1px dashed #ccc; border-bottom: 1px dashed #ccc; padding: 10px 0;">
                <h2 style="margin: 0; font-size: 18px; font-weight: 700;">BIÊN LAI THANH TOÁN</h2>
            </div>
        </div>
        
        <div style="margin-bottom: 20px; font-size: 13px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span style="color: #666;">Mã đơn hàng:</span>
                <span style="font-weight: 600;">${orderCode}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span style="color: #666;">Ngày đặt:</span>
                <span>${orderTime}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span style="color: #666;">Hình thức:</span>
                <span>${order.order_type === 'delivery' ? 'Giao hàng' : (order.order_type === 'takeaway' ? 'Mang về' : 'Tại chỗ')}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <span style="color: #666;">Thanh toán:</span>
                <span>${order.payment_method === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'}</span>
            </div>
        </div>
        
        <div style="margin-bottom: 20px; border-bottom: 1px dashed #ccc; padding-bottom: 15px;">
            <div style="font-weight: 700; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px;">DANH SÁCH MÓN</div>
            ${itemsHtml}
        </div>
        
        <div style="margin-bottom: 20px; font-size: 14px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span>Tạm tính:</span>
                <span>${(order.total_amount - (order.shipping_fee || 0) + (order.discount_amount || 0)).toLocaleString('vi-VN')}₫</span>
            </div>
            ${order.discount_amount ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px; color: #e74c3c;">
                <span>Giảm giá:</span>
                <span>-${order.discount_amount.toLocaleString('vi-VN')}₫</span>
            </div>` : ''}
            ${order.shipping_fee ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span>Phí vận chuyển:</span>
                <span>+${order.shipping_fee.toLocaleString('vi-VN')}₫</span>
            </div>` : ''}
            <div style="display: flex; justify-content: space-between; margin-top: 10px; padding-top: 10px; border-top: 1px solid #333; font-weight: 800; font-size: 18px;">
                <span>TỔNG CỘNG:</span>
                <span style="color: #E67E22;">${order.total_amount.toLocaleString('vi-VN')}₫</span>
            </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; border-top: 1px dashed #ccc; padding-top: 20px;">
            <p style="font-size: 14px; font-weight: 600; margin: 0;">Cảm ơn quý khách!</p>
            <p style="font-size: 12px; color: #777; margin: 5px 0;">Hẹn gặp lại bạn tại Cà Phê Thông Minh</p>
            <div style="margin-top: 15px;">
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(orderCode)}" alt="QR Code" style="width: 80px; height: 80px;">
            </div>
        </div>
    `;

    const opt = {
        margin: 0,
        filename: `BienLai-${orderCode}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 3, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a5', orientation: 'portrait' }
    };

    try {
        await html2pdf().set(opt).from(element).save();
    } catch (error) {
        console.error('PDF Error:', error);
        alert('Có lỗi khi tạo PDF. Vui lòng thử lại.');
    } finally {
        document.getElementById('downloadInvoice').innerHTML = originalContent;
    }
}

function getStatusText(status) {
    const statuses = {
        'pending': 'Chờ xác nhận',
        'paid': 'Đã thanh toán',
        'confirmed': 'Đã xác nhận',
        'preparing': 'Đang pha chế',
        'ready': 'Sẵn sàng phục vụ',
        'completed': 'Hoàn thành',
        'cancelled': 'Đã hủy'
    };
    return statuses[status] || status;
}
