import { extractFrames } from "../../../utils/extractframes.js";
import fs from "fs";

export async function handleVideo(file) {
  try {
    const frames = await extractFrames(file.path);

    return `🎬 Video processed successfully.
Frames extracted: ${frames.length}`;
  } catch (err) {
    console.error("❌ Video processing error:", err.message);
    return "⚠️ Failed to process video.";
  }
}