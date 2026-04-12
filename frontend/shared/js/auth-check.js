// frontend/shared/js/auth-check.js
(function checkAuth() {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    if (!token) {
        // Đường dẫn tương đối từ vị trí hiện tại
        window.location.href = '../../../auth/html/auth.html';
        return;
    }
    
    if (role !== 'staff') {
        window.location.href = '../../../auth/html/auth.html';
        return;
    }
})();