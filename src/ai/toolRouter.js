// src/ai/toolRouter.js

export function detectTool(message = "", files = []) {
  const text = (message || "").toLowerCase().trim();

  if (files && files.length > 0) {
    const file = files[0];
    const mime = file.mimeType || file.mimetype || "";

    if (mime.startsWith("image/")) return "vision";
    if (mime.startsWith("video/")) return "video";
    if (mime.startsWith("audio/")) return "audio";

    if (
      mime.includes("pdf") ||
      mime.includes("document") ||
      mime.includes("text") ||
      mime.includes("word")
    ) {
      return "file";
    }

    return "file";
  }

  if (
    text.includes("generate image") ||
    text.includes("create image") ||
    text.includes("draw")
  ) return "image";

  if (
    text.includes("news") ||
    text.includes("latest") ||
    text.includes("today news")
  ) return "search";

  return "chat";
}