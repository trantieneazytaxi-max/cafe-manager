/**
 * ADMIN PASSWORD REQUESTS - CYBERPUNK THEME
 */

let requests = [];

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../../auth/html/admin-login.html';
        return;
    }
    
    loadRequests();
    
    // Refresh interval every 30s
    setInterval(loadRequests, 30000);
});

async function loadRequests() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/forgot-password/requests', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Không thể tải yêu cầu');
        
        requests = await response.json();
        updateMiniStats();
        renderRequests();
        
    } catch (error) {
        console.error('Lỗi tải requests:', error);
        const tbody = document.getElementById('requestTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: #ff0055;">⚠️ LỖI TẢI DỮ LIỆU</td></tr>';
        }
    }
}

function updateMiniStats() {
    const pending = requests.length;
    // For now, completed requests aren't returned by the 'pending' endpoint, 
    // but we can show the total and pending correctly.
    document.getElementById('pendingRequestsCount').textContent = pending;
    document.getElementById('totalRequestsCount').textContent = pending; 
    document.getElementById('completedRequestsCount').textContent = 0; // Mock or update if API provides
}

function renderRequests() {
    const tbody = document.getElementById('requestTableBody');
    if (!tbody) return;
    
    if (requests.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 3rem; color: #8892b0;">CHƯA CÓ YÊU CẦU NÀO CẦN XỬ LÝ</td></tr>';
        return;
    }
    
    tbody.innerHTML = requests.map(req => {
        const expiresAt = new Date(req.expires_at);
        const now = new Date();
        const isExpired = expiresAt < now;
        
        return `
            <tr>
                <td><strong>${escapeHtml(req.full_name)}</strong> <br> <small style="color: #8892b0;">${req.role === 'staff' ? 'Nhân viên' : 'Admin'}</small></td>
                <td>${escapeHtml(req.email)}</td>
                <td>${req.phone || '---'}</td>
                <td>
                    <div style="font-size: 0.8rem;">YC: ${formatDateTime(req.created_at)}</div>
                    <div style="font-size: 0.75rem; color: ${isExpired ? '#ff0055' : '#8892b0'};">HH: ${formatDateTime(req.expires_at)}</div>
                </td>
                <td>
                    <span class="badge ${isExpired ? 'badge-danger' : 'badge-warning'}">
                        ${isExpired ? 'HẾT HẠN' : 'CHỜ XỬ LÝ'}
                    </span>
                </td>
                <td style="text-align: right;">
                    <div style="display: flex; gap: 10px; justify-content: flex-end;">
                        ${!isExpired ? `
                            <button class="btn-icon" onclick="approveReset(${req.id}, '${escapeHtml(req.email)}')" title="Phê duyệt">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : ''}
                        <button class="btn-icon" style="color: #ff0055; background: rgba(255, 0, 85, 0.1);" onclick="rejectRequest(${req.id})" title="Xóa">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

async function approveReset(id, email) {
    const newPass = prompt(`Nhập mật khẩu mới cho ${email}:`, "Cafe123456");
    if (!newPass) return;
    
    try {
        const token = localStorage.getItem('token');
        const req = requests.find(r => r.id === id);
        
        const response = await fetch('http://localhost:5000/api/forgot-password/reset', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                token: req.token,
                email: req.email,
                new_password: newPass
            })
        });
        
        if (response.ok) {
            alert('Đã đặt lại mật khẩu thành công!');
            loadRequests();
        } else {
            const data = await response.json();
            alert('Lỗi: ' + data.message);
        }
    } catch (error) {
        console.error('Reset error:', error);
    }
}

async function rejectRequest(id) {
    if (!confirm('Xóa yêu cầu này?')) return;
    // Mock delete if no endpoint, or update if exists
    alert('Đã xóa yêu cầu.');
    requests = requests.filter(r => r.id !== id);
    renderRequests();
    updateMiniStats();
}

function formatDateTime(dateStr) {
    if (!dateStr) return '---';
    const date = new Date(dateStr);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}