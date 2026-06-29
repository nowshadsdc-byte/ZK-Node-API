const express = require('express');
const router  = express.Router();

router.get('/', (req, res) => {
    res.json({
        success     : true,
        message     : 'ZK Node API is running',
        version     : '1.0.0',
        timestamp   : new Date(new Date().getTime() + 6 * 60 * 60 * 1000)
                        .toISOString().replace('T', ' ').substring(0, 19),
        environment : process.env.NODE_ENV || 'development',
    });
});

module.exports = router;