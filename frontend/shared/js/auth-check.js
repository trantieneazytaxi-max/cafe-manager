// frontend/shared/js/auth-check.js
(function checkAuth() {
    // Danh sách trang công khai - không cần đăng nhập
    const PUBLIC_PAGES = [
        'index.html',      // Trang chủ
        'menu.html',       // Xem thực đơn
        'tables.html',     // Đặt bàn
        'payment.html',    // Thanh toán
        'orders.html',     // Xem đơn hàng
    ];

    const currentPage = window.location.pathname.split('/').pop();

    // Nếu là trang công khai → bỏ qua kiểm tra
    if (PUBLIC_PAGES.includes(currentPage)) return;

    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token || role !== 'staff') {
        window.location.href = '../../../auth/html/auth.html';
        return;
    }
})();