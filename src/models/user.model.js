import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    uid: { type: String, required: true, unique: true },

    freeChatsLeft: {
      type: Number,
      default: 20,
    },

    isPremium: {
      type: Boolean,
      default: false,
    },

    totalMessages: {
      type: Number,
      default: 0,
    },

    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);