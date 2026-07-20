const { withDevice } = require('../services/zkService');

const getTimestampValue = (value) => {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
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

                // Keep the original device timestamp as-is
                const records = attendance.data.map(record => ({
                    deviceUserId : record.deviceUserId,
                    employeeName : userMap[record.deviceUserId] || `Unknown (ID: ${record.deviceUserId})`,
                    recordTime   : record.recordTime,
                    attState     : record.attState,
                    verifyType   : record.verifyType,
                }));

                // Remove duplicate punches within 60 seconds for same user
                const seen = {};
                const filtered = records.filter(record => {
                    const key       = record.deviceUserId;
                    const punchTime = getTimestampValue(record.recordTime);

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

                // Filter records for the current day without reformatting the time
                const today = new Date();

                const records = attendance.data
                    .map(record => ({
                        deviceUserId : record.deviceUserId,
                        employeeName : userMap[record.deviceUserId] || `Unknown (ID: ${record.deviceUserId})`,
                        recordTime   : record.recordTime,
                        attState     : record.attState,
                        verifyType   : record.verifyType,
                    }))
                    .filter(record => {
                        const recordDate = new Date(record.recordTime);
                        return !Number.isNaN(recordDate.getTime()) &&
                            recordDate.getFullYear() === today.getFullYear() &&
                            recordDate.getMonth() === today.getMonth() &&
                            recordDate.getDate() === today.getDate();
                    });

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
            date    : new Date().toISOString(),
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

                // Filter by userId and keep the original device time
                const records = attendance.data
                    .filter(record => String(record.deviceUserId) === String(userId))
                    .map(record => ({
                        deviceUserId : record.deviceUserId,
                        employeeName,
                        recordTime   : record.recordTime,
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