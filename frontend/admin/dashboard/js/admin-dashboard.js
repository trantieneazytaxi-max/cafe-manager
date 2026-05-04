/**
 * ADMIN DASHBOARD - CYBERPUNK EDITION
 */

// State
let currentRange = 'day';
let revenueChart = null;
let categoryChart = null;
let currentChartType = 'revenue';

// DOM Elements
const rangeBtns = document.querySelectorAll('.range-btn');
const refreshBtn = document.getElementById('refreshBtn');
const totalRevenueEl = document.getElementById('totalRevenue');
const totalOrdersEl = document.getElementById('totalOrders');
const totalCustomersEl = document.getElementById('totalCustomers');
const revenueChangeEl = document.getElementById('revenueChange');
const ordersChangeEl = document.getElementById('ordersChange');
const customersChangeEl = document.getElementById('customersChange');
const avgRevenueEl = document.getElementById('avgRevenue');
const maxRevenueEl = document.getElementById('maxRevenue');
const minRevenueEl = document.getElementById('minRevenue');
const topItemsBody = document.getElementById('topItemsBody');
const searchInput = document.getElementById('searchItem');
const sortSelect = document.getElementById('sortBy');

// Check authentication
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    if (!token || role !== 'admin') {
        window.location.href = '../../auth/html/admin-login.html';
        return;
    }
    
    loadUserInfo();
    loadDashboardData();
    loadRatingData();
    initEventListeners();
});

// Load user info
function loadUserInfo() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const adminName = document.getElementById('adminName');
    const adminAvatar = document.getElementById('adminAvatar');
    
    if (adminName) adminName.textContent = user.full_name || 'Admin';
    if (adminAvatar) {
        adminAvatar.src = user.avatar_url || `https://ui-avatars.com/api/?background=ff0055&color=fff&rounded=true&name=${encodeURIComponent(user.full_name || 'Admin')}`;
    }
}

// Load rating data for bar chart
async function loadRatingData() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/admin/ratings?range=${currentRange}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        updateRatingBars(data);
        
    } catch (error) {
        console.error('Lỗi tải đánh giá:', error);
        // Fallback mock data
        updateRatingBars([
            { star: 5, count: 45, percent: 45 },
            { star: 4, count: 30, percent: 30 },
            { star: 3, count: 15, percent: 15 },
            { star: 2, count: 7, percent: 7 },
            { star: 1, count: 3, percent: 3 }
        ]);
    }
}

// Update rating bars with animation
function updateRatingBars(ratings) {
    ratings.forEach(rating => {
        const bar = document.getElementById(`rating-bar-${rating.star}`);
        const percent = document.getElementById(`rating-percent-${rating.star}`);
        if (bar) {
            bar.style.width = `${rating.percent}%`;
        }
        if (percent) {
            percent.textContent = `${rating.percent}%`;
        }
    });
}

