import Groq from "groq-sdk";

export async function streamGroq(messages) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY missing");
  }

  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });

  const formattedMessages = [
    { role: "system", content: "You are a helpful AI assistant." },
    ...messages,
  ];

  const stream = await groq.chat.completions.create({
    model: "mixtral-8x7b-32768", // ✅ FIXED MODEL
    messages: formattedMessages,
    stream: true,
  });

  async function* streamTokens() {
    let hasToken = false;

    for await (const chunk of stream) {
      const token = chunk?.choices?.[0]?.delta?.content;

      console.log("🟡 GROQ CHUNK:", JSON.stringify(chunk));

      if (token && token.trim() !== "") {
        hasToken = true;
        yield token;
      }
    }

    if (!hasToken) {
      console.log("❌ GROQ EMPTY RESPONSE");
      yield "⚠️ Groq returned empty response.";
    }
  }

  return streamTokens();
}