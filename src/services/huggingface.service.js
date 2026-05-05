import fetch from "node-fetch";

const HF_URL =
  "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3";

export async function streamHuggingFace(messages) {
  if (!process.env.HUGGINGFACE_API_KEY) {
    throw new Error("HUGGINGFACE_API_KEY missing");
  }

  // ======================================
  // 🔥 SMART PROMPT (IMPORTANT)
  // ======================================
  const systemPrompt =
    "You are DevU AI, a helpful, smart, friendly assistant.";

  const chat = messages
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n");

  const finalPrompt = `
${systemPrompt}

${chat}

ASSISTANT:
`;

  // ======================================
  // HF REQUEST
  // ======================================
  const res = await fetch(HF_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inputs: finalPrompt,
      parameters: {
        max_new_tokens: 300,
        temperature: 0.7,
        return_full_text: false,
      },
    }),
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  const data = await res.json();

  const text =
    Array.isArray(data)
      ? data?.[0]?.generated_text ?? ""
      : data?.generated_text ?? "";

  // ======================================
  // 🔥 STREAM (SMOOTH)
  // ======================================
  async function* streamTokens() {
    if (!text || text.trim() === "") {
      yield "⚠️ HuggingFace returned empty response.";
      return;
    }

    const chunks = text.match(/.{1,35}/g) || [];

    for (const chunk of chunks) {
      yield chunk;
      await new Promise((r) => setTimeout(r, 15));
    }
  }

  return streamTokens();
}