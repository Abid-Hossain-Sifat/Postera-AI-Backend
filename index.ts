import dns from "node:dns";

// Only override DNS servers in local development environments if needed, NOT on cloud hosts (Render/Vercel/Railway)
const isCloud = !!(process.env.RENDER || process.env.VERCEL || process.env.RAILWAY_ENVIRONMENT || process.env.NODE_ENV === "production");
if (!isCloud) {
  try {
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
  } catch (e) {
    // Ignore DNS override warning in environments that disallow it
  }
}

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { authRouter } from "./auth";
import { uploadRouter } from "./upload";
import { templateRouter } from "./template";
import { posterRouter } from "./poster";
import { adminRouter } from "./admin";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

let cachedDbPromise: Promise<typeof mongoose> | null = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return;
  if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI is missing in environment variables!");
    return;
  }
  if (!cachedDbPromise) {
    cachedDbPromise = mongoose.connect(MONGODB_URI).then((m) => {
      console.log("✅ DB Connected Successfully");
      return m;
    }).catch((err) => {
      cachedDbPromise = null;
      console.error("❌ DB Connect Failed:", err);
      throw err;
    });
  }
  return cachedDbPromise;
};

// Initiate connection immediately
connectDB().catch(() => {});

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Ensure DB is connected before processing requests (crucial for Vercel Serverless)
app.use(async (_req, _res, next) => {
  try {
    await connectDB();
  } catch (err) {
    // Proceed to router so handlers can return detailed status if needed
  }
  next();
});

// Health Check
app.get("/api/health", (_req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
  res.json({
    status: "ok",
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use("/api/auth", authRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/templates", templateRouter);
app.use("/api/posters", posterRouter);
app.use("/api/admin", adminRouter);

app.get("/", (_req, res) => {
  res.send("🚀 AI Political Poster Maker Backend is running!");
});

// Only start standalone HTTP server if not running inside Vercel serverless environment
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

export default app;
