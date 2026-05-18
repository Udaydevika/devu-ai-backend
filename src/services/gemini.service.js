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
  if (!imageBuffer || imageBuffer.length === 0) {
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
              mime_type:
                mimeType,
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
  // 🚀 GEMINI REQUEST
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
        maxOutputTokens: 2048,
        topP: 0.95,
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
      (p) =>
        p.text || ""
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
        /.{1,35}/g
      ) || [];

    for (const chunk of chunks) {
      yield chunk;

      await new Promise(
        (r) =>
          setTimeout(
            r,
            12
          )
      );
    }
  }

  return streamTokens();
}