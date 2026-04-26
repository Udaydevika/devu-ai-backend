import fetch from "node-fetch";

const OPENROUTER_URL =
  "https://openrouter.ai/api/v1/chat/completions";

/**
 * 🔥 DevU AI — OpenRouter Streaming Service
 * ✔ text
 * ✔ multi-turn
 * ✔ multiple images
 * ✔ SSE streaming
 */
export async function streamOpenRouter(
  messages,
  files = [],
  model = "openai/gpt-4o-mini"
) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("❌ OPENROUTER_API_KEY missing");
  }

  console.log("========== OPENROUTER DEBUG ==========");
  console.log("Incoming model:", model);
  console.log("Messages:", messages.length);
  console.log("Files:", files.length);
  console.log("======================================");

  // =====================================================
  // 🧠 SAFE MODEL MAPPING
  // =====================================================

  let finalModel = "openai/gpt-4o-mini";

  if (model === "gpt4o" || model === "gpt-4o") {
    finalModel = "openai/gpt-4o";
  }

  if (model === "gpt-4o-mini") {
    finalModel = "openai/gpt-4o-mini";
  }

  console.log("🚀 Using OpenRouter model:", finalModel);

  // =====================================================
  // 🧠 BUILD CHAT MESSAGES
  // =====================================================

  const chatMessages = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  // =====================================================
  // 🖼️ IMAGE ATTACHMENT SUPPORT
  // =====================================================

  if (files.length > 0) {
    const images = files
      .filter((f) => f.mimeType?.startsWith("image/"))
      .map((f) => ({
        type: "image_url",
        image_url: {
          url: `data:${f.mimeType};base64,${f.bytes.toString("base64")}`,
        },
      }));

    if (images.length > 0) {
      const lastUserIndex = [...chatMessages]
        .reverse()
        .findIndex((m) => m.role === "user");

      if (lastUserIndex !== -1) {
        const realIndex =
          chatMessages.length - 1 - lastUserIndex;

        chatMessages[realIndex] = {
          role: "user",
          content: [
            {
              type: "text",
              text: chatMessages[realIndex].content,
            },
            ...images,
          ],
        };
      }
    }
  }

  // =====================================================
  // 🚀 OPENROUTER REQUEST
  // =====================================================

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      "HTTP-Referer": "https://devu.ai",
      "X-Title": "DevU AI",
    },
    body: JSON.stringify({
      model: finalModel,
      stream: true,
      max_tokens: 1024,
      messages: chatMessages,
    }),
  });

  console.log("OpenRouter status:", res.status);

  if (!res.ok) {
    const err = await res.text();
    console.error("❌ OpenRouter error:", err);
    throw new Error(err);
  }

  console.log("✅ OpenRouter streaming started");

  // =====================================================
  // 🔥 STREAM PARSER
  // =====================================================
const decoder = new TextDecoder();

async function* streamTokens() {
  let buffer = "";

  for await (const chunk of res.body) {
    buffer += decoder.decode(chunk, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data:")) continue;

      const raw = line.replace("data:", "").trim();

      if (!raw) continue;
      if (raw === "[DONE]") return;

      try {
        const json = JSON.parse(raw);
        const token = json?.choices?.[0]?.delta?.content;

        if (typeof token === "string" && token.length > 0) {
          yield token;
        }
      } catch {}
    }
  }
}

// ✅ THIS IS THE FIX
return streamTokens();
}