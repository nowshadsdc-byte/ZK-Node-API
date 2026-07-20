const axios = require('axios');

// ─── Helpers ────────────────────────────────────────────
const parseAttLog = (body, serial) => {
    const records = [];
    const lines   = body.trim().split('\n');

    lines.forEach(line => {
        line = line.trim();
        if (!line || line.startsWith('=')) return;

        const parts = line.split('\t');
        if (parts.length < 2) return;

        records.push({
            device_serial : serial,
            employee_id   : parts[0].trim(),
            punch_time    : parts[1].trim(),
            status        : parseInt(parts[2]) || 0,   // 0=check-in, 1=check-out
            verify_type   : parseInt(parts[3]) || 0,   // 1=fingerprint, 3=password
        });
    });

    return records;
};

// ─── 1. Handshake (GET /iclock/cdata) ───────────────────
// Device প্রথমে এখানে আসে — আমরা "OK" দিই
const handleHandshake = (req, res) => {
    const serial  = req.query.SN || 'UNKNOWN';
    const options = req.query.options || '';

    console.log(`🤝 Handshake — Device: ${serial} | Options: ${options}`);

    // ZKTeco ADMS protocol এর required response
    res.set('Content-Type', 'text/plain');
    res.send([
        `GET OPTION FROM: ${serial}`,
        `ATTLOGStamp=9999`,
        `OPERLOGStamp=9999`,
        `ATTPHOTOStamp=9999`,
        `ErrorDelay=30`,
        `Delay=10`,
        `TransTimes=00:00;14:05`,
        `TransInterval=1`,
        `TransFlag=TransData AttLog OpLog AttPhoto EnrollUser ChgUser EnrollFP ChgFP UserPic`,
        `TimeZone=6`,
        `Realtime=1`,
        `Encrypt=None`,
    ].join('\n'));
};

// ─── 2. Data Receiver (POST /iclock/cdata) ──────────────
// Device attendance push করলে এখানে আসে
const handleData = async (req, res) => {
    const serial = req.query.SN    || 'UNKNOWN';
    const table  = req.query.table || '';

    console.log(`📥 Data received — Device: ${serial} | Table: ${table}`);

    // Always reply OK first so device doesn't retry
    res.set('Content-Type', 'text/plain');
    res.send('OK');

    // ATTLOG = attendance punch data
    if (table === 'ATTLOG') {
        const rawBody = req.body;
        const body    = typeof rawBody === 'string'
            ? rawBody
            : rawBody.toString('utf8');

        console.log(`📋 Raw ATTLOG:\n${body}`);

        const records = parseAttLog(body, serial);
        console.log(`✅ Parsed ${records.length} record(s)`);

        // Push to Laravel
        for (const record of records) {
            await pushToLaravel(record);
        }
    }

    // OPERLOG = user enroll/delete operations
    if (table === 'OPERLOG') {
        console.log(`⚙️  OPERLOG received (user changes) from ${serial}`);
        // Later handle if needed
    }
};

// ─── 3. Push to Laravel ─────────────────────────────────
const pushToLaravel = async (record) => {
    const laravelUrl   = process.env.LARAVEL_API_URL;
    const laravelToken = process.env.LARAVEL_API_TOKEN;

    if (!laravelUrl) {
        console.log('⚠️  LARAVEL_API_URL not set in .env');
        return;
    }

    try {
        const response = await axios.post(
            `${laravelUrl}/api/adms/attendance`,
            record,
            {
                headers: {
                    'Authorization' : `Bearer ${laravelToken}`,
                    'Content-Type'  : 'application/json',
                    'Accept'        : 'application/json',
                }
            }
        );
        console.log(`📤 Pushed to Laravel → employee: ${record.employee_id} | status: ${response.status}`);
    } catch (error) {
        console.log(`❌ Laravel push failed: ${error.message}`);
    }
};

// ─── 4. Get Request (device polls for commands) ─────────
const getRequest = (req, res) => {
    const serial = req.query.SN || 'UNKNOWN';
    console.log(`📡 GetRequest — Device: ${serial}`);
    res.set('Content-Type', 'text/plain');
    res.send('OK');
};

// ─── 5. Device Command Response ─────────────────────────
const deviceCmd = (req, res) => {
    const serial = req.query.SN || 'UNKNOWN';
    console.log(`💻 DeviceCmd — Device: ${serial}`);
    res.set('Content-Type', 'text/plain');
    res.send('OK');
};

module.exports = {
    handleHandshake,
    handleData,
    getRequest,
    deviceCmd,
};