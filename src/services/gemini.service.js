import fetch from "node-fetch";

export async function streamGemini(messages) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY missing");

  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
    apiKey;

  // ✅ ADD SYSTEM MESSAGE
  const contents = [
    {
      role: "user",
      parts: [{ text: "You are a helpful AI assistant." }],
    },
    ...messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
  ];

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    }),
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  const data = await res.json();

  const text =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  async function* streamTokens() {
    if (!text || text.trim() === "") {
      yield "⚠️ Gemini returned empty response.";
      return;
    }

    const chunks = text.match(/.{1,40}/g) || [];

    for (const chunk of chunks) {
      yield chunk;
      await new Promise((r) => setTimeout(r, 15));
    }
  }

  return streamTokens();
}