# ZK Node API

Node.js Express backend server for ZKTeco F22 biometric attendance device integration with Laravel Employee Attendance System.

---

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Device Library:** node-zklib
- **Process Manager:** PM2

---

## Project Structure

```
zk-node-api/
├── server.js
├── .env
├── routes/
│   ├── health.js
│   ├── device.js
│   ├── users.js
│   └── attendance.js
├── controllers/
│   ├── deviceController.js
│   ├── userController.js
│   └── attendanceController.js
└── services/
    └── zkService.js
```

---

## Installation

```bash
# Clone the repository
git clone https://github.com/yourname/zk-node-api.git
cd zk-node-api

# Install dependencies
npm install
```

---

## Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000
NODE_ENV=development
LARAVEL_API_URL=http://your-laravel-app.com
LARAVEL_API_TOKEN=your_secret_token
```

---

## Run Locally

```bash
node server.js
```

---

## Run on VPS with PM2

```bash
# Install PM2 globally
npm install -g pm2

# Start the app
pm2 start server.js --name "zk-api"

# Auto start on server reboot
pm2 startup
pm2 save

# View logs
pm2 logs zk-api

# Restart
pm2 restart zk-api

# Stop
pm2 stop zk-api
```

---

## API Reference

All device routes require device connection parameters.

### Connection Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `ip` | string | ✅ Yes | — | Device IP address |
| `port` | number | No | 4370 | Device port |
| `timeout` | number | No | 10000 | Connection timeout (ms) |
| `inport` | number | No | 4000 | Local UDP port |

For `GET` requests → pass as **query params**
For `DELETE` / `PUT` requests → pass in **request body**

---

### Health Check

#### `GET /health`

Check if the API server is running.

**Request:**
```
GET http://localhost:3000/health
```

**Response:**
```json
{
    "success"     : true,
    "message"     : "ZK Node API is running",
    "version"     : "1.0.0",
    "timestamp"   : "2026-06-29 10:30:00",
    "environment" : "development"
}
```

---

### Device Routes

#### `GET /api/device/status`

Check if the device is online.

**Request:**
```
GET http://localhost:3000/api/device/status?ip=192.168.1.201&port=4370
```

**Response (online):**
```json
{
    "success"   : true,
    "status"    : "online",
    "ip"        : "192.168.1.201",
    "port"      : 4370,
    "checkedAt" : "2026-06-29 10:30:00"
}
```

**Response (offline):**
```json
{
    "success"   : false,
    "status"    : "offline",
    "ip"        : "192.168.1.201",
    "port"      : 4370,
    "message"   : "Connection timed out",
    "checkedAt" : "2026-06-29 10:30:00"
}
```

---

#### `GET /api/device/info`

Get device storage and capacity information.

**Request:**
```
GET http://localhost:3000/api/device/info?ip=192.168.1.201&port=4370
```

**Response:**
```json
{
    "success" : true,
    "data"    : {
        "userCounts"  : 6,
        "logCounts"   : 120,
        "logCapacity" : 100000
    }
}
```

---

#### `GET /api/device/time`

Read current time from the device.

**Request:**
```
GET http://localhost:3000/api/device/time?ip=192.168.1.201&port=4370
```

**Response:**
```json
{
    "success"    : true,
    "deviceTime" : "2026-06-29 10:30:00"
}
```

---

#### `PUT /api/device/time`

Sync device time to current server time (BST +6:00).

**Request:**
```
PUT http://localhost:3000/api/device/time
Content-Type: application/json

