// Test script for adding new category
const testAddCategory = async () => {
    try {
        // First get a token by logging in as admin
        const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@cafe.com',
                password: 'Admin@123'
            })
        });

        if (!loginResponse.ok) {
            console.log('Login failed');
            return;
        }

        const loginData = await loginResponse.json();
        const token = loginData.token;

        // Now add a new category
        const categoryResponse = await fetch('http://localhost:5000/api/menu/categories', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                category_name: 'Nước Ép Trái Cây',
                description: 'Các loại nước ép tươi từ trái cây'
            })
        });

        const result = await categoryResponse.json();
        console.log('Add category result:', result);

    } catch (error) {
        console.error('Error:', error);
    }
};

testAddCategory();