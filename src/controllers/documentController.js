import fs from "fs";
import path from "path";
import { extractTextFromFile } from "../services/documentService.js";
import { summarizeDocument } from "../services/documentService.js";

export const handleDocumentUpload = async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const filePath = file.path;

    console.log("📄 Document received:", file.originalname);

    // =========================
    // STEP 3 — EXTRACT TEXT
    // =========================

    const text = await extractTextFromFile(filePath, file.mimetype);

    console.log("📝 Extracted text length:", text.length);

    // =========================
    // STEP 4 — SUMMARIZE
    // =========================

    const summary = await summarizeDocument(text);

    // cleanup
    fs.unlinkSync(filePath);

    return res.json({
      success: true,
      summary,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Document processing failed" });
  }
};