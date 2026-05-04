/**
 * MENU MANAGEMENT LOGIC - ADVANCED CUSTOMIZATIONS
 */

let allItems = [];
let categories = [];

document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    loadItems();
    
    document.getElementById('itemForm').addEventListener('submit', handleFormSubmit);
    document.getElementById('categoryForm').addEventListener('submit', handleCategoryFormSubmit);
    
    // Close modal on outside click
    document.getElementById('itemModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });
    
    // Close category modal on outside click
    document.getElementById('categoryModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeCategoryModal();
        }
    });
});

async function loadCategories() {
    try {
        const response = await fetch('http://localhost:5000/api/menu/categories');
        categories = await response.json();
        const catFilter = document.getElementById('categoryFilter');
        const itemCatSelect = document.getElementById('itemCategory');
        const optionsHtml = categories.map(c => `<option value="${c.category_id}">${c.category_name}</option>`).join('');
        catFilter.innerHTML = '<option value="all">TẤT CẢ DANH MỤC</option>' + optionsHtml;
        itemCatSelect.innerHTML = optionsHtml;
    } catch (error) {
        console.error('Lỗi load categories:', error);
    }
}

async function loadItems() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/menu/admin/items', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        allItems = Array.isArray(data) ? data : [];
        updateMiniStats();
        renderItems(allItems);
    } catch (error) {
        console.error('Lỗi load items:', error);
    }
}

function updateMiniStats() {
    document.getElementById('totalItemsCount').textContent = allItems.length;
    document.getElementById('availableItemsCount').textContent = allItems.filter(i => i.status === 'available').length;
    document.getElementById('outOfStockCount').textContent = allItems.filter(i => i.is_paused).length; // Tạm dừng
    document.getElementById('hiddenItemsCount').textContent = allItems.filter(i => i.status === 'hidden').length;
}

