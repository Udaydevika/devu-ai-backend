import Memory from "../models/memory.model.js";

/**
 * 🧠 Gradually decay conflicting memory
 */
export async function decayMemory(memory, amount = 0.3) {
  memory.confidence = Math.max(0, memory.confidence - amount);
  memory.lastUsedAt = new Date();
  await memory.save();
}
