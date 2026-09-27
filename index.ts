import dns from "node:dns";
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {
  console.warn("DNS server configuration warning:", e);
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

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI as string);
    console.log("✅ DB Connected Successfully");
  } catch (error) {
    console.log("❌ DB Connect Failed:", error);
  }
};

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Routes
app.use("/api/auth", authRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/templates", templateRouter);
app.use("/api/posters", posterRouter);
app.use("/api/admin", adminRouter);

app.get("/", (_req, res) => {
  res.send("🚀 AI Political Poster Maker Backend is running!");
});

app.listen(PORT, () => {
  connectDB();
  console.log(`🚀 Server running on port ${PORT}`);
});
