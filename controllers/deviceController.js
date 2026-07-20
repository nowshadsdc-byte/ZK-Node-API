const { withDevice } = require('../services/zkService');

// ─── 1. Device Status ────────────────────────────────────
const getDeviceStatus = async (req, res) => {
    const { ip, port, timeout, inport } = req.query;

    if (!ip) {
        return res.status(400).json({
            success : false,
            message : 'Device IP is required. Pass ?ip=YOUR_DEVICE_IP'
        });
    }

    try {
        await withDevice(
            { ip, port, timeout, inport },
            async (zk) => {
                await zk.getInfo(); // just to confirm connection
            }
        );

        return res.json({
            success   : true,
            status    : 'online',
            ip,
            port      : parseInt(port) || 4370,
            checkedAt : new Date().toISOString(),
        });

    } catch (error) {
        return res.status(200).json({
            success   : false,
            status    : 'offline',
            ip,
            port      : parseInt(port) || 4370,
            message   : error.message,
            checkedAt : new Date().toISOString(),
        });
    }
};

// ─── 2. Device Info ──────────────────────────────────────
const getDeviceInfo = async (req, res) => {
    const { ip, port, timeout, inport } = req.query;

    if (!ip) {
        return res.status(400).json({
            success : false,
            message : 'Device IP is required. Pass ?ip=YOUR_DEVICE_IP'
        });
    }

    try {
        const data = await withDevice(
            { ip, port, timeout, inport },
            async (zk) => {
                const info = await zk.getInfo();
                return info;
            }
        );

        return res.json({
            success : true,
            data    : {
                userCounts   : data.userCounts,
                logCounts    : data.logCounts,
                logCapacity  : data.logCapacity,
            }
        });

    } catch (error) {
        return res.status(500).json({
            success : false,
            message : error.message,
        });
    }
};

// ─── 3. Get Device Time ──────────────────────────────────
const getDeviceTime = async (req, res) => {
    const { ip, port, timeout, inport } = req.query;

    if (!ip) {
        return res.status(400).json({
            success : false,
            message : 'Device IP is required. Pass ?ip=YOUR_DEVICE_IP'
        });
    }

    try {
        const data = await withDevice(
            { ip, port, timeout, inport },
            async (zk) => {
                const time = await zk.getTime();
                return time;
            }
        );

        return res.json({
            success    : true,
            deviceTime : data,
        });

    } catch (error) {
        return res.status(500).json({
            success : false,
            message : error.message,
        });
    }
};

// ─── 4. Update Device Time ───────────────────────────────
const updateDeviceTime = async (req, res) => {
    const { ip, port, timeout, inport } = req.body;

    if (!ip) {
        return res.status(400).json({
            success : false,
            message : 'Device IP is required in request body'
        });
    }

    try {
        // Current BST time
        const now    = new Date();
        const bstNow = new Date(now.getTime() + 6 * 60 * 60 * 1000);

        await withDevice(
            { ip, port, timeout, inport },
            async (zk) => {
                await zk.setTime(bstNow);
            }
        );

        return res.json({
            success    : true,
            message    : 'Device time updated successfully',
            updatedTo  : bstNow.toISOString(),
        });

    } catch (error) {
        return res.status(500).json({
            success : false,
            message : error.message,
        });
    }
};

module.exports = {
    getDeviceStatus,
    getDeviceInfo,
    getDeviceTime,
    updateDeviceTime,
};