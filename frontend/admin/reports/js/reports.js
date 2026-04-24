/**
 * REPORTS & ANALYTICS - CYBERPUNK THEME
 */

let revenueChart = null;
let categoryChart = null;

document.addEventListener('DOMContentLoaded', () => {
    loadReportData();
});

async function loadReportData() {
    const range = document.getElementById('timeRange').value;
    const token = localStorage.getItem('token');
    
    try {
        const statsRes = await fetch(`http://localhost:5000/api/admin/stats?range=${range}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const stats = await statsRes.json();
        updateOverviewCards(stats);
        renderRevenueChart(stats);

        const catRes = await fetch(`http://localhost:5000/api/admin/category-stats?range=${range}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const catData = await catRes.json();
        renderCategoryChart(catData);

        const topRes = await fetch(`http://localhost:5000/api/admin/top-items?range=${range}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const topItems = await topRes.json();
        renderTopItemsTable(topItems, stats.totalRevenue);

    } catch (error) {
        console.error('Lỗi load báo cáo:', error);
    }
}

function updateOverviewCards(stats) {
    document.getElementById('totalRevenue').textContent = formatCurrency(stats.totalRevenue);
    document.getElementById('totalOrders').textContent = stats.totalOrders;
    document.getElementById('totalCustomers').textContent = stats.totalCustomers;
    
    const avg = stats.totalOrders > 0 ? stats.totalRevenue / stats.totalOrders : 0;
    document.getElementById('avgOrderValue').textContent = formatCurrency(avg);

    const revTrend = document.getElementById('revenueTrend');
    revTrend.textContent = (stats.revenueChange >= 0 ? '↑' : '↓') + Math.abs(stats.revenueChange) + '%';
    revTrend.className = stats.revenueChange >= 0 ? 'trend-up' : 'trend-down';
    
    const ordersTrend = document.getElementById('ordersTrend');
    ordersTrend.textContent = (stats.ordersChange >= 0 ? '↑' : '↓') + Math.abs(stats.ordersChange) + '%';
    ordersTrend.className = stats.ordersChange >= 0 ? 'trend-up' : 'trend-down';
}

function renderRevenueChart(stats) {
    const ctx = document.getElementById('revenueChart').getContext('2d');
    if (revenueChart) revenueChart.destroy();
    
    revenueChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: stats.labels,
            datasets: [{
                label: 'Doanh thu',
                data: stats.revenueData,
                borderColor: '#00f3ff',
                backgroundColor: 'rgba(0, 243, 255, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#ff0055',
                pointBorderColor: '#fff',
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(13, 13, 26, 0.9)',
                    titleFont: { family: 'Orbitron' },
                    bodyFont: { family: 'Inter' },
                    borderColor: '#00f3ff',
                    borderWidth: 1
                }
            },
            scales: {
                y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#8892b0', font: { family: 'Orbitron', size: 10 } } },
                x: { grid: { display: false }, ticks: { color: '#8892b0', font: { family: 'Orbitron', size: 10 } } }
            }
        }
    });
}

function renderCategoryChart(data) {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    if (categoryChart) categoryChart.destroy();
    
    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.labels,
            datasets: [{
                data: data.values,
                backgroundColor: ['#00f3ff', '#ff0055', '#00ff88', '#f1c40f', '#9b59b6', '#ff9f43'],
                borderWidth: 2,
                borderColor: '#0d0d1a',
                hoverOffset: 15
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { color: '#8892b0', font: { family: 'Orbitron', size: 10 }, usePointStyle: true, padding: 15 } }
            }
        }
    });
}

function renderTopItemsTable(items, totalRevenue) {
    const tbody = document.getElementById('topItemsBody');
    if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem;">Không có dữ liệu</td></tr>';
        return;
    }
    
    tbody.innerHTML = items.map((item, index) => {
        const percent = totalRevenue > 0 ? (item.total_revenue / totalRevenue * 100).toFixed(1) : 0;
        return `
            <tr>
                <td><span class="rank">${index + 1}</span></td>
                <td><strong>${item.item_name}</strong></td>
                <td><span class="badge" style="background: rgba(0, 243, 255, 0.05); color: #00f3ff; border: 1px solid rgba(0, 243, 255, 0.2);">${item.category_name}</span></td>
                <td>${item.total_quantity}</td>
                <td>${formatCurrency(item.total_revenue)}</td>
                <td>
                    <div style="display: flex; align-items: center; gap: 10px; min-width: 120px;">
                        <div style="flex-grow: 1; background: rgba(255, 255, 255, 0.05); height: 6px; border-radius: 3px; overflow: hidden; border: 1px solid rgba(0, 243, 255, 0.1);">
                            <div style="width: ${percent}%; background: linear-gradient(90deg, #00f3ff, #ff0055); height: 100%; box-shadow: 0 0 10px rgba(0, 243, 255, 0.5);"></div>
                        </div>
                        <span style="font-family: 'Orbitron', sans-serif; font-size: 0.7rem; color: #00ff88; width: 35px;">${percent}%</span>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}
