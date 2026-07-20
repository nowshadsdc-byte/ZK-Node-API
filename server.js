const express = require("express");
const cors = require("cors");
const axios = require("axios");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const helmet = require("helmet");
const morgan = require("morgan");
const fs = require("fs");
const path = require("path");
const attendanceRoutes = require("./routes/attendance");
const userRoutes = require("./routes/users");
const admsRoutes = require("./routes/adms");
const healthRoute = require("./routes/health");
const deviceRoutes = require("./routes/device");

// Load env variables FIRST
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const logFilePath = path.join(__dirname, "log.txt");
const admsLogFilePath = path.join(__dirname, "admslog.txt");
const serverStartTime = Date.now();

const writeRequestLog = (req) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.originalUrl || req.url,
    ip: req.ip || req.headers["x-forwarded-for"] || "unknown",
    body: req.body && Object.keys(req.body).length ? req.body : null,
  };

  fs.appendFileSync(logFilePath, `${JSON.stringify(logEntry)}\n`);
};

// Middleware
app.use(helmet());
app.use(morgan("combined"));
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.get("/", (req, res) => {
  writeRequestLog(req);

  const serverUrl = `${req.protocol}://${req.get("host") || "localhost"}`;
  const runtimeSeconds = ((Date.now() - serverStartTime) / 1000).toFixed(2);

  res.json({
    status: "OK",
    serverUrl,
    runtimeSeconds: Number(runtimeSeconds),
    serverTime: new Date().toISOString(),
  });
});

app.post("/adms/request", (req, res) => {
  const logEntry = {
    type: "adms",
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.originalUrl || req.url,
    ip: req.ip || req.headers["x-forwarded-for"] || "unknown",
    body: req.body && Object.keys(req.body).length ? req.body : null,
  };

  fs.appendFileSync(logFilePath, `${JSON.stringify(logEntry)}\n`);
  fs.appendFileSync(admsLogFilePath, `${JSON.stringify(logEntry)}\n`);

  res.json({
    success: true,
    message: "ADMS request logged",
  });
});

// After your existing app.use() middleware lines, add:
app.use("/api/attendance", attendanceRoutes);
app.use("/api/users", userRoutes);
app.use("/iclock", admsRoutes);
app.use("/iclock/cdata", express.text({ type: "*/*" }));
app.use("/health", healthRoute);
app.use("/api/device", deviceRoutes);

// Start server with success/failure reason
const server = app.listen(PORT, () => {
  console.log(`✅ Server started successfully`);
  console.log(`🚀 ZK Node API running on port ${PORT}`);
  console.log(`🌍 Environment : ${process.env.NODE_ENV || "development"}`);
  console.log(`📅 Started at  : ${new Date().toLocaleString()}`);
});

server.on("error", (error) => {
  switch (error.code) {
    case "EADDRINUSE":
      console.error(
        `❌ Port ${PORT} is already in use. Free it or use a different PORT.`,
      );
      break;
    case "EACCES":
      console.error(
        `❌ Port ${PORT} requires elevated privileges. Try a port above 1024.`,
      );
      break;
    case "EADDRNOTAVAIL":
      console.error(
        `❌ The address is not available on this machine. Check your HOST setting.`,
      );
      break;
    default:
      console.error(
        `❌ Failed to start server — ${error.code}: ${error.message}`,
      );
  }
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("⚠️  SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    console.log("🛑 Server closed.");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("\n⚠️  SIGINT received (Ctrl+C). Shutting down...");
  server.close(() => {
    console.log("🛑 Server closed.");
    process.exit(0);
  });
});

// Unhandled errors
process.on("uncaughtException", (error) => {
  console.error(`💥 Uncaught Exception: ${error.message}`);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error(`💥 Unhandled Promise Rejection: ${reason}`);
  process.exit(1);
});
