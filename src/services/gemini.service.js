import fetch from "node-fetch";

/**
 * ==========================================
 * 🔥 DevU AI Gemini Text + Vision Service
 * Supports:
 * ✅ Normal chat
 * ✅ Camera / Photos
 * ✅ Image understanding
 * ✅ Fast token streaming
 * ==========================================
 */

export async function streamGemini(
  messages = [],
  imageBuffer = null,
  mimeType = "image/jpeg"
) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY missing");
  }

  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
    apiKey;

  let contents = [];

  // ==========================================
  // 🧠 NORMAL CHAT MODE
  // ==========================================
  if (
  !imageBuffer ||
  !Buffer.isBuffer(imageBuffer) ||
  imageBuffer.length === 0
) {
    contents = messages.map((m) => {
      let text = "";

      if (Array.isArray(m.content)) {
        text = m.content
          .filter((p) => p.type === "text")
          .map((p) => p.text || "")
          .join(" ");
      } else {
        text = String(m.content || "");
      }

      return {
        role:
          m.role === "assistant"
            ? "model"
            : "user",
        parts: [
          {
            text:
              text.trim() ||
              "Hello",
          },
        ],
      };
    });
  }

  // ==========================================
  // 🖼️ CAMERA / PHOTO MODE
  // ==========================================
  else {
    let prompt =
      "Explain this image clearly.";

    const last =
      messages[
        messages.length - 1
      ]?.content;

    if (Array.isArray(last)) {
      prompt = last
        .filter(
          (p) =>
            p.type ===
            "text"
        )
        .map(
          (p) =>
            p.text || ""
        )
        .join(" ")
        .trim();
    } else if (last) {
      prompt = String(
        last
      ).trim();
    }

    if (!prompt) {
      prompt =
        "Explain this image clearly.";
    }

    contents = [
      {
        role: "user",
        parts: [
          {
            text: prompt,
          },
          {
            inline_data: {
  mime_type: mimeType,
  data: imageBuffer.toString("base64"),
},
          },
        ],
      },
    ];
  }

  // ==========================================
// 🚀 GEMINI REQUEST
// ==========================================

const controller = new AbortController();

const timeout = setTimeout(
  () => controller.abort(),
  45000
);

try {

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    signal: controller.signal,
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192,
        topP: 0.95,
      },
    }),
  });

  const rawText = await res.text();

  if (!res.ok) {

    console.error(
      "❌ GEMINI API ERROR:",
      rawText
    );

    return {
      stream: (async function* () {
        yield "⚠️ AI service temporarily unavailable.";
      })(),
      text:
        "⚠️ AI service temporarily unavailable.",
      usedModel:
        "gemini-fallback",
    };
  }

  const data = JSON.parse(rawText);

  console.log(
    "🔥 GEMINI RAW:",
    JSON.stringify(data, null, 2)
  );

  const candidate =
    data?.candidates?.[0];

  let text = "";

  if (
    candidate?.content?.parts &&
    Array.isArray(
      candidate.content.parts
    )
  ) {
    text = candidate.content.parts
      .map((p) => p?.text || "")
      .join(" ")
      .trim();
  }

  if (!text) {
    text =
      candidate?.output_text ||
      data?.text ||
      "";
  }

  if (!text) {
    text =
      "⚠️ Gemini returned empty response.";
  }

  async function* streamTokens() {

    const chunks =
      text.match(/.{1,35}/g) || [];

    for (const chunk of chunks) {

      yield chunk;

      await new Promise(
        (r) => setTimeout(r, 12)
      );
    }
  }

  return {
    stream: streamTokens(),
    text,
    usedModel: "gemini-2.5-flash",
  };

} catch (err) {

  console.error(
    "❌ GEMINI CRASH:",
    err.message
  );

  return {
    stream: (async function* () {
      yield "⚠️ AI service unavailable.";
    })(),
    text:
      "⚠️ AI service unavailable.",
    usedModel:
      "gemini-fallback",
  };

} finally {

  clearTimeout(timeout);

}
}