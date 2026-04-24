/**
 * PAYMENT SUCCESS PAGE SCRIPT
 */

document.addEventListener('DOMContentLoaded', () => {
    initOrderInfo();
    initTime();
    fireConfetti();
    initPrintBtn();
});

function initOrderInfo() {
    const orderCodeEl = document.getElementById('orderCodeDisplay');
    const statusEl = document.getElementById('orderStatusDisplay');
    const lastOrderCode = sessionStorage.getItem('lastOrderCode');
    
    if (orderCodeEl && lastOrderCode) {
        orderCodeEl.textContent = lastOrderCode;
    }
    
    // Check if it's a cash payment from URL
    const urlParams = new URLSearchParams(window.location.search);
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
        printBtn.addEventListener('click', printOrderPDF);
    }
}

async function printOrderPDF() {
    const lastOrderCode = sessionStorage.getItem('lastOrderCode') || '#CM-UNKNOWN';
    const orderTime = document.getElementById('orderTime')?.textContent || '---';
    
    // Tạo nội dung hóa đơn tạm thời để in
    const element = document.createElement('div');
    element.innerHTML = `
        <div style="padding: 40px; font-family: 'Inter', sans-serif; color: #333;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #E67E22; margin-bottom: 5px;">CÀ PHÊ THÔNG MINH</h1>
                <p style="font-size: 14px; color: #777;">123 Đường Cà Phê, Quận 1, TP.HCM</p>
                <div style="margin-top: 20px; border-top: 2px solid #eee; border-bottom: 2px solid #eee; padding: 15px 0;">
                    <h2 style="margin: 0; font-size: 18px;">HÓA ĐƠN TẠM TÍNH</h2>
                </div>
            </div>
            
            <div style="margin-bottom: 30px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span style="font-weight: 600;">Mã đơn hàng:</span>
                    <span>${lastOrderCode}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span style="font-weight: 600;">Thời gian:</span>
                    <span>${orderTime}</span>
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 50px; color: #777; font-size: 12px;">
                <p>Cảm ơn quý khách. Hẹn gặp lại!</p>
                <p>Mã hóa đơn này dùng để đối soát tại quầy.</p>
            </div>
        </div>
    `;

    const opt = {
        margin: 10,
        filename: `Order-${lastOrderCode}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a5', orientation: 'portrait' }
    };

    try {
        const btn = document.getElementById('printPdfBtn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang tạo...';
        btn.disabled = true;
        
        await html2pdf().set(opt).from(element).save();
        
        btn.innerHTML = originalText;
        btn.disabled = false;
    } catch (error) {
        console.error('PDF Error:', error);
        alert('Có lỗi khi tạo PDF. Vui lòng thử lại.');
    }
}

function fireConfetti() {
    // Giữ nguyên code cũ
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


