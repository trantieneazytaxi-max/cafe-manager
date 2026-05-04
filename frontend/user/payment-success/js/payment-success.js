/**
 * PAYMENT SUCCESS PAGE SCRIPT
 */

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const orderIdParam = urlParams.get('orderId');
    if (orderIdParam) {
        sessionStorage.setItem('lastOrderId', orderIdParam);
    }

    initOrderInfo();
    initTime();
    
    // Only fire confetti on fresh payment (no orderId in URL)
    if (!urlParams.get('orderId')) {
        fireConfetti();
    }
    
    initPrintBtn();

    // Auto download if requested
    if (urlParams.get('download') === 'true') {
        setTimeout(() => {
            printOrderPDF(false);
        }, 1500);
    }
});

async function initOrderInfo() {
    const orderCodeEl = document.getElementById('orderCodeDisplay');
    const statusEl = document.getElementById('orderStatusDisplay');
    const urlParams = new URLSearchParams(window.location.search);
    const orderIdParam = urlParams.get('orderId');
    
    let lastOrderCode = sessionStorage.getItem('lastOrderCode');
    
    if (orderIdParam) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/orders/${orderIdParam}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                const order = data.order || data;
                lastOrderCode = order.order_code;
                
                // Update time as well
                const timeEl = document.getElementById('orderTime');
                if (timeEl && order.created_at) {
                    timeEl.textContent = new Date(order.created_at).toLocaleString('vi-VN');
                }

                // Update status for historical view
                if (statusEl) {
                    statusEl.textContent = getStatusText(order.status);
                    statusEl.className = `detail-value status-${order.status}`;
                }
            }
        } catch (e) {
            console.error('Fetch order info error:', e);
        }
    }

    if (orderCodeEl && lastOrderCode) {
        orderCodeEl.textContent = lastOrderCode;
    }
    
    // Check if it's a cash payment from URL (overrides if present)
    if (urlParams.get('method') === 'cash' && statusEl) {
        statusEl.textContent = 'Chờ thanh toán tại quầy';
        statusEl.className = 'detail-value status-pending';
    }

    // Hiển thị điểm tích lũy (nếu có)
    const earnedPoints = sessionStorage.getItem('lastEarnedPoints');
    if (earnedPoints && parseInt(earnedPoints) > 0) {
        const pointsRow = document.getElementById('earnedPointsRow');
        const pointsDisplay = document.getElementById('earnedPointsDisplay');
        if (pointsRow && pointsDisplay) {
            pointsRow.style.display = 'flex';
            pointsDisplay.textContent = `+${earnedPoints} điểm`;
        }
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

function initTime() {
    const timeEl = document.getElementById('orderTime');
    if (timeEl) {
        const now = new Date();
        timeEl.textContent = now.toLocaleString('vi-VN');
    }
}

function initPrintBtn() {
    const printBtn = document.getElementById('printPdfBtn');
    if (printBtn) {
        printBtn.addEventListener('click', () => printOrderPDF(false));
    }
    
    const previewBtn = document.getElementById('previewReceiptBtn');
    if (previewBtn) {
        previewBtn.addEventListener('click', showReceiptPreview);
    }
    
    const closeBtn = document.getElementById('closePreviewBtn');
    const closeBtn2 = document.getElementById('closePreviewBtn2');
    const modal = document.getElementById('receiptPreviewModal');
    
    if (closeBtn) closeBtn.onclick = () => modal.style.display = 'none';
    if (closeBtn2) closeBtn2.onclick = () => modal.style.display = 'none';
    
    const downloadBtn = document.getElementById('downloadPdfFromPreview');
    if (downloadBtn) {
        downloadBtn.onclick = () => printOrderPDF(true);
    }
}

async function showReceiptPreview() {
    const modal = document.getElementById('receiptPreviewModal');
    const content = document.getElementById('receiptContent');
    if (!modal || !content) return;
    
    modal.style.display = 'flex';
    content.innerHTML = '<div style="text-align: center; padding: 20px;"><i class="fas fa-spinner fa-spin"></i> Đang tải biên lai...</div>';
    
    const receiptHtml = await generateReceiptHtml();
    content.innerHTML = receiptHtml;
}

async function generateReceiptHtml() {
    const orderId = sessionStorage.getItem('lastOrderId');
    let order = null;
    let items = [];
    
    if (orderId) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/orders/${orderId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                order = data.order || data;
                items = data.items || [];
            }
        } catch (e) {
            console.error('Fetch order error:', e);
        }
    }
    
    const lastOrderCode = order?.order_code || sessionStorage.getItem('lastOrderCode') || 'CM-UNKNOWN';
    const orderTime = order ? new Date(order.created_at).toLocaleString('vi-VN') : (document.getElementById('orderTime')?.textContent || '---');
    
    let itemsHtml = items.map(item => `
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px;">
            <div style="flex: 1;">
                <div>${item.item_name}</div>
                <div style="font-size: 12px; color: #777;">SL: ${item.quantity} x ${formatCurrency(item.unit_price || item.price)}</div>
            </div>
            <div style="font-weight: 500;">${formatCurrency((item.unit_price || item.price) * item.quantity)}</div>
        </div>
    `).join('');

    if (items.length === 0) {
        itemsHtml = '<p style="text-align: center; color: #999;">Không có dữ liệu món ăn</p>';
    }

    return `
        <div id="pdf-export-element" style="padding: 20px; font-family: 'Inter', sans-serif, Arial; color: #333; line-height: 1.5; background: white;">
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
                    <span style="font-weight: 600;">${lastOrderCode}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span style="color: #666;">Ngày đặt:</span>
                    <span>${orderTime}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span style="color: #666;">Hình thức:</span>
                    <span>${order?.order_type === 'delivery' ? 'Giao hàng' : (order?.order_type === 'takeaway' ? 'Mang về' : 'Tại chỗ')}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span style="color: #666;">Thanh toán:</span>
                    <span>${order?.payment_method === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'}</span>
                </div>
            </div>
            
            <div style="margin-bottom: 20px; border-bottom: 1px dashed #ccc; padding-bottom: 15px;">
                <div style="font-weight: 700; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px;">DANH SÁCH MÓN</div>
                ${itemsHtml}
            </div>
            
            <div style="margin-bottom: 20px; font-size: 14px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span>Tạm tính:</span>
                    <span>${formatCurrency(order?.total_amount + (order?.discount_amount || 0) - (order?.shipping_fee || 0))}</span>
                </div>
                ${order?.discount_amount > 0 ? `
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px; color: #e74c3c;">
                    <span>Giảm giá:</span>
                    <span>-${formatCurrency(order.discount_amount)}</span>
                </div>` : ''}
                ${order?.shipping_fee > 0 ? `
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span>Phí vận chuyển:</span>
                    <span>${formatCurrency(order.shipping_fee)}</span>
                </div>` : ''}
                <div style="display: flex; justify-content: space-between; margin-top: 10px; padding-top: 10px; border-top: 1px solid #333; font-weight: 800; font-size: 18px;">
                    <span>TỔNG CỘNG:</span>
                    <span style="color: #E67E22;">${formatCurrency(order?.total_amount || 0)}</span>
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px; border-top: 1px dashed #ccc; padding-top: 20px;">
                <p style="font-size: 14px; font-weight: 600; margin: 0;">Cảm ơn quý khách!</p>
                <p style="font-size: 12px; color: #777; margin: 5px 0;">Hẹn gặp lại bạn tại Cà Phê Thông Minh</p>
                <div style="margin-top: 15px;">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(lastOrderCode)}" alt="QR Code" style="width: 80px; height: 80px;">
                </div>
            </div>
        </div>
    `;
}

