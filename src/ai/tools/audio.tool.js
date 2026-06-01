// src/ai/tools/audio.tool.js

import fs from "fs";
import path from "path";
import os from "os";
import FormData from "form-data";
import fetch from "node-fetch";

/**
 * ==========================================
 * 🔥 DevU AI FINAL AUDIO TOOL
 *
 * Features:
 * ✅ Audio upload
 * ✅ Permanent save
 * ✅ Groq Whisper transcription
 * ✅ Transcript support
 * ✅ Flutter audio player compatible
 * ✅ Structured return format
 * ==========================================
 */

export async function handleAudio(
  file,
  userPrompt = ""
) {
  let tempPath = "";

  try {
    // ======================================
    // VALIDATE
    // ======================================
    if (!file?.buffer && !file?.path) {
      return {
        type: "text",
        text: "⚠️ No audio file found.",
      };
    }

    const apiKey =
      process.env.GROQ_API_KEY;

    const name =
      file.name ||
      file.originalname ||
      "voice_note.mp3";

    const ext =
      path.extname(name) || ".mp3";

    // ======================================
    // TEMP FILE (FOR WHISPER API)
    // ======================================
    tempPath = path.join(
      os.tmpdir(),
      `devu_${Date.now()}${ext}`
    );

    let audioBuffer = null;

if (file.buffer) {

  audioBuffer = file.buffer;

} else if (
  file.path &&
  fs.existsSync(file.path)
) {

  audioBuffer =
    fs.readFileSync(file.path);
}

if (
  !audioBuffer ||
  audioBuffer.length === 0
) {

  throw new Error(
    "Invalid audio buffer"
  );
}

console.log(
  "🎧 AUDIO SIZE:",
  audioBuffer.length
);

console.log(
  "🎧 AUDIO FILE:",
  name
);

fs.writeFileSync(
  tempPath,
  audioBuffer
);

console.log(
  "🎧 AUDIO RECEIVED:",
  {
    name,
    size: audioBuffer.length,
  }
);

    // ======================================
    // SAVE PUBLIC AUDIO
    // ======================================
    const fileName =
      `audio_${Date.now()}${ext}`;

    const dir = path.join(
      process.cwd(),
      "public",
      "generated"
    );

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, {
        recursive: true,
      });
    }

    const finalPath = path.join(
      dir,
      fileName
    );

    
fs.writeFileSync(
  finalPath,
  audioBuffer
);

console.log(
  "✅ AUDIO SAVED:",
  finalPath
);

console.log(
  "✅ EXISTS:",
  fs.existsSync(finalPath)
);

console.log(
  "📂 GENERATED DIR:",
  dir
);


const base =

  process.env.PUBLIC_URL ||

  "http://localhost:3000";

const fileUrl =
  `${base}/generated/${fileName}`;


    // ======================================
    // NO API KEY → STILL RETURN AUDIO
    // ======================================
    if (!apiKey) {
      return {
        type: "audio",
        url: fileUrl,
        transcript: "",
      };
    }

    // ======================================
    // GROQ WHISPER TRANSCRIPTION
    // ======================================
    const form = new FormData();

    form.append(
      "file",
      fs.createReadStream(tempPath)
    );

    form.append(
      "model",
      "whisper-large-v3"
    );

    console.log(
  "🚀 STARTING WHISPER"
);

    const res = await fetch(
      "https://api.groq.com/openai/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization:
            `Bearer ${apiKey}`,
        },
        body: form,
      }
    );

    if (!res.ok) {
      throw new Error(
        await res.text()
      );
    }

    const data =
      await res.json();

    let text =
      data?.text?.trim() || "";

      console.log(
  "📝 TRANSCRIPT:",
  text.substring(0, 200)
);

      // ======================================
// UTF-8 CLEANUP
// ======================================

text = Buffer.from(
  text,
  "utf8"
).toString("utf8");

// remove broken chars
text = text.replace(
  /�/g,
  ""
);

    // ======================================
    // SMART PROMPT MODES
    // ======================================
    const p =
      String(userPrompt || "")
        .toLowerCase()
        .trim();

    if (
      p.includes("summary") ||
      p.includes("summarize")
    ) {
     text =
  text.length > 2000
    ? text.slice(0, 2000) + "\n\n...[truncated]"
    : text;
    }

    if (
      p.includes("translate")
    ) {
      text =
        `🌍 Translation / Transcript:\n\n${text}`;
    }

    // ======================================
// FINAL STRUCTURED RESPONSE
// ======================================

console.log(
  "✅ AUDIO SUCCESS:",
  fileUrl
);

return {
  type: "audio",
  url: fileUrl,
  transcript:
    text ||
    "Audio processed.",
  text:
    text ||
    "Audio processed.",
};

  } catch (err) {
    console.error(
      "❌ Audio Tool Error:",
      err.message
    );

    return {
  type: "audio",
  text: "⚠️ Audio processing failed.",
  transcript: "",
  url: null,
};

  } finally {
    // ======================================
    // CLEAN TEMP FILE
    // ======================================
    try {
      if (
        tempPath &&
        fs.existsSync(tempPath)
      ) {
        fs.unlinkSync(tempPath);
      }
    } catch (_) {}
  }
}