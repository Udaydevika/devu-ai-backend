import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import compression from "compression";
import cron from "node-cron";
import "./cron.js";

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
  origin: true, 
  credentials: true,
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
app.use(
compression({
filter: (req, res) => {
  if (
    req.headers.accept ===
    "text/event-stream"
  ) {
    return false;
  }

  return compression.filter(
    req,
    res
  );
},

})
);

app.use(express.json({
  limit: "100mb"
}));

app.use(express.urlencoded({
  extended: true,
  limit: "100mb"
}));
app.use(rateLimiter);

// ====================================
// 🌍 UTF-8 SUPPORT
// ====================================

app.use((req, res, next) => {

  if (
    !req.url.includes(
      "/chat/stream"
    )
  ) {

    res.setHeader(
      "Content-Type",
      "application/json; charset=utf-8"
    );
  }

  next();
});

app.set("trust proxy", 1);
app.use((req, res, next) => {

  console.log(
    `🌍 ${req.method} ${req.url}`
  );

  next();
});

app.use((req, res, next) => {

  req.setTimeout(
    1000 * 60 * 5
  );

  res.setTimeout(
    1000 * 60 * 5
  );

  next();
});

// ====================================
// 🔥 DISABLE X-POWERED-BY
// ====================================

app.disable("x-powered-by");
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

console.log(
  "📂 GENERATED PATH:",
  generatedPath
);

console.log(
  "📂 EXISTS:",
  fs.existsSync(generatedPath)
);

const uploadsPath = path.join(
  process.cwd(),
  "uploads"
);
// ====================================
// 📂 CREATE FOLDERS SAFE
// ====================================

[
  publicPath,
  generatedPath,
  uploadsPath,
].forEach((dir) => {

  if (!fs.existsSync(dir)) {

    fs.mkdirSync(dir, {
      recursive: true,
    });
  }
});

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
// ❤️ KEEP ALIVE + DB HEALTH
// ====================================

app.get(
  "/health",
  async (req, res) => {

    try {

      const dbState =
        mongoose.connection.readyState;

      const dbConnected =
        dbState === 1;

      return res.status(200).json({

        success: true,

        server: "online",

        database:
          dbConnected
            ? "connected"
            : "disconnected",

        uptime:
          process.uptime(),

        memory: process.memoryUsage(),

        timestamp:
          Date.now(),
      });

    } catch (err) {

      return res.status(500).json({

        success: false,

        error:
          err.message,
      });
    }
  }
);

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
if (fs.existsSync(generatedPath)) {

  console.log(
    "📂 GENERATED PATH:",
    generatedPath
  );

  console.log(
    "📂 GENERATED FILES:",
    fs.readdirSync(generatedPath)
  );

} else {

  console.log(
    "❌ GENERATED FOLDER NOT FOUND:",
    generatedPath
  );
}
});