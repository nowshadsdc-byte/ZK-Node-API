const { withDevice } = require('../services/zkService');

// UTC → BST (+6:00)
const toBST = (dateStr) => {
    const date = new Date(dateStr);
    const bst  = new Date(date.getTime() + 6 * 60 * 60 * 1000);
    return bst.toISOString().replace('T', ' ').substring(0, 19); // "2026-06-28 10:31:30"
};

const getAllAttendance = async (req, res) => {
    const { ip, port, timeout, inport } = req.query;

    if (!ip) {
        return res.status(400).json({
            success: false,
            message: 'Device IP is required. Pass ?ip=YOUR_DEVICE_IP'
        });
    }

    try {
        const data = await withDevice(
            { ip, port, timeout, inport },
            async (zk) => {
                const attendance = await zk.getAttendances();
                const users      = await zk.getUsers();

                // Build userId → name map
                const userMap = {};
                users.data.forEach(u => {
                    userMap[u.userId] = u.name || null;
                });

                // Merge + convert time
                const records = attendance.data.map(record => ({
                    deviceUserId : record.deviceUserId,
                    employeeName : userMap[record.deviceUserId] || `Unknown (ID: ${record.deviceUserId})`,
                    recordTime   : toBST(record.recordTime),
                    attState     : record.attState,
                    verifyType   : record.verifyType,
                }));

                // Remove duplicate punches within 60 seconds for same user
                const seen = {};
                const filtered = records.filter(record => {
                    const key      = record.deviceUserId;
                    const punchTime = new Date(record.recordTime).getTime();

                    if (seen[key] && (punchTime - seen[key]) < 60 * 1000) {
                        return false; // duplicate, skip
                    }
                    seen[key] = punchTime;
                    return true;
                });

                return filtered;
            }
        );

        return res.json({
            success : true,
            total   : data.length,
            data,
        });

    } catch (error) {
        return res.status(500).json({
            success  : false,
            message  : error.message,
        });
    }
};


const getTodayAttendance = async (req, res) => {
    const { ip, port, timeout, inport } = req.query;

    if (!ip) {
        return res.status(400).json({
            success: false,
            message: 'Device IP is required. Pass ?ip=YOUR_DEVICE_IP'
        });
    }

    try {
        const data = await withDevice(
            { ip, port, timeout, inport },
            async (zk) => {
                const attendance = await zk.getAttendances();
                const users      = await zk.getUsers();

                // Build userId → name map
                const userMap = {};
                users.data.forEach(u => {
                    userMap[u.userId] = u.name || null;
                });

                // Today's date in BST
                const now      = new Date();
                const todayBST = new Date(now.getTime() + 6 * 60 * 60 * 1000);
                const todayStr = todayBST.toISOString().substring(0, 10); // "2026-06-28"

                // Filter today only + convert time
                const records = attendance.data
                    .map(record => ({
                        deviceUserId : record.deviceUserId,
                        employeeName : userMap[record.deviceUserId] || `Unknown (ID: ${record.deviceUserId})`,
                        recordTime   : toBST(record.recordTime),
                        attState     : record.attState,
                        verifyType   : record.verifyType,
                    }))
                    .filter(record => record.recordTime.startsWith(todayStr));

                // Remove duplicate punches within 60 seconds
                const seen     = {};
                const filtered = records.filter(record => {
                    const key       = record.deviceUserId;
                    const punchTime = new Date(record.recordTime).getTime();

                    if (seen[key] && (punchTime - seen[key]) < 60 * 1000) {
                        return false;
                    }
                    seen[key] = punchTime;
                    return true;
                });

                return filtered;
            }
        );

        return res.json({
            success : true,
            date    : new Date(new Date().getTime() + 6 * 60 * 60 * 1000)
                        .toISOString().substring(0, 10),
            total   : data.length,
            data,
        });

    } catch (error) {
        return res.status(500).json({
            success : false,
            message : error.message,
        });
    }
};

const getUserAttendance = async (req, res) => {
    const { ip, port, timeout, inport } = req.query;
    const { userId } = req.params;

    if (!ip) {
        return res.status(400).json({
            success: false,
            message: 'Device IP is required. Pass ?ip=YOUR_DEVICE_IP'
        });
    }

    if (!userId) {
        return res.status(400).json({
            success: false,
            message: 'User ID is required in URL param'
        });
    }

    try {
        const data = await withDevice(
            { ip, port, timeout, inport },
            async (zk) => {
                const attendance = await zk.getAttendances();
                const users      = await zk.getUsers();

                // Build userId → name map
                const userMap = {};
                users.data.forEach(u => {
                    userMap[u.userId] = u.name || null;
                });

                // Check user exists on device
                const employeeName = userMap[userId] || `Unknown (ID: ${userId})`;

                // Filter by userId + convert time
                const records = attendance.data
                    .filter(record => String(record.deviceUserId) === String(userId))
                    .map(record => ({
                        deviceUserId : record.deviceUserId,
                        employeeName,
                        recordTime   : toBST(record.recordTime),
                        attState     : record.attState,
                        verifyType   : record.verifyType,
                    }));

                // Remove duplicate punches within 60 seconds
                const seen     = {};
                const filtered = records.filter(record => {
                    const key       = record.deviceUserId;
                    const punchTime = new Date(record.recordTime).getTime();

                    if (seen[key] && (punchTime - seen[key]) < 60 * 1000) {
                        return false;
                    }
                    seen[key] = punchTime;
                    return true;
                });

                return { employeeName, records: filtered };
            }
        );

        if (data.records.length === 0) {
            return res.status(404).json({
                success : false,
                message : `No attendance records found for user ID: ${userId}`,
            });
        }

        return res.json({
            success      : true,
            userId,
            employeeName : data.employeeName,
            total        : data.records.length,
            data         : data.records,
        });

    } catch (error) {
        return res.status(500).json({
            success : false,
            message : error.message,
        });
    }
};

module.exports = { getAllAttendance, getTodayAttendance, getUserAttendance };