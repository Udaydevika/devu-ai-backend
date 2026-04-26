import Memory from "../models/memory.model.js";
import { MEMORY_CONFLICT_RULES } from "../utils/memoryRules.js";

/**
 * 🧠 Resolve memory conflicts BEFORE saving
 */
export async function resolveMemoryConflict({
  userId,
  type,
  key,
  newValue,
  newConfidence = 1.0,
}) {
  const existing = await Memory.findOne({ userId, key });

  // 🟢 No existing memory → safe to insert
  if (!existing) {
    return {
      action: "create",
      confidence: newConfidence,
    };
  }

  // 🟢 Same value → reinforce confidence
  if (existing.value === newValue) {
    return {
      action: "reinforce",
      confidence: Math.min(1, existing.confidence + 0.1),
    };
  }

  // 🔴 CONFLICT DETECTED
  const rule = MEMORY_CONFLICT_RULES[type] || {
    strategy: "replace",
    decayOld: true,
  };

  switch (rule.strategy) {
    case "replace":
      return {
        action: "replace",
        confidence: newConfidence,
      };

    case "merge":
      return {
        action: "replace",
        confidence: Math.max(existing.confidence, newConfidence),
      };

    case "confirm":
      return {
        action: "confirm",
        existing,
        proposed: newValue,
      };

    default:
      return {
        action: "ignore",
      };
  }
}
