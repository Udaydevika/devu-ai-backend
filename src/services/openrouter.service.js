import fetch from "node-fetch";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

/**
 * 🔥 DevU AI — OpenRouter Streaming Service (FIXED)
 */
export async function streamOpenRouter(
  messages = [],
  files = [],
  model = "openai/gpt-4o-mini"
) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  // ❌ HARD FAIL if key missing
  if (!apiKey) {
    console.error("❌ OPENROUTER_API_KEY missing in ENV");
    throw new Error("OpenRouter not configured");
  }

  console.log("========== OPENROUTER ==========");
  console.log("Model input:", model);
  console.log("Messages:", messages.length);
  console.log("Files:", files.length);
  console.log("================================");

  // =====================================================
  // 🧠 MODEL MAPPING (SAFE)
  // =====================================================
  let finalModel = "openai/gpt-4o-mini";

  switch (model) {
    case "gpt4o":
    case "gpt-4o":
      finalModel = "openai/gpt-4o";
      break;

    case "gpt-4o-mini":
      finalModel = "openai/gpt-4o-mini";
      break;

    default:
      finalModel = model || "openai/gpt-4o-mini";
  }

  console.log("🚀 Using model:", finalModel);

  // =====================================================
  // 🧠 FORMAT MESSAGES
  // =====================================================
  const chatMessages = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  // =====================================================
  // 🖼️ IMAGE SUPPORT
  // =====================================================
  if (files?.length > 0) {
    const images = files
      .filter((f) => f?.mimeType?.startsWith("image/"))
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
        const realIndex = chatMessages.length - 1 - lastUserIndex;

        chatMessages[realIndex] = {
          role: "user",
          content: [
            {
              type: "text",
              text: chatMessages[realIndex].content || "",
            },
            ...images,
          ],
        };
      }
    }
  }

  // =====================================================
  // 🚀 API CALL
  // =====================================================
  let res;

  try {
    res = await fetch(OPENROUTER_URL, {
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
  } catch (err) {
    console.error("❌ Network error:", err.message);
    throw new Error("OpenRouter request failed");
  }

  console.log("📡 Status:", res.status);

  if (!res.ok) {
    const errText = await res.text();
    console.error("❌ OpenRouter error:", errText);
    throw new Error(errText);
  }

  console.log("✅ Streaming started");

  // =====================================================
  // 🔥 STREAM PARSER (IMPROVED)
  // =====================================================
  const decoder = new TextDecoder();

  async function* streamTokens() {
    let buffer = "";

    try {
      for await (const chunk of res.body) {
        buffer += decoder.decode(chunk, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data:")) continue;

          const raw = line.replace("data:", "").trim();

          if (!raw) continue;
          if (raw === "[DONE]") return;

          try {
            const json = JSON.parse(raw);
            const token = json?.choices?.[0]?.delta?.content;

            if (token) yield token;
          } catch {
            // ignore parse errors
          }
        }
      }
    } catch (err) {
      console.error("❌ Stream error:", err.message);
    }
  }

  return streamTokens();
}