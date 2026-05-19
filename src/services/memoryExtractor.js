import Memory from "../models/memory.model.js";
import { resolveMemoryConflict } from "./memoryConflict.service.js";
import { logEvent, logError } from "../utils/logger.js";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey:
    process.env.OPENROUTER_API_KEY,

  baseURL:
    "https://openrouter.ai/api/v1",
});

/**
 * 🧠 Extract + Store Memory (FINAL PRODUCTION VERSION)
 */
export async function extractAndStoreMemory({
  userId,
  message,
}) {
  if (!userId || !message || message.length < 3) return;

  try {
    // ===============================
    // 🤖 AI CALL
    // ===============================
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [
        {
          role: "system",
          content: `
${process.env.MEMORY_PROMPT}

Rules:
- Return ONLY valid JSON
- No explanation
- If nothing important → { "shouldRemember": false }
`,
        },
        {
          role: "user",
          content: message,
        },
      ],
    });

    const raw = response.choices?.[0]?.message?.content;
    if (!raw) return;

    // ===============================
    // 🧪 SAFE JSON PARSE
    // ===============================
    let memory;

    try {
      memory = JSON.parse(raw);
    } catch {
      logEvent("MEMORY_PARSE_FAIL", { userId });
      return;
    }

    if (!memory?.shouldRemember) return;

    const {
      type,
      key,
      value,
      confidence = 0.8,
    } = memory;

    if (!type || !key || !value) return;
    if (confidence < 0.5) return;
    if (value.length < 2) return;

    // ===============================
    // 🔒 EXISTING MEMORY
    // ===============================
    const existing = await Memory.findOne({ userId, key });

    if (existing?.pinned) {
      logEvent("MEMORY_SKIPPED_PINNED", { key });
      return;
    }

    // ===============================
    // 🧠 CONFLICT RESOLUTION
    // ===============================
    const resolution = await resolveMemoryConflict({
      userId,
      type,
      key,
      newValue: value,
      newConfidence: confidence,
    });

    // ===============================
    // 🧠 MEMORY PRIORITY SYSTEM
    // ===============================
    let importance = "medium";

    if (type === "profile") importance = "high";
    if (type === "context") importance = "low";

    if (confidence >= 0.9) importance = "high";
    if (confidence < 0.6) importance = "low";

    const usageCount = existing?.usageCount || 0;

    if (usageCount >= 5) {
      importance = "high";
    }

    // ===============================
    // 🟢 CREATE / REPLACE
    // ===============================
    if (
      resolution.action === "create" ||
      resolution.action === "replace"
    ) {
      await Memory.upsertMemory({
        userId,
        type,
        key,
        value,
        confidence: resolution.confidence,
        source: "inferred",
        importance,
      });

      // 🔥 STEP 3 — LOG HERE (YOUR QUESTION)
      logEvent("MEMORY_SAVED", {
        userId,
        key,
        value,
        importance,
      });

      return;
    }

    // ===============================
    // 🔁 REINFORCE MEMORY
    // ===============================
    if (resolution.action === "reinforce") {
      await Memory.findOneAndUpdate(
        { userId, key },
        {
          $inc: { usageCount: 1 },
          confidence: resolution.confidence,
          lastUsedAt: new Date(),
          ...(usageCount >= 5 && { importance: "high" }),
        }
      );

      // 🔥 STEP 3 — LOG HERE ALSO
      logEvent("MEMORY_REINFORCED", {
        userId,
        key,
      });

      return;
    }

    // ===============================
    // 🟡 CONFIRMATION NEEDED
    // ===============================
    if (resolution.action === "confirm") {
      logEvent("MEMORY_CONFLICT", {
        key,
        old: resolution.existing?.value,
        new: value,
      });
      return;
    }

  } catch (err) {
    logError("MEMORY_ERROR", err);
  }
}