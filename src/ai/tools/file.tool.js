import * as pdf from "pdf-parse";
import mammoth from "mammoth";

export async function handleFile(file) {
  try {
    let text = "";

    const mime =
      file.mimeType ||
      file.mimetype ||
      "";

    const name = (
      file.name ||
      file.originalname ||
      ""
    ).toLowerCase();

    // PDF
    if (mime.includes("pdf")) {
      const data =
        await pdf(file.buffer);
      text = data.text;
    }

    // DOCX
    else if (
      mime.includes("word") ||
      name.endsWith(".docx")
    ) {
      const data =
        await mammoth.extractRawText({
          buffer: file.buffer,
        });

      text = data.value;
    }

    // TXT / CSV / JSON
    else if (
      mime.includes("text") ||
      mime.includes("json") ||
      mime.includes("csv") ||
      name.endsWith(".txt") ||
      name.endsWith(".csv") ||
      name.endsWith(".json")
    ) {
      text =
        file.buffer.toString(
          "utf8"
        );
    }

    else {
      return "⚠️ Unsupported file type.";
    }

    text = text
      .replace(/\s+/g, " ")
      .trim();

    if (!text) {
      return "⚠️ No readable text found.";
    }

    const short =
      text.length > 5000
        ? text.substring(0, 5000)
        : text;

    return `
📄 File Read Successfully

📌 File Name:
${name}

📝 Summary Preview:

${short}

💡 Ask:
• Summarize this
• Explain key points
• Convert to notes
• Translate document
`;
  } catch (err) {
    console.error(
      "❌ File tool error:",
      err.message
    );

    return "⚠️ Failed to process file.";
  }
}