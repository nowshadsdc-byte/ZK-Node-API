const express = require('express');
const router  = express.Router();
const { getAllAttendance,getTodayAttendance,getUserAttendance } = require('../controllers/attendanceController');

router.get('/', getAllAttendance);
router.get('/today',  getTodayAttendance);
router.get('/user/:userId', getUserAttendance);

module.exports = router;