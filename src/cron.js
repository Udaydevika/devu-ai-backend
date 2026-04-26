// src/cron.js
import cron from "node-cron";
import { decayMemories } from "./jobs/memoryDecay.job.js";

/**
 * 🧠 Memory decay cron
 * Runs once every day at 03:00 AM
 */
cron.schedule("0 3 * * *", async () => {
  try {
    console.log("🧠 Running memory decay job...");
    await decayMemories();
  } catch (err) {
    console.error("❌ Memory decay cron failed:", err.message);
  }
});

console.log("⏰ Cron jobs initialized");
