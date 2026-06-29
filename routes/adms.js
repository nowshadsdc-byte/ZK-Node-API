const express        = require('express');
const router         = express.Router();
const admsController = require('../controllers/admsController');

// Device heartbeat & data receiver
router.get('/cdata',  admsController.handleHandshake);
router.post('/cdata', admsController.handleData);

// Device gets commands from here
router.get('/getrequest',   admsController.getRequest);
router.post('/devicecmd',   admsController.deviceCmd);

module.exports = router;