import axios from "axios";

// 🧠 SMART MODEL ROUTER
function chooseModel(messages) {
  const last = messages[messages.length - 1]?.text?.toLowerCase() || "";

  // 🔥 Vision / image tasks
  if (last.includes("image") || last.includes("photo")) {
    return "gemini"; // best for vision
  }

  // ⚡ Fast replies
  if (last.length < 50) {
    return "groq"; // ultra fast
  }

  // 📚 Heavy reasoning
  if (last.includes("explain") || last.includes("why")) {
    return "gpt4o"; // deep thinking
  }

  // 🤖 fallback
  return "gpt4o";
}

export async function sendToDevuAI(messages) {
  const formattedMessages = messages.map(m => ({
    role:
      m.sender === "user"
        ? "user"
        : m.sender === "ai"
        ? "assistant"
        : "system",
    content: m.text,
  }));

  // =========================
  // 🔥 TRY 1 — GPT (BEST)
  // =========================
  try {
    console.log("🧠 Trying GPT-4o...");

    const res = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-4o",
        messages: formattedMessages,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        },
      }
    );

    return res.data.choices[0].message.content;
  } catch (e) {
    console.log("⚠️ GPT failed → switching to Groq");
  }

  // =========================
  // ⚡ TRY 2 — GROQ (FAST)
  // =========================
  try {
    const res = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama3-70b-8192",
        messages: formattedMessages,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
      }
    );

    return res.data.choices[0].message.content;
  } catch (e) {
    console.log("⚠️ Groq failed → switching to Gemini");
  }

  // =========================
  // 🧠 TRY 3 — GEMINI (LAST)
  // =========================
  try {
    const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2-5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: formattedMessages.map(m => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        })),
      }
    );

    return res.data.candidates[0].content.parts[0].text;
  } catch (e) {
    console.log("❌ All AI models failed");
    return "⚠️ DevU AI is currently unavailable";
  }
}