import mongoose from "mongoose";

const chatSessionSchema = new mongoose.Schema(
  {
    userId: String,
    title: String,
    lastMessage: String,
  },
  { timestamps: true }
);

export default mongoose.model("ChatSession", chatSessionSchema);