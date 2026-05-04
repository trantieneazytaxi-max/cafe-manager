// Test script to check if modal functions work
const { JSDOM } = require('jsdom');

// Create a mock DOM
const dom = new JSDOM(`
<!DOCTYPE html>
<html>
<body>
    <div id="categoryModal" class="modal">
        <div class="modal-content">
            <form id="categoryForm">
                <input type="text" id="categoryName">
            </form>
        </div>
    </div>
</body>
</html>
`);

global.document = dom.window.document;

// Load the JavaScript
const fs = require('fs');
const jsContent = fs.readFileSync('menu-management.js', 'utf8');

// Extract functions (simplified)
eval(jsContent.replace(/document\.addEventListener\('DOMContentLoaded'.*?\);/s, ''));

// Test the function
console.log('Testing openAddCategoryModal...');
try {
    openAddCategoryModal();
    console.log('Function called successfully');
    console.log('Modal classList:', document.getElementById('categoryModal').classList.toString());
} catch (error) {
    console.log('Error:', error.message);
}