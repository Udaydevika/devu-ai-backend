import fs from "fs";
import path from "path";
import os from "os";
import FormData from "form-data";
import fetch from "node-fetch";

export async function handleAudio(
  file,
  userPrompt = ""
) {
  let tempPath = "";

  try {
    if (!file?.buffer) {
      return "⚠️ No audio file found.";
    }

    const apiKey =
      process.env.GROQ_API_KEY;

    const name =
      file.name ||
      file.originalname ||
      "voice_note.mp3";

    const ext =
      path.extname(name) ||
      ".mp3";

    tempPath = path.join(
      os.tmpdir(),
      `devu_${Date.now()}${ext}`
    );

    fs.writeFileSync(
      tempPath,
      file.buffer
    );

    if (!apiKey) {
      return `
🎤 Audio Uploaded

Speech API key missing.
`;
    }

    const form =
      new FormData();

    form.append(
      "file",
      fs.createReadStream(tempPath)
    );

    form.append(
      "model",
      "whisper-large-v3"
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

    const text =
      data?.text?.trim() ||
      "";

    if (!text) {
      return `
🎤 Audio received.

No speech detected clearly.
`;
    }

    const p =
      userPrompt.toLowerCase();

    if (
      p.includes("summary") ||
      p.includes("summarize")
    ) {
      return `
📝 Audio Summary

${text.substring(0, 2500)}
`;
    }

    if (
      p.includes("translate")
    ) {
      return `
🌍 Audio Transcript

${text}
`;
    }

    return `
🎤 Audio Transcription Complete

${text}
`;
  } catch (err) {
    console.error(
      "Audio error:",
      err.message
    );

    return `
🎤 Audio uploaded.

Transcription temporarily unavailable.
`;
  } finally {
    try {
      if (
        tempPath &&
        fs.existsSync(
          tempPath
        )
      ) {
        fs.unlinkSync(
          tempPath
        );
      }
    } catch {}
  }
}