{
    "ip"   : "192.168.1.201",
    "port" : 4370
}
```

**Response:**
```json
{
    "success"   : true,
    "message"   : "Device time updated successfully",
    "updatedTo" : "2026-06-29 10:30:00"
}
```

---

### User Routes

#### `GET /api/users`

Get all users enrolled on the device.

> **Note:** User management (create, update, delete) is handled directly from the F22 device screen. This endpoint is for reading only.

**Request:**
```
GET http://localhost:3000/api/users?ip=192.168.1.201&port=4370
```

**Response:**
```json
{
    "success" : true,
    "total"   : 6,
    "data"    : [
        {
            "userId"   : "13",
            "name"     : "Rakibul Islam",
            "cardno"   : null,
            "role"     : "user",
            "password" : null
        },
        {
            "userId"   : "16",
            "name"     : "Sirajul Salekin Nowshad",
            "cardno"   : null,
            "role"     : "user",
            "password" : null
        }
    ]
}
```

---

### Attendance Routes

#### `GET /api/attendance`

Get all attendance records from the device.

**Request:**
```
GET http://localhost:3000/api/attendance?ip=192.168.1.201&port=4370
```

**Response:**
```json
{
    "success" : true,
    "total"   : 120,
    "data"    : [
        {
            "deviceUserId" : "16",
            "employeeName" : "Sirajul Salekin Nowshad",
            "recordTime"   : "2026-06-28 10:31:30",
            "attState"     : 0,
            "verifyType"   : 1
        }
    ]
}
```

---

#### `GET /api/attendance/today`

Get today's attendance records only (BST timezone).

**Request:**
```
GET http://localhost:3000/api/attendance/today?ip=192.168.1.201&port=4370
```

**Response:**
```json
{
    "success" : true,
    "date"    : "2026-06-29",
    "total"   : 6,
    "data"    : [
        {
            "deviceUserId" : "16",
            "employeeName" : "Sirajul Salekin Nowshad",
            "recordTime"   : "2026-06-29 09:15:00",
            "attState"     : 0,
            "verifyType"   : 1
        }
    ]
}
```

---

#### `GET /api/attendance/user/:userId`

Get all attendance records for a specific user.

**Request:**
```
GET http://localhost:3000/api/attendance/user/16?ip=192.168.1.201&port=4370
```

**Response:**
```json
{
    "success"      : true,
    "userId"       : "16",
    "employeeName" : "Sirajul Salekin Nowshad",
    "total"        : 15,
    "data"         : [
        {
            "deviceUserId" : "16",
            "employeeName" : "Sirajul Salekin Nowshad",
            "recordTime"   : "2026-06-28 10:31:30",
            "attState"     : 0,
            "verifyType"   : 1
        }
    ]
}
```

**Response (user not found):**
```json
{
    "success" : false,
    "message" : "No attendance records found for user ID: 99"
}
```

---

#### `DELETE /api/attendance`

Clear all attendance logs from the device.

> ⚠️ **Warning:** This is irreversible. Always sync attendance to Laravel before clearing.

**Request:**
```
DELETE http://localhost:3000/api/attendance
Content-Type: application/json

{
    "ip"   : "192.168.1.201",
    "port" : 4370
}
```

**Response:**
```json
{
    "success"   : true,
    "message"   : "All attendance logs cleared successfully",
    "clearedAt" : "2026-06-29 10:30:00"
}
```

---

### Field Reference

#### `attState` Values

| Value | Meaning |
|---|---|
| `0` | Check-in |
| `1` | Check-out |
| `4` | Overtime in |
| `5` | Overtime out |

#### `verifyType` Values

| Value | Meaning |
|---|---|
| `1` | Fingerprint |
| `3` | Password |
| `4` | Card |

---

## Notes

- All timestamps are returned in **BST (UTC+6:00)** format: `YYYY-MM-DD HH:MM:SS`
- Duplicate punches within **60 seconds** from the same user are automatically filtered
- Users without a name on device are shown as `Unknown (ID: X)`
- Device port is almost always `4370` for all ZKTeco devices

---

## Laravel Integration

From Laravel, call this API using HTTP client:

```php
use Illuminate\Support\Facades\Http;

$device = Device::find($id);

$response = Http::get('http://your-vps-ip:3000/api/attendance/today', [
    'ip'   => $device->ip,
    'port' => $device->port ?? 4370,
]);

$attendance = $response->json();
```

---

## Upcoming Features

- [ ] `POST /api/sync/users` — Sync users from device to Laravel
- [ ] `POST /api/sync/attendance` — Push attendance logs to Laravel
- [ ] `POST /api/sync/full` — Full synchronization
- [ ] ADMS receiver for real-time push from device

---

## License

MIT
