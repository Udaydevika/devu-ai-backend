import fetch from "node-fetch";

const OPENROUTER_URL =
  "https://openrouter.ai/api/v1/chat/completions";

/**
 * 🚀 DevU AI - OpenRouter Ultra Fast Streaming Service
 */
export async function streamOpenRouter(
  messages = [],
  files = [],
  model = "openai/gpt-4o-mini"
) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  // ===============================
  // 🔐 ENV CHECK
  // ===============================
  if (!apiKey) {
    console.error("❌ OPENROUTER_API_KEY missing");
    throw new Error("OpenRouter not configured");
  }

  // ===============================
  // 🧠 MODEL MAP
  // ===============================
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

  // ===============================
  // 💬 FORMAT MESSAGES
  // ===============================
  const chatMessages = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  // ===============================
  // 🖼 IMAGE SUPPORT
  // ===============================
 if (files?.length > 0) {
  const images = files
    .filter((f) =>
      f?.mimeType?.startsWith("image/")
    )
    .filter((f) =>
      f?.buffer || f?.bytes
    )
    .map((f) => ({
      type: "image_url",
      image_url: {
        url: `data:${f.mimeType};base64,${(
          f.buffer || f.bytes
        ).toString("base64")}`,
      },
    }));

    if (images.length > 0) {
      const lastUserIndex = [...chatMessages]
        .reverse()
        .findIndex(
          (m) => m.role === "user"
        );

      if (lastUserIndex !== -1) {
        const realIndex =
          chatMessages.length -
          1 -
          lastUserIndex;

        chatMessages[realIndex] = {
          role: "user",
          content: [
            {
              type: "text",
              text:
 typeof chatMessages[realIndex].content === "string"
   ? chatMessages[realIndex].content
   : "",
            },
            ...images,
          ],
        };
      }
    }
  }

  // ===============================
  // ⏱ TIMEOUT CONTROLLER
  // ===============================
  const controller =
    new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, 30000);

  let res;

  // ===============================
  // 🚀 API REQUEST
  // ===============================
  try {
    res = await fetch(
      OPENROUTER_URL,
      {
        method: "POST",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type":
            "application/json",
          Accept:
            "text/event-stream",
          "HTTP-Referer":
            "https://devu-ai.onrender.com",
          "X-Title":
            "DevU AI",
        },
        body: JSON.stringify({
          model: finalModel,
          stream: true,
          max_tokens: 2048,
          temperature: 0.6,
          messages: chatMessages,
        }),
      }
    );

    clearTimeout(timeout);
  } catch (err) {
    clearTimeout(timeout);

    if (err.name === "AbortError") {
      throw new Error(
        "OpenRouter timeout"
      );
    }

   throw new Error(
 `OpenRouter network failed: ${err.message}`
    );
  }

  // ===============================
  // ❌ BAD RESPONSE
  // ===============================
  if (!res.ok) {
    const errText =
      await res.text();

    throw new Error(
      `OpenRouter ${res.status}: ${errText}`
    );
  }

  // ===============================
  // 🔥 STREAM PARSER
  // ===============================
  const decoder =
    new TextDecoder();

  async function* streamTokens() {
    let buffer = "";

    try {
      for await (const chunk of res.body) {
        buffer += decoder.decode(
          chunk,
          {
            stream: true,
          }
        );

        const lines =
          buffer.split("\n");

        buffer =
          lines.pop() || "";

        for (const line of lines) {
          if (
            !line.startsWith(
              "data:"
            )
          )
            continue;

          const raw = line
            .replace(
              "data:",
              ""
            )
            .trim();

          if (!raw) continue;

          if (
            raw === "[DONE]"
          )
            return;

          try {
            const json =
              JSON.parse(
                raw
              );

            const token =
              json
                ?.choices?.[0]
                ?.delta
                ?.content;

            if (
              token &&
              token.trim() !==
                ""
            ) {
              yield token;
            }
          } catch {
            // ignore partial chunks
          }
        }
      }
    } catch (err) {
      console.error(
        "❌ Stream parser failed:",
        err.message
      );
    }
  }

  return streamTokens();
}