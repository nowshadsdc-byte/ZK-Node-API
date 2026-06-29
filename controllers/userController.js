const { withDevice } = require('../services/zkService');

const getAllUsers = async (req, res) => {
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
                const users = await zk.getUsers();

                return users.data.map(user => ({
                    userId   : user.userId,
                    name     : user.name     || `Unknown (ID: ${user.userId})`,
                    cardno   : user.cardno   || null,
                    role     : user.role === 14 ? 'admin' : 'user',
                    password : user.password || null,
                }));
            }
        );

        return res.json({
            success : true,
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


const createUser = async (req, res) => {
    const { ip, port, timeout, inport, userId, name, password, cardno, role } = req.body;

    if (!ip) {
        return res.status(400).json({
            success: false,
            message: 'Device IP is required in request body'
        });
    }

    if (!userId || !name) {
        return res.status(400).json({
            success: false,
            message: 'userId and name are required'
        });
    }

    try {
        await withDevice(
            { ip, port, timeout, inport },
            async (zk) => {
                // Check if userId already exists
                const existing = await zk.getUsers();
                const alreadyExists = existing.data.find(
                    u => String(u.userId) === String(userId)
                );

                if (alreadyExists) {
                    throw new Error(`User ID ${userId} already exists on device`);
                }

                await zk.setUser(
                    parseInt(userId),
                    userId,
                    name,
                    password || '',
                    role === 'admin' ? 14 : 0,
                    cardno  || 0
                );
            }
        );

        return res.status(201).json({
            success   : true,
            message   : `User "${name}" created successfully`,
            data      : {
                userId,
                name,
                cardno   : cardno   || null,
                role     : role     || 'user',
                password : password || null,
            }
        });

    } catch (error) {
        return res.status(500).json({
            success : false,
            message : error.message,
        });
    }
};

module.exports = { getAllUsers, createUser };