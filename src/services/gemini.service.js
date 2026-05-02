import fetch from "node-fetch";

/**
 * ==========================================
 * 🔥 DevU AI Gemini Text + Vision Service
 * Supports:
 * ✅ normal chat
 * ✅ image understanding
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
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?key=" +
    apiKey;

  // ==========================================
  // 🧠 TEXT ONLY MODE
  // ==========================================
  let contents = [];

  if (!imageBuffer) {
    contents = messages.map((m) => ({
      role:
        m.role === "assistant"
          ? "model"
          : "user",
      parts: [
        {
          text: m.content,
        },
      ],
    }));
  }

  // ==========================================
  // 🖼️ IMAGE + TEXT MODE
  // ==========================================
  else {
    const prompt =
      messages?.[messages.length - 1]
        ?.content ||
      "Explain this image";

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
              data: imageBuffer.toString(
                "base64"
              ),
            },
          },
        ],
      },
    ];
  }

  // ==========================================
  // 🚀 API REQUEST
  // ==========================================
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type":
        "application/json",
    },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    }),
  });

  if (!res.ok) {
    throw new Error(
      await res.text()
    );
  }

  const data =
    await res.json();

  const parts =
    data?.candidates?.[0]
      ?.content?.parts || [];

  const text = parts
    .map(
      (p) => p.text || ""
    )
    .join("")
    .trim();

  // ==========================================
  // 🔥 STREAM TOKENS
  // ==========================================
  async function* streamTokens() {
    if (!text) {
      yield "⚠️ Gemini returned empty response.";
      return;
    }

    const chunks =
      text.match(
        /.{1,40}/g
      ) || [];

    for (const chunk of chunks) {
      yield chunk;

      await new Promise(
        (r) =>
          setTimeout(r, 15)
      );
    }
  }

  return streamTokens();
}