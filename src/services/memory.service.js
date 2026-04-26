import Memory from "../models/memory.model.js";

/**
 * ===============================
 * 🧠 STORE MEMORY (SMART UPSERT)
 * ===============================
 */
export async function saveMemory({
  userId,
  type,
  key,
  value,
  confidence = 1.0,
  source = "inferred",
}) {
  if (!userId || !key || !value) return null;

  try {
    const memory = await Memory.upsertMemory({
      userId,
      type,
      key,
      value,
      confidence,
      source,
    });

    return memory;
  } catch (err) {
    console.error("❌ saveMemory error:", err.message);
    return null;
  }
}

/**
 * ===============================
 * 🧠 LOAD USER MEMORY (SMART)
 * ===============================
 */
export async function getUserMemory(userId, limit = 10) {
  if (!userId) return [];

  try {
    const memories = await Memory.find({
      userId,
      isDeleted: false, // 🔥 ignore deleted
    })
      .sort({
        importance: -1,     // high > medium > low
        usageCount: -1,     // frequently used first
        confidence: -1,     // strong AI confidence
        lastUsedAt: -1,     // recent memory priority
      })
      .limit(limit)
      .lean();

    /**
     * 🔄 Update lastUsedAt (memory reinforcement)
     */
    const ids = memories.map((m) => m._id);

    if (ids.length > 0) {
      await Memory.updateMany(
        { _id: { $in: ids } },
        {
          lastUsedAt: new Date(),
          $inc: { usageCount: 1 }, // 🔥 learning effect
        }
      );
    }

    return memories;
  } catch (err) {
    console.error("❌ getUserMemory error:", err.message);
    return [];
  }
}