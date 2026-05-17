// src/ai/toolRouter.js

/**
 * ==========================================
 * 🔥 DevU AI ULTIMATE TOOL ROUTER
 * ==========================================
 */

export function detectTool(
  message = "",
  files = []
) {

  const text = String(
    message || ""
  ).toLowerCase().trim();

  // =====================================================
  // URL DETECTION
  // =====================================================

  if (
    text.includes("youtube.com") ||
    text.includes("youtu.be")
  ) {
    return "youtube";
  }

  if (
    text.includes("http://") ||
    text.includes("https://")
  ) {
    return "web";
  }

  // =====================================================
  // FILE MODE
  // =====================================================

  if (
    Array.isArray(files) &&
    files.length > 0
  ) {

    const file =
      files[0] || {};

    const mime = String(
      file.mimeType ||
      file.mimetype ||
      ""
    ).toLowerCase();

    const name = String(
      file.name ||
      file.originalname ||
      ""
    ).toLowerCase();

    // =================================================
    // IMAGE
    // =================================================

    if (
      mime.startsWith("image/") ||
      endsWithAny(name, [
        ".png",
        ".jpg",
        ".jpeg",
        ".webp",
      ])
    ) {

      // OCR / Scan
      if (
        hasAny(text, [
          "ocr",
          "scan",
          "extract text",
          "read text",
          "receipt",
          "bill",
          "document",
          "id card",
          "notes",
          "handwriting",
        ])
      ) {
        return "ocr";
      }

      // Camera AI
      if (
        hasAny(text, [
          "what is this",
          "identify",
          "camera",
          "object",
          "analyze image",
          "describe image",
        ])
      ) {
        return "vision";
      }

      // Image Edit
      if (
        hasAny(text, [
          "edit",
          "remove background",
          "enhance",
          "fix image",
          "change background",
        ])
      ) {
        return "image_edit";
      }

      // Animate
      if (
        hasAny(text, [
          "animate",
          "image to video",
          "make video",
        ])
      ) {
        return "image_video";
      }

      // Anime / Ghibli
      if (
        hasAny(text, [
          "ghibli",
          "anime",
          "pixar",
          "cartoon",
        ])
      ) {
        return "ghibli";
      }

      return "vision";
    }

    // =================================================
    // VIDEO
    // =================================================

    if (
      mime.startsWith("video/") ||
      endsWithAny(name, [
        ".mp4",
        ".mov",
        ".avi",
        ".mkv",
        ".webm",
      ])
    ) {

      return "video";
    }

    // =================================================
    // AUDIO
    // =================================================

    if (
      mime.startsWith("audio/") ||
      endsWithAny(name, [
        ".mp3",
        ".wav",
        ".aac",
        ".m4a",
        ".ogg",
      ])
    ) {

      return "audio";
    }

    // =================================================
    // CODE FILES
    // =================================================

    if (
      endsWithAny(name, [
        ".js",
        ".ts",
        ".jsx",
        ".tsx",
        ".dart",
        ".py",
        ".java",
        ".cpp",
        ".c",
        ".json",
      ])
    ) {

      return "code";
    }

    // =================================================
    // EXCEL / SHEETS
    // =================================================

    if (
      mime.includes("sheet") ||
      mime.includes("excel") ||
      endsWithAny(name, [
        ".xlsx",
        ".xls",
        ".csv",
      ])
    ) {

      return "spreadsheet";
    }

    // =================================================
    // DOCUMENTS
    // =================================================

    if (
      mime.includes("pdf") ||
      mime.includes("word") ||
      mime.includes("text") ||
      endsWithAny(name, [
        ".pdf",
        ".docx",
        ".txt",
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

  // Image Generation
  if (
    hasAny(text, [
      "generate image",
      "create image",
      "draw",
      "logo",
      "poster",
      "wallpaper",
    ])
  ) {
    return "image";
  }

  // Resume
  if (
    hasAny(text, [
      "resume",
      "cv",
      "ats resume",
    ])
  ) {
    return "resume";
  }

  // PDF
  if (
    hasAny(text, [
      "make pdf",
      "export pdf",
    ])
  ) {
    return "pdf";
  }

  // Audio
  if (
    hasAny(text, [
      "speech",
      "voice",
      "song",
      "music",
    ])
  ) {
    return "audio";
  }

  // Video
  if (
    hasAny(text, [
      "reel",
      "shorts",
      "video",
    ])
  ) {
    return "video";
  }

  // Search
  if (
    hasAny(text, [
      "news",
      "latest",
      "search",
      "find",
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
  return arr.some((w) =>
    text.includes(w)
  );
}

function endsWithAny(
  name,
  arr = []
) {
  return arr.some((ext) =>
    name.endsWith(ext)
  );
}