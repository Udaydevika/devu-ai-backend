import mongoose from "mongoose";

/**
 * 🧠 DevU AI — Memory Schema (FINAL VERSION)
 */
const memorySchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },

    // 🧠 Memory category
    type: {
      type: String,
      enum: ["preference", "profile", "habit", "context"],
      required: true,
    },

    // 🔑 key (unique per user)
    key: {
      type: String,
      required: true,
    },

    // 📦 value
    value: {
      type: String,
      required: true,
    },

    // 🎯 importance (NEW 🔥)
    importance: {
      type: String,
      enum: ["high", "medium", "low"],
      default: "medium",
    },

    // 🤖 AI confidence
    confidence: {
      type: Number,
      default: 1.0,
      min: 0,
      max: 1,
    },

    // 📌 pinned (never delete)
    pinned: {
      type: Boolean,
      default: false,
    },

    // 🧠 source of memory
    source: {
      type: String,
      enum: ["user_explicit", "repeated", "inferred"],
      default: "inferred",
    },

    // 🔁 how many times used (NEW 🔥)
    usageCount: {
      type: Number,
      default: 1,
    },

    // 🕒 last used
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },

    // 🧹 soft delete flag (NEW 🔥)
    isDeleted: {
      type: Boolean,
      default: false,
    },

    // 🧠 metadata (future AI learning)
    metadata: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

/**
 * 🔐 Prevent duplicate keys
 */
memorySchema.index(
  { userId: 1, key: 1 },
  { unique: true }
);

/**
 * ⚡ FAST QUERY INDEX
 */
memorySchema.index({ userId: 1, type: 1 });

/**
 * 🧠 UPSERT MEMORY (SMART VERSION)
 */
memorySchema.statics.upsertMemory = async function ({
  userId,
  type,
  key,
  value,
  confidence = 1.0,
  source = "inferred",
}) {
  return this.findOneAndUpdate(
    { userId, key },
    {
      $set: {
        type,
        value,
        confidence,
        source,
        lastUsedAt: new Date(),
        isDeleted: false,
      },
      $inc: { usageCount: 1 },
    },
    {
      new: true,
      upsert: true, // 🔥 prevents duplicate crash
    }
  );
};

/**
 * 🧹 MEMORY DECAY SYSTEM (AUTO CLEANUP)
 */
memorySchema.statics.cleanupOldMemories = async function (userId) {
  const threshold = new Date();
  threshold.setDate(threshold.getDate() - 30); // 30 days

  return this.updateMany(
    {
      userId,
      pinned: false,
      importance: "low",
      lastUsedAt: { $lt: threshold },
    },
    {
      $set: {
      isDeleted: false, // 🔥 ADD THIS
    }
  }
  );
};

const Memory = mongoose.model("Memory", memorySchema);

export default Memory;

memorySchema.statics.hardDeleteOld = async function () {
  const threshold = new Date();
  threshold.setDate(threshold.getDate() - 60);

  return this.deleteMany({
    isDeleted: true,
    updatedAt: { $lt: threshold },
  });
};