function renderItems(items) {
    const tbody = document.getElementById('menuTableBody');
    if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: #8892b0;">KHÔNG TÌM THẤY MÓN NÀO</td></tr>';
        return;
    }
    
    tbody.innerHTML = items.map(item => `
        <tr style="${item.is_paused ? 'opacity: 0.6;' : ''}">
            <td>
                <img src="${item.image_url || 'https://ui-avatars.com/api/?name=Item&background=0d0d1a&color=00f3ff&size=50'}" class="item-img" onerror="this.src='https://ui-avatars.com/api/?name=Item&background=0d0d1a&color=00f3ff&size=50'">
            </td>
            <td>
                <strong>${item.item_name}</strong>
                ${item.is_recommended ? '<br><small style="color: #ff0055; font-weight: 600;"><i class="fas fa-fire"></i> BÁN CHẠY</small>' : ''}
                ${item.is_paused ? '<br><small style="color: #f1c40f; font-weight: 600;"><i class="fas fa-pause-circle"></i> TẠM DỪNG</small>' : ''}
            </td>
            <td>${item.category_name}</td>
            <td><strong>${formatCurrency(item.price)}</strong></td>
            <td>
                <span class="badge ${item.is_paused ? 'badge-warning' : getStatusBadgeClass(item.status)}">
                    ${item.is_paused ? 'HẾT HÀNG' : getStatusText(item.status)}
                </span>
            </td>
            <td style="text-align: right;">
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button class="btn-icon" onclick="openEditModal(${item.item_id})" title="Chỉnh sửa">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon" style="color: #ff0055; background: rgba(255, 0, 85, 0.1);" onclick="deleteItem(${item.item_id})" title="Xóa">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Helpers
// Dùng formatCurrency từ api.js

function getStatusBadgeClass(status) {
    return status === 'available' ? 'badge-success' : 'badge-danger';
}
function getStatusText(status) {
    return status === 'available' ? 'CÔNG KHAI' : 'ĐÃ ẨN';
}

function filterItems() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const cat = document.getElementById('categoryFilter').value;
    const status = document.getElementById('statusFilter').value;
    
    const filtered = allItems.filter(item => {
        const matchesSearch = item.item_name.toLowerCase().includes(search);
        const matchesCat = cat === 'all' || item.category_id == cat;
        const matchesStatus = status === 'all' || item.status === status;
        return matchesSearch && matchesCat && matchesStatus;
    });
    renderItems(filtered);
}

// Modal Handlers
function openAddModal() {
    document.getElementById('modalTitle').textContent = 'THÊM MÓN MỚI';
    document.getElementById('itemForm').reset();
    document.getElementById('itemId').value = '';
    document.getElementById('sizesContainer').innerHTML = '';
    document.getElementById('toppingsContainer').innerHTML = '';
    document.getElementById('comboItemsSection').style.display = 'none';
    document.getElementById('isCombo').checked = false;
    document.getElementById('comboItemsContainer').innerHTML = '';
    document.getElementById('itemModal').classList.add('active');

}

function openEditModal(id) {
    const item = allItems.find(i => i.item_id == id);
    if (!item) return;
    
    document.getElementById('modalTitle').textContent = 'CHỈNH SỬA MÓN';
    document.getElementById('itemId').value = item.item_id;
    document.getElementById('itemName').value = item.item_name;
    document.getElementById('itemCategory').value = item.category_id;
    document.getElementById('itemPrice').value = item.price;
    document.getElementById('itemDesc').value = item.description || '';
    document.getElementById('itemImage').value = item.image_url || '';
    document.getElementById('itemStatus').value = item.status;
    document.getElementById('isRecommended').checked = item.is_recommended;
    document.getElementById('isPaused').checked = item.is_paused;
    document.getElementById('isCombo').checked = item.is_combo;
    
    toggleComboSection();
    
    // Handle Combo Items
    const comboContainer = document.getElementById('comboItemsContainer');
    comboContainer.innerHTML = '';
    if (item.is_combo && item.combo_items) {
        item.combo_items.forEach(ci => addComboItemField(ci.child_item_id, ci.quantity));
    }

    
    // Handle Customizations
    const sizesContainer = document.getElementById('sizesContainer');
    const toppingsContainer = document.getElementById('toppingsContainer');
    sizesContainer.innerHTML = '';
    toppingsContainer.innerHTML = '';
    
    if (item.customizations) {
        const custom = typeof item.customizations === 'string' ? JSON.parse(item.customizations) : item.customizations;
        if (custom.sizes) {
            custom.sizes.forEach(s => addSizeField(s.name, s.extraPrice));
        }
        if (custom.toppings) {
            custom.toppings.forEach(t => addToppingField(t.name, t.price));
        }
    }
    
    document.getElementById('itemModal').classList.add('active');
}

function closeModal() {
    document.getElementById('itemModal').classList.remove('active');
}

// Dynamic Field Functions
function addSizeField(name = '', extraPrice = 0) {
    const container = document.getElementById('sizesContainer');
    const div = document.createElement('div');
    div.style.display = 'grid';
    div.style.gridTemplateColumns = '1fr 1fr auto';
    div.style.gap = '10px';
    div.innerHTML = `
        <input type="text" placeholder="Tên Size (VD: L)" value="${name}" class="size-name" style="padding: 5px 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: #fff;">
        <input type="number" placeholder="+ Giá (VNĐ)" value="${extraPrice}" class="size-price" style="padding: 5px 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: #fff;">
        <button type="button" onclick="this.parentElement.remove()" style="background: transparent; border: none; color: #ff0055; cursor: pointer;"><i class="fas fa-times"></i></button>
    `;
    container.appendChild(div);
}

function toggleComboSection() {
    const isCombo = document.getElementById('isCombo').checked;
    document.getElementById('comboItemsSection').style.display = isCombo ? 'block' : 'none';
}

function addComboItemField(itemId = '', quantity = 1) {
    const container = document.getElementById('comboItemsContainer');
    const div = document.createElement('div');
    div.style.display = 'grid';
    div.style.gridTemplateColumns = '2fr 1fr auto';
    div.style.gap = '10px';
    
    const options = allItems
        .filter(i => !i.is_combo)
        .map(i => `<option value="${i.item_id}" ${i.item_id == itemId ? 'selected' : ''}>${i.item_name}</option>`)
        .join('');

    div.innerHTML = `
        <select class="combo-item-id" style="padding: 5px 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: #fff;">
            ${options}
        </select>
        <input type="number" placeholder="SL" value="${quantity}" class="combo-item-qty" style="padding: 5px 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: #fff;">
        <button type="button" onclick="this.parentElement.remove()" style="background: transparent; border: none; color: #ff0055; cursor: pointer;"><i class="fas fa-times"></i></button>
    `;
    container.appendChild(div);
}


function addToppingField(name = '', price = 0) {
    const container = document.getElementById('toppingsContainer');
    const div = document.createElement('div');
    div.style.display = 'grid';
    div.style.gridTemplateColumns = '1fr 1fr auto';
    div.style.gap = '10px';
    div.innerHTML = `
        <input type="text" placeholder="Tên Topping" value="${name}" class="topping-name" style="padding: 5px 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: #fff;">
        <input type="number" placeholder="Giá (VNĐ)" value="${price}" class="topping-price" style="padding: 5px 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: #fff;">
        <button type="button" onclick="this.parentElement.remove()" style="background: transparent; border: none; color: #ff0055; cursor: pointer;"><i class="fas fa-times"></i></button>
    `;
    container.appendChild(div);
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('itemId').value;
    const token = localStorage.getItem('token');
    
    // Collect sizes
    const sizes = Array.from(document.querySelectorAll('#sizesContainer > div')).map(div => ({
        name: div.querySelector('.size-name').value,
        extraPrice: parseInt(div.querySelector('.size-price').value) || 0
    })).filter(s => s.name);

    // Collect toppings
    const toppings = Array.from(document.querySelectorAll('#toppingsContainer > div')).map(div => ({
        name: div.querySelector('.topping-name').value,
        price: parseInt(div.querySelector('.topping-price').value) || 0
    })).filter(t => t.name);

    // Collect combo items
    const combo_items = Array.from(document.querySelectorAll('#comboItemsContainer > div')).map(div => ({
        child_item_id: div.querySelector('.combo-item-id').value,
        quantity: parseInt(div.querySelector('.combo-item-qty').value) || 1
    }));


    const itemData = {
        item_name: document.getElementById('itemName').value,
        category_id: document.getElementById('itemCategory').value,
        price: document.getElementById('itemPrice').value,
        description: document.getElementById('itemDesc').value,
        status: document.getElementById('itemStatus').value,
        image_url: document.getElementById('itemImage').value,
        is_recommended: document.getElementById('isRecommended').checked,
        is_paused: document.getElementById('isPaused').checked,
        is_combo: document.getElementById('isCombo').checked,
        combo_items: document.getElementById('isCombo').checked ? combo_items : [],
        customizations: { sizes, toppings }
    };

    
    const url = id ? `http://localhost:5000/api/menu/items/${id}` : 'http://localhost:5000/api/menu/items';
    const method = id ? 'PUT' : 'POST';
    
    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(itemData)
        });
        const result = await response.json();
        if (result.success) {
            closeModal();
            loadItems();
        } else {
            alert('Lỗi: ' + result.message);
        }
    } catch (error) {
        console.error('Lỗi submit form:', error);
    }
}

async function deleteItem(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa món này?')) return;
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`http://localhost:5000/api/menu/items/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        if (result.success) {
            loadItems();
        } else {
            alert('Lỗi: ' + result.message);
        }
    } catch (error) {
        console.error('Lỗi xóa món:', error);
    }
}

// Category Modal Functions
function openAddCategoryModal() {
    const modal = document.getElementById('categoryModal');
    modal.style.display = 'flex';
    modal.classList.add('active');
    document.getElementById('categoryForm').reset();
    document.getElementById('categoryName').focus();
}

function closeCategoryModal() {
    const modal = document.getElementById('categoryModal');
    modal.classList.remove('active');
    modal.style.display = 'none';
}

async function handleCategoryFormSubmit(e) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    const categoryData = {
        category_name: document.getElementById('categoryName').value,
        description: document.getElementById('categoryDesc').value
    };
    
    try {
        const response = await fetch('http://localhost:5000/api/menu/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(categoryData)
        });
        const result = await response.json();
        if (result.success) {
            closeCategoryModal();
            loadCategories(); // Reload categories in filter and form
        } else {
            alert('Lỗi: ' + result.message);
        }
    } catch (error) {
        console.error('Lỗi thêm danh mục:', error);
    }
}
