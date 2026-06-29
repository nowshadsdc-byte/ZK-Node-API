const express = require('express');
const router  = express.Router();
const {
    getDeviceStatus,
    getDeviceInfo,
    getDeviceTime,
    updateDeviceTime,
} = require('../controllers/deviceController');

router.get('/status', getDeviceStatus);
router.get('/info',   getDeviceInfo);
router.get('/time',   getDeviceTime);
router.put('/time',   updateDeviceTime);

module.exports = router;