// Load dashboard data
async function loadDashboardData() {
    try {
        const token = localStorage.getItem('token');
        
        const statsResponse = await fetch(`http://localhost:5000/api/admin/stats?range=${currentRange}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const stats = await statsResponse.json();
        
        if (totalRevenueEl) totalRevenueEl.textContent = formatCurrency(stats.totalRevenue || 0);
        if (totalOrdersEl) totalOrdersEl.textContent = stats.totalOrders || 0;
        if (totalCustomersEl) totalCustomersEl.textContent = stats.totalCustomers || 0;
        
        if (revenueChangeEl) {
            revenueChangeEl.textContent = `${stats.revenueChange >= 0 ? '+' : ''}${stats.revenueChange || 0}%`;
            revenueChangeEl.className = `stat-change ${stats.revenueChange >= 0 ? 'positive' : 'negative'}`;
        }
        if (ordersChangeEl) {
            ordersChangeEl.textContent = `${stats.ordersChange >= 0 ? '+' : ''}${stats.ordersChange || 0}%`;
            ordersChangeEl.className = `stat-change ${stats.ordersChange >= 0 ? 'positive' : 'negative'}`;
        }
        if (customersChangeEl) {
            customersChangeEl.textContent = `${stats.customersChange >= 0 ? '+' : ''}${stats.customersChange || 0}%`;
            customersChangeEl.className = `stat-change ${stats.customersChange >= 0 ? 'positive' : 'negative'}`;
        }
        
        // Cập nhật biểu đồ phân tích (Line + Bar)
        updateRevenueChart(stats);
        
        await loadChartData();
        await loadTopItems();
        await loadRatingData();
        
    } catch (error) {
        console.error('Lỗi tải dashboard:', error);
    }
}

// Load chart data
async function loadChartData() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/admin/chart-data?range=${currentRange}&type=${currentChartType}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        updateChartStats(data);
        await loadCategoryData();
        
    } catch (error) {
        console.error('Lỗi tải biểu đồ:', error);
    }
}

// Update revenue chart 
function updateRevenueChart(data) {
    const ctx = document.getElementById('revenueChart').getContext('2d');
    
    // Xóa chart cũ nếu tồn tại
    if (revenueChart) {
        revenueChart.destroy();
    }

    if (!data || !data.labels || data.labels.length === 0) {
        console.warn('Không có dữ liệu biểu đồ');
        return;
    }

    revenueChart = new Chart(ctx, {
        type: 'bar', // Mặc định là cột
        data: {
            labels: data.labels,
            datasets: [
                {
                    label: 'Doanh thu (VNĐ)',
                    data: data.revenueData,
                    type: 'line', // Chuyển sang đường
                    borderColor: '#00f3ff',
                    backgroundColor: 'rgba(0, 243, 255, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    yAxisID: 'y'
                },
                {
                    label: 'Số lượng khách',
                    data: data.customerData,
                    type: 'bar', // Giữ là cột
                    backgroundColor: 'rgba(255, 0, 85, 0.5)',
                    hoverBackgroundColor: '#ff0055',
                    yAxisID: 'y1', // Trục ẩn
                    barThickness: 20
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            let value = context.parsed.y;
                            if (context.datasetIndex === 0) {
                                return label + ': ' + value.toLocaleString() + ' VNĐ';
                            }
                            return label + ': ' + value + ' khách';
                        }
                    }
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    position: 'left',
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: {
                        color: '#8892b0',
                        // Trục tung hiển thị bước 500k theo triệu đồng
                        callback: function(value) {
                            if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
                            if (value > 0) return (value / 1000).toFixed(0) + 'K';
                            return value;
                        },
                        stepSize: 500000
                    }
                },
                y1: {
                    display: false, // Ẩn trục của khách để tránh rối
                    position: 'right',
                    grid: { drawOnChartArea: false }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#8892b0' }
                }
            }
        }
    });

    // Gọi hàm tính toán so sánh
    calculateComparison(data);
}

function calculateComparison(data) {
    const currentRev = data.totalRevenue || 0;
    const prevRev = data.prevTotalRevenue || 0;
    const currentCust = data.totalCustomers || 0;
    const prevCust = data.prevTotalCustomers || 0;

    // Tính % doanh thu
    const revDiff = prevRev !== 0 ? ((currentRev - prevRev) / prevRev * 100).toFixed(1) : 0;
    const revEl = document.getElementById('compareRevenue');
    const revDetail = document.getElementById('compareRevenueDetail');
    
    revEl.innerText = (revDiff >= 0 ? '+' : '') + revDiff + '%';
    revEl.className = 'value ' + (revDiff >= 0 ? 'text-success' : 'text-danger');
    revDetail.innerText = `Trước: ${prevRev.toLocaleString()}đ`;

    // Tính số khách
    const custDiff = currentCust - prevCust;
    const custEl = document.getElementById('compareCustomers');
    const custDetail = document.getElementById('compareCustomersDetail');

    custEl.innerText = (custDiff >= 0 ? '+' : '') + custDiff + ' người';
    custEl.className = 'value ' + (custDiff >= 0 ? 'text-success' : 'text-danger');
    custDetail.innerText = `Trước: ${prevCust} người`;
}

// Update chart stats
function updateChartStats(data) {
    const values = data.values || [];
    if (values.length > 0) {
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const max = Math.max(...values);
        const min = Math.min(...values);
        
        if (avgRevenueEl) avgRevenueEl.textContent = formatCurrency(avg);
        if (maxRevenueEl) maxRevenueEl.textContent = formatCurrency(max);
        if (minRevenueEl) minRevenueEl.textContent = formatCurrency(min);
    }
}

// Load category data for pie chart
async function loadCategoryData() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/admin/category-stats?range=${currentRange}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        updateCategoryChart(data);
        updatePieLegend(data);
        
    } catch (error) {
        console.error('Lỗi tải biểu đồ tròn:', error);
    }
}

// Update pie chart - 3 colors neon
function updateCategoryChart(data) {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    
    if (categoryChart) {
        categoryChart.destroy();
    }
    
    // Chỉ lấy 3 danh mục đầu tiên và gộp các danh mục còn lại
    let labels = data.labels || [];
    let values = data.values || [];
    
    if (labels.length > 3) {
        const otherValue = values.slice(3).reduce((a, b) => a + b, 0);
        labels = labels.slice(0, 3);
        values = values.slice(0, 3);
        if (otherValue > 0) {
            labels.push('Khác');
            values.push(otherValue);
        }
    }
    
    const colors = ['#ff0055', '#00f3ff', '#00ff88', '#ffb347'];
    
    categoryChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors.slice(0, labels.length),
                borderWidth: 0,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(13, 13, 26, 0.95)',
                    titleColor: '#00f3ff',
                    bodyColor: '#fff',
                    borderColor: '#00f3ff',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percent = ((value / total) * 100).toFixed(1);
                            return `${label}: ${formatCurrency(value)} (${percent}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Update pie legend
function updatePieLegend(data) {
    const legendContainer = document.getElementById('pieLegend');
    if (!legendContainer) return;
    
    let labels = data.labels || [];
    if (labels.length > 3) {
        labels = labels.slice(0, 3);
    }
    
    const colors = ['#ff0055', '#00f3ff', '#00ff88'];
    
    legendContainer.innerHTML = labels.map((label, index) => `
        <div class="legend-item">
            <div class="legend-color" style="background: ${colors[index % colors.length]}; box-shadow: 0 0 8px ${colors[index % colors.length]};"></div>
            <span>${label}</span>
        </div>
    `).join('');
}

// Load top items
async function loadTopItems() {
    try {
        const token = localStorage.getItem('token');
        const search = searchInput?.value || '';
        const sortBy = sortSelect?.value || 'quantity';
        
        const response = await fetch(`http://localhost:5000/api/admin/top-items?range=${currentRange}&search=${search}&sortBy=${sortBy}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const items = await response.json();
        
        renderTopItems(items);
        
    } catch (error) {
        console.error('Lỗi tải top món:', error);
        if (topItemsBody) {
            topItemsBody.innerHTML = '<td><td colspan="6" class="loading">⚠️ KHÔNG THỂ TẢI DỮ LIỆU</td></tr>';
        }
    }
}

// Render top items table
function renderTopItems(items) {
    if (!topItemsBody) return;
    
    if (!items || items.length === 0) {
        topItemsBody.innerHTML = '<tr><td colspan="6" class="loading">📊 CHƯA CÓ DỮ LIỆU</td></tr>';
        return;
    }
    
    topItemsBody.innerHTML = items.map((item, index) => `
        <tr>
            <td class="rank">#${index + 1}</td>
            <td>${escapeHtml(item.item_name)}</td>
            <td>${escapeHtml(item.category_name)}</td>
            <td>${item.total_quantity || 0}</td>
            <td>${formatCurrency(item.total_revenue || 0)}</td>
            <td>${item.last_sold_date ? new Date(item.last_sold_date).toLocaleDateString('vi-VN') : 'Chưa có'}</td>
        </tr>
    `).join('');
}

// Format currency
// Dùng formatCurrency từ api.js


// Escape HTML
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Event listeners
function initEventListeners() {
    rangeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            rangeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentRange = btn.getAttribute('data-range');
            loadDashboardData();
        });
    });
    
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            loadDashboardData();
        });
    }
    
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            loadTopItems();
        });
    }
    
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            loadTopItems();
        });
    }
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = '../../auth/html/admin-login.html';
        });
    }
    
    document.querySelectorAll('.chart-type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.chart-type-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentChartType = btn.getAttribute('data-chart');
            loadChartData();
        });
    });
}