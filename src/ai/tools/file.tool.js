import { extractTextFromFile, summarizeDocument } 
from "../../services/documentService.js";

export async function handleFile(file) {
  try {
    const text = await extractTextFromFile(
      file.buffer, // ✅ FIXED (NOT file.path)
      file.mimetype
    );

    return await summarizeDocument(text);
  } catch (err) {
    console.error("❌ File tool error:", err.message);
    return "⚠️ Failed to process document.";
  }
}