async function printOrderPDF(fromPreview = false) {
    const lastOrderCode = sessionStorage.getItem('lastOrderCode') || '#CM-UNKNOWN';
    
    let element;
    if (fromPreview) {
        element = document.getElementById('pdf-export-element');
    } else {
        const html = await generateReceiptHtml();
        element = document.createElement('div');
        element.innerHTML = html;
        document.body.appendChild(element); // Tạm thời add để html2pdf capture
        element.style.position = 'absolute';
        element.style.left = '-9999px';
    }
    
    const opt = {
        margin: 0,
        filename: `BienLai-${lastOrderCode}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 3, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a5', orientation: 'portrait' }
    };

    try {
        const btn = fromPreview ? document.getElementById('downloadPdfFromPreview') : document.getElementById('printPdfBtn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang tạo...';
        btn.disabled = true;
        
        await html2pdf().set(opt).from(element).save();
        
        btn.innerHTML = originalText;
        btn.disabled = false;
        
        if (!fromPreview) {
            document.body.removeChild(element);
        }
    } catch (error) {
        console.error('PDF Error:', error);
        alert('Có lỗi khi tạo PDF. Vui lòng thử lại.');
    }
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
}

function fireConfetti() {
    if (typeof confetti !== 'function') return;
    
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
            return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
    }, 250);
}


