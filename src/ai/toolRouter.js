// src/ai/toolRouter.js

export function detectTool(message = "", files = []) {
  const text = (message || "").toLowerCase().trim();

  // =========================
  // 📁 FILE-BASED DETECTION (HIGHEST PRIORITY 🔥)
  // =========================
  if (files && files.length > 0) {
    const file = files[0];

    if (file.mimetype?.startsWith("image/")) {
      return "vision"; // 🖼️ image analysis
    }

    if (file.mimetype?.startsWith("video/")) {
      return "video"; // 🎬 video analysis
    }

    if (
      file.mimetype === "application/pdf" ||
      file.mimetype?.includes("document") ||
      file.mimetype?.includes("text")
    ) {
      return "file"; // 📄 document AI
    }
  }

  // =========================
  // 🧠 IMAGE GENERATION (NEW 🔥)
  // =========================
  if (
    text.includes("generate image") ||
    text.includes("create image") ||
    text.includes("draw") ||
    text.includes("ai image") ||
    text.includes("ghibli")
  ) {
    return "image"; // 🎨 image generation
  }

  // =========================
  // 📰 NEWS (NEW 🔥)
  // =========================
  if (
    text.includes("news") ||
    text.includes("latest") ||
    text.includes("stock") ||
    text.includes("market")
  ) {
    return "news";
  }

  // =========================
  // 🎬 VIDEO REQUEST
  // =========================
  if (
    text.includes("video") ||
    text.includes("movie") ||
    text.includes("clip")
  ) {
    return "video";
  }

  // =========================
  // 📄 DOCUMENT REQUEST
  // =========================
  if (
    text.includes("pdf") ||
    text.includes("document") ||
    text.includes("file")
  ) {
    return "file";
  }

  // =========================
  // 🌐 SEARCH
  // =========================
  if (
    text.includes("search") ||
    text.includes("google") ||
    text.includes("find")
  ) {
    return "search";
  }

  // =========================
  // 💬 DEFAULT CHAT
  // =========================
  return "chat";
}