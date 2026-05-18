import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import compression from "compression";
import cron from "node-cron";

import chatRoutes from "./routes/chat.routes.js";
import memoryRoutes from "./routes/memory.routes.js";
import videoRoutes from "./routes/videoRoutes.js";
import audioRoutes from "./routes/audioRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import chatSessionRoutes from "./routes/chatSession.routes.js";

import { errorHandler } from "./middlewares/errorHandler.js";
import { rateLimiter } from "./middlewares/rateLimiter.js";
import { logError } from "./utils/logger.js";
import { decayMemories } from "./jobs/memoryDecay.job.js";
import path from "path";

const app = express();

// ====================================
// 🔑 ENV CHECK
// ====================================
console.log("🔑 ENV CHECK:");
console.log("OPENROUTER:", !!process.env.OPENROUTER_API_KEY);
console.log("GEMINI:", !!process.env.GEMINI_API_KEY);
console.log("GROQ:", !!process.env.GROQ_API_KEY);
console.log("HF:", !!process.env.HUGGINGFACE_API_KEY);
console.log("MONGO:", !!process.env.MONGO_URI);

// ====================================
// 🔥 CRASH LOGGING
// ====================================
process.on("uncaughtException", (err) => {
  logError("CRASH_UNCAUGHT_EXCEPTION", err);
});

process.on("unhandledRejection", (err) => {
  logError("CRASH_UNHANDLED_REJECTION", err);
});

// ====================================
// 🔥 MONGODB CONNECTION
// ====================================
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

// ====================================
// 🔐 MIDDLEWARE
// ====================================
app.use(cors({
  origin: "*",
  methods: [
    "GET",
    "POST",
    "PUT",
    "DELETE"
  ],
  allowedHeaders: [
    "Content-Type",
    "Authorization"
  ],
}));
app.use(compression());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({
  extended: true,
  limit: "50mb"
}));
app.use(rateLimiter);
app.set("trust proxy", 1);
// ====================================
// 📂 STATIC FILES
// ====================================

const publicPath = path.join(
  process.cwd(),
  "public"
);

const generatedPath = path.join(
  publicPath,
  "generated"
);

const uploadsPath = path.join(
  process.cwd(),
  "uploads"
);

// Create folders automatically
if (!fs.existsSync(publicPath)) {
  fs.mkdirSync(publicPath);
}

if (!fs.existsSync(generatedPath)) {
  fs.mkdirSync(generatedPath);
}

if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath);
}

// Serve public files
app.use(
  express.static(publicPath)
);

// Serve generated AI files
app.use(
  "/generated",
  express.static(generatedPath)
);

// Serve uploaded files
app.use(
  "/uploads",
  express.static(uploadsPath)
);
// ====================================
// 🟢 HEALTH CHECK ROUTE
// ====================================
app.get("/", (req, res) => {
  res.send("🚀 DevU AI Backend is running!");
});

// ====================================
// ❤️ KEEP ALIVE
// ====================================

app.get("/health", (req, res) => {

  res.status(200).json({
    success: true,
    uptime: process.uptime(),
    timestamp: Date.now(),
  });
});

// ====================================
// 🚀 API ROUTES
// ====================================
app.use("/api", chatRoutes);
app.use("/api", memoryRoutes);
app.use("/api", videoRoutes);
app.use("/api", audioRoutes);
app.use("/api", documentRoutes);
app.use("/api/chats", chatSessionRoutes);

// ====================================
// 🧠 MEMORY DECAY CRON
// ====================================
cron.schedule("0 */6 * * *", async () => {
  console.log("⏰ Running memory decay job...");
  try {
    await decayMemories();
  } catch (err) {
    logError("MEMORY_DECAY_ERROR", err);
  }
});

// ====================================
// 🛑 404 ROUTE HANDLER
// ====================================
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
  });
});

// ====================================
// 🔥 GLOBAL ERROR HANDLER
// ====================================
app.use(errorHandler);

// ====================================
// 🚀 SERVER START
// ====================================
const PORT =
  Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`
🚀 DevU AI Backend running

🌍 PORT: ${PORT}

📂 Public:
${process.env.PUBLIC_URL || "local"}

✅ Server Ready
`);
});