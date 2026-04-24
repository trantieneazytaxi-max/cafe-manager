const jwt = require('jsonwebtoken');

// Verify JWT token
function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Không có token xác thực' });
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'my_secret_key');
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token không hợp lệ' });
    }
}

// Check if user is admin
function isAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Không có quyền truy cập' });
    }
    next();
}

// Check if user is staff
function isStaff(req, res, next) {
    if (req.user.role !== 'staff' && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Không có quyền truy cập' });
    }
    next();
}

// 🆕 Token không bắt buộc (cho Takeaway)
function optionalToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        req.user = null;
        return next();
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'my_secret_key');
        req.user = decoded;
    } catch (error) {
        req.user = null;
    }
    next();
}

module.exports = { verifyToken, isAdmin, isStaff, optionalToken };