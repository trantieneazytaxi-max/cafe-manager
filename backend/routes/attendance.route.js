const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controller');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.post('/check-in', attendanceController.checkIn);
router.post('/check-out', attendanceController.checkOut);
router.get('/status', attendanceController.getStatus);
router.get('/my-history', attendanceController.getMyHistory);
router.get('/my-schedule', attendanceController.getMySchedule);
router.get('/shifts', attendanceController.getShifts);

router.post('/schedule', isAdmin, attendanceController.updateSchedule);
router.get('/all', attendanceController.getAllAttendance);

module.exports = router;
