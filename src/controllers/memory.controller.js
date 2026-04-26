import Memory from "../models/memory.model.js";

/**
 * 🧠 Helper — build explanation
 */
function buildExplanation(memory) {
  if (memory.pinned) {
    return "You pinned this memory so I should always remember it.";
  }

  if (memory.source === "user_explicit") {
    return "You explicitly told me this about yourself.";
  }

  if (memory.confidence >= 0.8) {
    return "You mentioned this multiple times, so I remembered it.";
  }

  return "I inferred this from our conversations to be helpful.";
}

/**
 * ✅ SAVE / UPSERT MEMORY
 * POST /memory/save
 */
export async function saveMemory(req, res) {
  try {
    const { userId, type, key, value, confidence = 1.0 } = req.body;

    if (!userId || !type || !key || !value) {
      return res.status(400).json({
        error: "userId, type, key and value are required",
      });
    }

    const memory = await Memory.findOneAndUpdate(
      { userId, key },
      {
        userId,
        type,
        key,
        value,
        confidence,
        lastUsedAt: new Date(),
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    res.json({
      ...memory.toObject(),
      explanation: buildExplanation(memory),
    });
  } catch (err) {
    console.error("❌ saveMemory error:", err.message);
    res.status(500).json({ error: err.message });
  }
}

/**
 * ✅ GET ALL MEMORIES FOR USER
 * GET /memory/:userId
 */
export async function getMemories(req, res) {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const memories = await Memory.find({ userId })
      .sort({ updatedAt: -1 });

    res.json(
      memories.map((m) => ({
        ...m.toObject(),
        explanation: buildExplanation(m),
      }))
    );
  } catch (err) {
    console.error("❌ getMemories error:", err.message);
    res.status(500).json({ error: err.message });
  }
}

/**
 * ✅ UPDATE MEMORY (EDIT CONFIDENCE / PIN ONLY IF PINNED)
 * PUT /memory/:id
 */
export async function updateMemory(req, res) {
  try {
    const { id } = req.params;
    const { value, confidence, pinned } = req.body;

    const existing = await Memory.findById(id);
    if (!existing) {
      return res.status(404).json({ error: "Memory not found" });
    }

    // 🔒 STEP 2.2 — BLOCK VALUE OVERWRITE IF PINNED
    if (existing.pinned && value !== undefined) {
      return res.status(403).json({
        error: "Pinned memory value cannot be modified",
      });
    }

    const memory = await Memory.findByIdAndUpdate(
      id,
      {
        ...(value !== undefined && { value }),
        ...(confidence !== undefined && { confidence }),
        ...(pinned !== undefined && { pinned }),
        lastUsedAt: new Date(),
      },
      { new: true }
    );

    res.json({
      ...memory.toObject(),
      explanation: buildExplanation(memory),
    });
  } catch (err) {
    console.error("❌ updateMemory error:", err.message);
    res.status(500).json({ error: err.message });
  }
}

/**
 * ✅ DELETE MEMORY
 * DELETE /memory/:id
 */
export async function deleteMemory(req, res) {
  try {
    const { id } = req.params;

    const memory = await Memory.findByIdAndDelete(id);

    if (!memory) {
      return res.status(404).json({ error: "Memory not found" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("❌ deleteMemory error:", err.message);
    res.status(500).json({ error: err.message });
  }
}
