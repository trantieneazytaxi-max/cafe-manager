/**
 * Shared Realtime Notification System (WebSocket)
 */
class NotificationSystem {
    constructor(role) {
        this.role = role; // 'admin' or 'staff'
        this.socket = null;
        this.init();
    }

    init() {
        // Load Socket.io client if not present
        if (typeof io === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdn.socket.io/4.7.4/socket.io.min.js';
            script.onload = () => this.connect();
            document.head.appendChild(script);
        } else {
            this.connect();
        }
    }

    connect() {
        // Connect to server (adjust port if needed)
        this.socket = io('http://localhost:5000');

        this.socket.on('connect', () => {
            console.log('⚡ Connected to WebSocket server');
            if (this.role === 'admin') this.socket.emit('join-admin');
            if (this.role === 'staff') this.socket.emit('join-staff');
        });

        this.socket.on('new-order', (data) => {
            this.showNotification(data);
            // Optional: Trigger a refresh of the dashboard if the function exists
            if (typeof refreshDashboard === 'function') {
                refreshDashboard();
            }
        });
    }

    showNotification(data) {
        const { order_code, total_amount, guest_name } = data;
        
        // Create notification element
        const toast = document.createElement('div');
        toast.className = 'realtime-toast';
        toast.innerHTML = `
            <div class="toast-icon"><i class="fas fa-shopping-cart"></i></div>
            <div class="toast-content">
                <div class="toast-title">Đơn hàng mới!</div>
                <div class="toast-body">
                    <strong>${order_code}</strong> - ${guest_name}<br>
                    Tổng: <strong>${Number(total_amount).toLocaleString()}₫</strong>
                </div>
            </div>
            <button class="toast-close">&times;</button>
        `;

        // Style the toast
        Object.assign(toast.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            backgroundColor: '#1e1e2d',
            color: '#fff',
            padding: '15px 20px',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
            zIndex: '10000',
            borderLeft: '4px solid #00f3ff',
            animation: 'slideIn 0.3s ease-out',
            fontFamily: "'Inter', sans-serif"
        });

        // Add to body
        document.body.appendChild(toast);

        // Play sound
        this.playSound();

        // Close on click
        toast.querySelector('.toast-close').onclick = () => toast.remove();

        // Auto remove after 10s
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.animation = 'slideOut 0.3s ease-in';
                setTimeout(() => toast.remove(), 300);
            }
        }, 10000);
    }

    playSound() {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(e => console.log('Auto-play blocked'));
    }
}

// Add animation styles to document
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    .realtime-toast .toast-icon { font-size: 24px; color: #00f3ff; }
    .realtime-toast .toast-title { font-weight: 700; font-size: 16px; margin-bottom: 5px; color: #00f3ff; }
    .realtime-toast .toast-body { font-size: 14px; opacity: 0.9; line-height: 1.4; }
    .realtime-toast .toast-close { background: none; border: none; color: #fff; font-size: 20px; cursor: pointer; opacity: 0.5; align-self: flex-start; }
    .realtime-toast .toast-close:hover { opacity: 1; }
`;
document.head.appendChild(style);
