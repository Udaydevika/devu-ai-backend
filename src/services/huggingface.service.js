import fetch from "node-fetch";

const HF_URL =
"https://router.huggingface.co/hf-inference/models/mistralai/Mistral-7B-Instruct-v0.3";

export async function streamHuggingFace(messages) {
  if (!process.env.HUGGINGFACE_API_KEY) {
    throw new Error("HUGGINGFACE_API_KEY missing");
  }

  // ✅ BETTER PROMPT FORMAT
  const prompt = messages
 .map(m => `${m.role}: ${m.content}`)
 .join("\n");

  const res = await fetch(HF_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        max_new_tokens: 200,
        temperature: 0.7,
      },
    }),
  });

  if (!res.ok) throw new Error(await res.text());

  const data = await res.json();

  const text =
    Array.isArray(data)
      ? data?.[0]?.generated_text ?? ""
      : data?.generated_text ?? "";

  // 🔥 SAFE STREAM
  async function* streamTokens() {
    if (!text || text.trim() === "") {
      yield "⚠️ HuggingFace returned empty response.";
      return;
    }

    const chunks = text.match(/.{1,40}/g) || [];

    for (const chunk of chunks) {
      yield chunk;
      await new Promise((r) => setTimeout(r, 20));
    }
  }

  return streamTokens();
}