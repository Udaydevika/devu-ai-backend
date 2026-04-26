import Memory from "../models/memory.model.js";

const DECAY_RATE = 0.02; // 2% per day
const MIN_CONFIDENCE = 0.1;
const MAX_DECAY_DAYS = 30;

/**
 * 🧠 MEMORY DECAY ENGINE (FINAL STABLE)
 */
export async function decayMemories() {
  try {
    const now = Date.now();

    const memories = await Memory.find({
      pinned: false,
      confidence: { $gt: MIN_CONFIDENCE },
    }).lean();

    if (!memories.length) {
      console.log("🧠 No memories to decay");
      return;
    }

    const bulkOps = [];
    let deletedCount = 0;
    let updatedCount = 0;

    for (const m of memories) {
      if (!m.lastUsedAt) continue;

      const lastUsed = new Date(m.lastUsedAt).getTime();

      if (isNaN(lastUsed)) continue; // 🛡️ safety

      const days = (now - lastUsed) / (1000 * 60 * 60 * 24);

      if (days < 1) continue;

      const safeDays = Math.min(days, MAX_DECAY_DAYS);

      const decay = safeDays * DECAY_RATE;

      const newConfidence = Number(
        Math.max(MIN_CONFIDENCE, m.confidence - decay).toFixed(2)
      );

      // 🗑 DELETE WEAK MEMORY
      if (newConfidence <= MIN_CONFIDENCE) {
        deletedCount++;

        bulkOps.push({
          deleteOne: { filter: { _id: m._id } },
        });

        continue;
      }

      // 🔄 UPDATE MEMORY
      updatedCount++;

      bulkOps.push({
        updateOne: {
          filter: { _id: m._id },
          update: {
            $set: {
              confidence: newConfidence,
            },
          },
        },
      });
    }

    if (bulkOps.length > 0) {
      await Memory.bulkWrite(bulkOps);
    }

    console.log(
      `🧠 Memory decay done | Updated: ${updatedCount} | Deleted: ${deletedCount}`
    );

  } catch (err) {
    console.error("❌ Memory decay error:", err.message);
  }
}