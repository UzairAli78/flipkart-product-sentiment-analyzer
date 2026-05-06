/**
 * Amazon Sentiment Analyzer — Express Backend Server
 * Entry point: configures middleware, routes, and error handling
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const analyzeRoutes = require("./routes/analyze");

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Security Middleware ────────────────────────────────────────────────────
app.use(helmet());

// ─── CORS Configuration ─────────────────────────────────────────────────────
const allowedOrigins = (
  process.env.ALLOWED_ORIGINS || "http://localhost:3000"
).split(",");
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy: origin ${origin} not allowed`));
      }
    },
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// ─── Request Logging ────────────────────────────────────────────────────────
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// ─── Body Parsing ───────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ─── Rate Limiting ──────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60_000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many requests. Please wait a moment before trying again.",
  },
});
app.use("/api/", limiter);

// ─── Health Check ───────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "amazon-sentiment-backend",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// ─── API Routes ─────────────────────────────────────────────────────────────
app.use("/api/analyze", analyzeRoutes);

// ─── 404 Handler ───────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: "Route not found." });
});

// ─── Global Error Handler ───────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("[Server Error]", err.message || err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    error: err.message || "Internal server error.",
  });
});

// ─── Start Server ───────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✅ Backend running on http://localhost:${PORT}`);
  console.log(
    `   AI Service expected at: ${process.env.AI_SERVICE_URL || "http://localhost:8000"}`,
  );
  console.log(`   Environment: ${process.env.NODE_ENV || "development"}\n`);
});

module.exports = app;
