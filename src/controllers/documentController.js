import {
  extractTextFromFile,
  summarizeDocument,
} from "../services/documentService.js";

/**
 * ==========================================
 * 🔥 DevU AI DOCUMENT CONTROLLER
 * ==========================================
 */

export const handleDocumentUpload = async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded",
      });
    }

    console.log(
      "📄 Document received:",
      file.originalname
    );

    // ✅ EXTRACT TEXT FROM BUFFER
    const text = await extractTextFromFile(
  file.buffer,
  file.mimetype
);

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "No readable text found",
      });
    }

    console.log(
      "📝 Extracted text length:",
      text.length
    );

    // ✅ AI SUMMARY
    const summary = await summarizeDocument(text);

    return res.json({
      success: true,
      type: "document",
      text,
      summary,
    });

  } catch (err) {
    console.error(
      "❌ Document Controller:",
      err.message
    );

    return res.status(500).json({
      success: false,
      error: "Document processing failed",
    });
  }
};