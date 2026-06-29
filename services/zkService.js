const ZKLib = require('node-zklib');

const withDevice = async ({ ip, port = 4370, timeout = 10000, inport = 4000 }, action) => {
    const zk = new ZKLib(ip, port, timeout, inport, false);
    try {
        await zk.createSocket();
        const result = await action(zk);
        await zk.disconnect();
        return result;
    } catch (error) {
        try { await zk.disconnect(); } catch (_) {}
        throw error;
    }
};

module.exports = { withDevice };