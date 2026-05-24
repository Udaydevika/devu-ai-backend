// src/ai/toolRouter.js

/**
 * ==========================================
 * 🔥 DevU AI FINAL PROFESSIONAL TOOL ROUTER
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

  // ==========================================
  // 🔥 FILE EXISTS
  // ==========================================

  const hasFiles =
    Array.isArray(files) &&
    files.length > 0;

  // ==========================================
  // 🌐 URL DETECTION
  // ==========================================

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

  // ==========================================
  // 💻 CODING DETECTION
  // ==========================================

  if (
    hasAny(text, [
      "flutter",
      "react",
      "nextjs",
      "node",
      "express",
      "mongodb",
      "firebase",
      "api",
      "backend",
      "frontend",
      "debug",
      "fix error",
      "dart",
      "javascript",
      "typescript",
      "python",
      "java",
      "cpp",
      "c++",
      "compile",
      "gradle",
      "build apk",
      "android studio",
      "vs code",
      "code",
    ])
  ) {

    return "coding";
  }

  // ==========================================
  // 📂 FILE MODE
  // ==========================================

  if (hasFiles) {

    const file =
  Array.isArray(files)
    ? files[0] || {}
    : {};

    const mime = String(

      file.mimeType ||

      file.mimetype ||

      file.type ||

      ""

    )
      .toLowerCase()
      .trim();

    const name = String(

      file.name ||

      file.originalname ||

      ""

    )
      .toLowerCase();

    // ==========================================
// 🖼️ IMAGE
// ==========================================

if (

mime.startsWith("image/") ||

endsWithAny(name, [
".png",
".jpg",
".jpeg",
".webp",
".gif",
])

) {

// ======================================
// OCR
// ======================================

if (
hasAny(text, [
"ocr",
"extract text",
"scan",
"read text",
"receipt",
"invoice",
"notes",
"handwriting",
"id card",
"document scan",
"screenshot",
])
) {

return "ocr";

}

// ======================================
// IMAGE EDIT
// ======================================

if (
hasAny(text, [
"edit",
"enhance",
"remove background",
"change background",
"blur",
"fix image",
"restore",
])
) {

return "image_edit";

}

// ======================================
// IMAGE VARIATIONS
// ======================================

if (
hasAny(text, [
"variation",
"variations",
"similar image",
"same style",
"more like this",
"alternative version",
"different version",
"remix image",
])
) {

return "image_variation";

}

// ======================================
// IMAGE TO VIDEO
// ======================================

if (
hasAny(text, [
"animate",
"image to video",
"make video",
"motion",
])
) {


return "image_video";

}

// ======================================
// GHIBLI / ANIME
// ======================================

if (
hasAny(text, [
"ghibli",
"anime",
"pixar",
"cartoon",
"disney style",
])
) {


return "image_generation";

}

// ======================================
// DEFAULT
// ======================================

return "vision";
}


    // ==========================================
    // 🎤 AUDIO
    // ==========================================

    if (

      mime.startsWith("audio/") ||

      mime.includes("mpeg") ||

      mime.includes("wav") ||

      mime.includes("ogg") ||

      mime.includes("aac") ||

      mime.includes("m4a") ||

      mime.includes("webm") ||

      endsWithAny(name, [
        ".mp3",
        ".wav",
        ".ogg",
        ".aac",
        ".m4a",
        ".webm",
      ])

    ) {

      return "audio";
    }

    // ==========================================
    // 🎥 VIDEO
    // ==========================================

    if (

      mime.startsWith("video/") ||

      mime.includes("mp4") ||

      mime.includes("quicktime") ||

      mime.includes("webm") ||

      mime.includes("x-matroska") ||

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

    // ==========================================
    // 💻 CODE FILES
    // ==========================================

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
        ".gradle",
      ])
    ) {

      return "coding";
    }

    // ==========================================
    // 📄 DOCUMENTS
    // ==========================================

    if (

      mime.includes("pdf") ||

      mime.includes("word") ||

      mime.includes("document") ||

      mime.includes("sheet") ||

      mime.includes("excel") ||

      mime.includes("csv") ||

      name.endsWith(".pdf") ||

      name.endsWith(".docx") ||

      name.endsWith(".txt") ||

      name.endsWith(".csv") ||

      name.endsWith(".md")

    ) {

      return "file";
    }
  }

  // ==========================================
  // 🖼️ IMAGE GENERATION
  // ==========================================

  if (
    hasAny(text, [
      "generate image",
      "create image",
      "draw",
      "wallpaper",
      "poster",
      "logo",
      "ai art",
    ])
  ) {

    return "image_generation";
  }

  // ==========================================
  // 📄 RESUME
  // ==========================================

  if (
    hasAny(text, [
      "resume",
      "cv",
      "ats resume",
    ])
  ) {

    return "resume";
  }

  // ==========================================
  // 📕 PDF
  // ==========================================

  if (
    hasAny(text, [
      "make pdf",
      "export pdf",
    ])
  ) {

    return "pdf";
  }

  // ==========================================
  // 🌐 SEARCH
  // ==========================================

  if (
    hasAny(text, [
      "latest",
      "news",
      "search",
      "find",
      "weather",
      "price",
    ])
  ) {

    return "search";
  }

 // ==========================================
// 🧠 SMART ANALYSIS
// ==========================================

if (
  hasAny(text, [
    "explain",
    "why",
    "teach",
    "reason",
    "analyze",
  ])
) {

  return "coding";
}

// ==========================================
// 🔥 FILE FALLBACK FIX
// ==========================================

if (hasFiles) {

  const file =
    Array.isArray(files)
      ? files[0] || {}
      : {};

  const mime = String(

    file.mimeType ||

    file.mimetype ||

    ""

  ).toLowerCase();

  // ==========================
  // SAFE FALLBACKS
  // ==========================

  if (mime.startsWith("image/")) {
    return "vision";
  }

  if (mime.startsWith("audio/")) {
    return "audio";
  }

  if (mime.startsWith("video/")) {
    return "video";
  }

  return "file";
}

// ==========================================
// ⚡ DEFAULT
// ==========================================

return "groq_chat";
}

// ==========================================
// HELPERS
// ==========================================

function hasAny(
  text,
  arr = []
) {

  return arr.some((w) =>
    text.includes(w)
  );
}

function endsWithAny(
  text,
  arr = []
) {

  return arr.some((ext) =>
    text.endsWith(ext)
  );
}
