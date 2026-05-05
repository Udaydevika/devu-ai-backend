// src/ai/toolRouter.js

/**
 * ==========================================
 * 🔥 DevU AI CREATOR MODE PRO TOOL ROUTER
 *
 * Auto Detects:
 * ✅ Image Generation / Variations / Edit / Animate
 * ✅ OCR / Vision
 * ✅ Video Processing
 * ✅ Audio / Voice / Song
 * ✅ Documents (PDF/DOCX/TXT)
 * ✅ Resume Builder
 * ✅ PDF Generator
 * ✅ News / Search
 * ✅ Chat fallback
 * ==========================================
 */

export function detectTool(message = "", files = []) {
  const text = String(message || "").toLowerCase().trim();

  // =====================================================
  // FILE MODE (HIGH PRIORITY)
  // =====================================================
  if (Array.isArray(files) && files.length > 0) {
    const file = files[0] || {};

    const mime = String(file.mimeType || file.mimetype || "").toLowerCase();
    const name = String(file.name || file.originalname || "").toLowerCase();

    // ================= IMAGE FILE =================
    if (
      mime.startsWith("image/") ||
      endsWithAny(name, [".png", ".jpg", ".jpeg", ".webp"])
    ) {
      // 🎨 Variations
      if (hasAny(text, ["variation", "variations"])) {
        return "image_variation";
      }

      // 🖼️ Edit image
      if (
        hasAny(text, [
          "edit",
          "remove background",
          "change background",
          "enhance",
          "fix image",
        ])
      ) {
        return "image_edit";
      }

      // 🎬 Animate image
      if (
        hasAny(text, [
          "animate",
          "image to video",
          "make video",
          "convert to video",
        ])
      ) {
        return "image_video";
      }

      // 🎨 Ghibli style
      if (
        hasAny(text, [
          "ghibli",
          "anime",
          "cartoon",
          "pixar",
          "turn into anime",
        ])
      ) {
        return "ghibli";
      }

      // 📄 OCR
      if (
        hasAny(text, [
          "ocr",
          "scan",
          "extract text",
          "read text",
          "document",
          "receipt",
        ])
      ) {
        return "ocr";
      }

      return "vision";
    }

    // ================= VIDEO FILE =================
    if (
      mime.startsWith("video/") ||
      endsWithAny(name, [".mp4", ".mov", ".avi", ".mkv", ".webm"])
    ) {
      return "video";
    }

    // ================= AUDIO FILE =================
    if (
      mime.startsWith("audio/") ||
      endsWithAny(name, [".mp3", ".wav", ".m4a", ".aac", ".ogg"])
    ) {
      return "audio";
    }

    // ================= DOCUMENT FILE =================
    if (
      mime.includes("pdf") ||
      mime.includes("word") ||
      mime.includes("text") ||
      mime.includes("csv") ||
      mime.includes("json") ||
      endsWithAny(name, [
        ".pdf",
        ".docx",
        ".txt",
        ".csv",
        ".json",
        ".md",
      ])
    ) {
      return "file";
    }

    return "file";
  }

  // =====================================================
  // TEXT MODE
  // =====================================================

  // 🎨 Image Variations
  if (
    hasAny(text, [
      "variations",
      "multiple images",
      "different versions",
      "3 versions",
    ])
  ) {
    return "image_variation";
  }

  // 🖼️ Image Edit
  if (
    hasAny(text, [
      "edit image",
      "remove background",
      "change background",
      "enhance image",
      "fix image",
    ])
  ) {
    return "image_edit";
  }

  // 🎬 Image → Video
  if (
    hasAny(text, [
      "animate image",
      "image to video",
      "make video from image",
    ])
  ) {
    return "image_video";
  }

  // 🎨 Image Generation
  if (
    hasAny(text, [
      "generate image",
      "create image",
      "draw",
      "logo",
      "poster",
      "thumbnail",
      "wallpaper",
      "ghibli",
      "anime art",
    ])
  ) {
    return "image";
  }

  // 🎧 Audio / Song
  if (
    hasAny(text, [
      "song",
      "music",
      "mp3",
      "play song",
      "download song",
      "voice note",
      "speech to text",
    ])
  ) {
    return "audio";
  }

  // 🎬 Video
  if (
    hasAny(text, [
      "edit video",
      "make reel",
      "shorts",
      "highlight video",
    ])
  ) {
    return "video";
  }

  // 📄 Resume
  if (
    hasAny(text, [
      "resume",
      "cv",
      "make resume",
      "ats resume",
    ])
  ) {
    return "resume";
  }

  // 📄 PDF
  if (
    hasAny(text, [
      "make pdf",
      "export pdf",
      "convert to pdf",
    ])
  ) {
    return "pdf";
  }

  // 🔎 Search
  if (
    hasAny(text, [
      "news",
      "latest",
      "search",
      "find",
      "market update",
    ])
  ) {
    return "search";
  }

  return "chat";
}

// =====================================================
// HELPERS
// =====================================================

function hasAny(text, arr = []) {
  return arr.some((w) => text.includes(w));
}

function endsWithAny(name, arr = []) {
  return arr.some((ext) => name.endsWith(ext));
}