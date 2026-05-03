// src/ai/toolRouter.js

/**
 * ==========================================
 * 🔥 DevU AI CREATOR MODE TOOL ROUTER
 *
 * Auto detects:
 * ✅ Camera / Photos
 * ✅ OCR / Scan
 * ✅ Ghibli / Anime Art
 * ✅ Video Edit / Reel
 * ✅ Audio Notes / Transcribe
 * ✅ PDF / DOCX / TXT / CSV
 * ✅ Resume Builder
 * ✅ AI Image Generation
 * ✅ News Search
 * ✅ Normal Chat
 * ==========================================
 */

export function detectTool(
  message = "",
  files = []
) {
  const text = String(
    message || ""
  )
    .toLowerCase()
    .trim();

  // ======================================
  // FILE PRIORITY
  // ======================================
  if (
    files &&
    files.length > 0
  ) {
    const file =
      files[0];

    const mime =
      file.mimeType ||
      file.mimetype ||
      "";

    const name = String(
      file.name ||
        file.originalname ||
        ""
    ).toLowerCase();

    // ===============================
    // IMAGE FILES
    // ===============================
    if (
      mime.startsWith(
        "image/"
      )
    ) {
      // Ghibli / anime
      if (
        text.includes(
          "ghibli"
        ) ||
        text.includes(
          "anime"
        ) ||
        text.includes(
          "cartoon"
        ) ||
        text.includes(
          "pixar"
        )
      ) {
        return "ghibli";
      }

      // OCR / scan
      if (
        text.includes(
          "scan"
        ) ||
        text.includes(
          "ocr"
        ) ||
        text.includes(
          "extract text"
        ) ||
        text.includes(
          "read text"
        ) ||
        text.includes(
          "document"
        )
      ) {
        return "ocr";
      }

      // normal image understanding
      return "vision";
    }

    // ===============================
    // VIDEO FILES
    // ===============================
    if (
      mime.startsWith(
        "video/"
      )
    ) {
      return "video";
    }

    // ===============================
    // AUDIO FILES
    // ===============================
    if (
      mime.startsWith(
        "audio/"
      )
    ) {
      return "audio";
    }

    // ===============================
    // DOCUMENTS
    // ===============================
    if (
      mime.includes(
        "pdf"
      ) ||
      mime.includes(
        "word"
      ) ||
      mime.includes(
        "document"
      ) ||
      mime.includes(
        "text"
      ) ||
      mime.includes(
        "csv"
      ) ||
      mime.includes(
        "json"
      ) ||
      name.endsWith(
        ".pdf"
      ) ||
      name.endsWith(
        ".docx"
      ) ||
      name.endsWith(
        ".txt"
      ) ||
      name.endsWith(
        ".csv"
      ) ||
      name.endsWith(
        ".json"
      )
    ) {
      return "file";
    }

    // default uploaded file
    return "file";
  }

  // ======================================
  // NO FILES (TEXT ONLY)
  // ======================================

  // ===============================
  // RESUME / CV MAKER
  // ===============================
  if (
    text.includes(
      "resume"
    ) ||
    text.includes(
      "cv"
    ) ||
    text.includes(
      "make my resume"
    )
  ) {
    return "resume";
  }

  // ===============================
  // IMAGE GENERATION
  // ===============================
  if (
    text.includes(
      "generate image"
    ) ||
    text.includes(
      "create image"
    ) ||
    text.includes(
      "draw"
    ) ||
    text.includes(
      "make logo"
    ) ||
    text.includes(
      "make thumbnail"
    ) ||
    text.includes(
      "poster"
    )
  ) {
    return "image";
  }

  // ===============================
  // NEWS
  // ===============================
  if (
    text.includes(
      "news"
    ) ||
    text.includes(
      "latest"
    ) ||
    text.includes(
      "today news"
    ) ||
    text.includes(
      "market update"
    )
  ) {
    return "search";
  }

  // ===============================
  // PDF CREATION
  // ===============================
  if (
    text.includes(
      "make pdf"
    ) ||
    text.includes(
      "export pdf"
    )
  ) {
    return "pdf";
  }

  // ===============================
  // DEFAULT CHAT
  // ===============================
  return "chat";
}