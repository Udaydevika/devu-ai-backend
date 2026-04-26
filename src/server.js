import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import mongoose from "mongoose";

import chatRoutes from "./routes/chat.routes.js";
import memoryRoutes from "./routes/memory.routes.js";
import videoRoutes from "./routes/videoRoutes.js";
import audioRoutes from "./routes/audioRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import chatSessionRoutes from "./routes/chatSession.routes.js";

import { errorHandler } from "./middlewares/errorHandler.js";
import { rateLimiter } from "./middlewares/rateLimiter.js";
import { logError } from "./utils/logger.js"; // 🔥 ADD THIS

import cron from "node-cron";
import { decayMemories } from "./jobs/memoryDecay.job.js";
import compression from "compression";

const app = express();

console.log("🔑 ENV CHECK:");
console.log("OPENROUTER:", !!process.env.OPENROUTER_API_KEY);
console.log("GEMINI:", !!process.env.GEMINI_API_KEY);
console.log("GROQ:", !!process.env.GROQ_API_KEY);
console.log("HF:", !!process.env.HUGGINGFACE_API_KEY);

// ===============================
// 🔥 CRASH LOGGING (STEP 4 — HERE)
// ===============================
process.on("uncaughtException", (err) => {
  logError("CRASH_UNCAUGHT_EXCEPTION", err);
});

process.on("unhandledRejection", (err) => {
  logError("CRASH_UNHANDLED_REJECTION", err);
});

// ===============================
// 🔥 MONGODB CONNECTION
// ===============================
mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
  })
  .then(() => {
    console.log("✅ MongoDB connected");
  })
  .catch((err) => {
    logError("DB_CONNECTION_ERROR", err);
  });

// ===============================
// 🔐 MIDDLEWARE
// ===============================
app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

// 🔥 Rate limit (ONLY ONCE)
app.use(rateLimiter);

// ===============================
// 🚀 ROUTES
// ===============================
app.use("/api", chatRoutes);
app.use("/api", memoryRoutes);
app.use("/api", videoRoutes);
app.use("/api", audioRoutes);
app.use("/api", documentRoutes);
app.use("/api/chats", chatSessionRoutes);
app.use(compression());

// ===============================
// 🧠 MEMORY DECAY CRON
// ===============================
cron.schedule("0 */6 * * *", async () => {
  console.log("⏰ Running memory decay job...");
  try {
    await decayMemories();
  } catch (err) {
    logError("MEMORY_DECAY_ERROR", err);
  }
});

// ===============================
// 🛑 404 HANDLER
// ===============================
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
  });
});

// ===============================
// 🔥 GLOBAL ERROR HANDLER
// ===============================
app.use(errorHandler);

// ===============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 DevU AI Backend running on http://localhost:${PORT}`);
});