// src/ai/toolRouter.js

/**
 * ==========================================
 * 🔥 DevU AI CREATOR MODE TOOL ROUTER (FINAL)
 *
 * Auto Detects:
 * ✅ Camera / Photos
 * ✅ OCR / Scan / Receipt / Notes
 * ✅ Ghibli / Anime / Cartoon
 * ✅ Video Edit / Reel / Highlight
 * ✅ Audio / Voice Notes / Transcribe
 * ✅ PDF / DOCX / TXT / CSV / JSON
 * ✅ Resume / CV Builder
 * ✅ AI Image Generation
 * ✅ PDF Creation
 * ✅ News / Search
 * ✅ Normal Chat
 * ==========================================
 */

export function detectTool(
  message = "",
  files = []
) {
  const text = String(message || "")
    .toLowerCase()
    .trim();

  // =====================================================
  // FILE PRIORITY
  // =====================================================
  if (
    Array.isArray(files) &&
    files.length > 0
  ) {
    const file = files[0] || {};

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
    // IMAGE FILES
    // =================================================
    if (
      mime.startsWith("image/") ||
      name.endsWith(".png") ||
      name.endsWith(".jpg") ||
      name.endsWith(".jpeg") ||
      name.endsWith(".webp")
    ) {
      // Ghibli / Style Transfer
      if (
        hasAny(text, [
          "ghibli",
          "anime",
          "cartoon",
          "pixar",
          "studio ghibli",
          "make art",
          "make this art",
          "turn into anime",
          "convert to cartoon"
        ])
      ) {
        return "ghibli";
      }

      // OCR / Scan
      if (
        hasAny(text, [
          "ocr",
          "scan",
          "read text",
          "extract text",
          "receipt",
          "bill",
          "invoice",
          "document",
          "notes",
          "id card",
          "license"
        ])
      ) {
        return "ocr";
      }

      // Default vision
      return "vision";
    }

    // =================================================
    // VIDEO FILES
    // =================================================
    if (
      mime.startsWith("video/") ||
      endsWithAny(name, [
        ".mp4",
        ".mov",
        ".avi",
        ".mkv",
        ".webm"
      ])
    ) {
      return "video";
    }

    // =================================================
    // AUDIO FILES
    // =================================================
    if (
      mime.startsWith("audio/") ||
      endsWithAny(name, [
        ".mp3",
        ".wav",
        ".m4a",
        ".aac",
        ".ogg",
        ".webm"
      ])
    ) {
      return "audio";
    }

    // =================================================
    // DOCUMENT FILES
    // =================================================
    if (
      mime.includes("pdf") ||
      mime.includes("word") ||
      mime.includes("document") ||
      mime.includes("text") ||
      mime.includes("csv") ||
      mime.includes("json") ||
      mime.includes("excel") ||
      endsWithAny(name, [
        ".pdf",
        ".docx",
        ".txt",
        ".csv",
        ".json",
        ".md",
        ".xlsx"
      ])
    ) {
      return "file";
    }

    // Fallback uploaded file
    return "file";
  }

  // =====================================================
  // TEXT ONLY MODE
  // =====================================================

  // Resume / CV
  if (
    hasAny(text, [
      "resume",
      "cv",
      "make my resume",
      "create resume",
      "ats resume"
    ])
  ) {
    return "resume";
  }

  // Image Generation
  if (
    hasAny(text, [
      "generate image",
      "create image",
      "draw",
      "make logo",
      "thumbnail",
      "poster",
      "wallpaper",
      "ghibli art",
      "anime art"
    ])
  ) {
    return "image";
  }

  // PDF Creation
  if (
    hasAny(text, [
      "make pdf",
      "export pdf",
      "create pdf",
      "convert to pdf"
    ])
  ) {
    return "pdf";
  }

  // News / Search
  if (
    hasAny(text, [
      "news",
      "latest",
      "today news",
      "market update",
      "stock news",
      "search",
      "find"
    ])
  ) {
    return "search";
  }

  // Video requests without upload
  if (
    hasAny(text, [
      "make reel",
      "edit video",
      "viral reel",
      "shorts video"
    ])
  ) {
    return "video";
  }

  // Audio requests without upload
  if (
    hasAny(text, [
      "transcribe audio",
      "voice note",
      "speech to text"
    ])
  ) {
    return "audio";
  }

  // Default chat
  return "chat";
}

/**
 * =====================================================
 * HELPERS
 * =====================================================
 */

function hasAny(text, arr = []) {
  return arr.some((w) =>
    text.includes(w)
  );
}

function endsWithAny(name, arr = []) {
  return arr.some((ext) =>
    name.endsWith(ext)
  );
}