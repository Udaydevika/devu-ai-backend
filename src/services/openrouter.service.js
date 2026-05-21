// src/services/openrouter.service.js

import fetch from "node-fetch";

export async function streamOpenRouter(
  messages = [],
  images = [],
  model = "openai/gpt-4o-mini"
) {

  const apiKey =
    process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY missing"
    );
  }

  // =====================================
  // 🧠 FORMAT MESSAGES
  // =====================================

  const formattedMessages =
    messages.map((m) => ({

      role:
        m.role || "user",

      content:
        m.content || "",
    }));

  // =====================================
  // 🖼️ IMAGE SUPPORT
  // =====================================

  if (
    images &&
    images.length > 0
  ) {

    formattedMessages.push({
      role: "user",

      content: [

        {
          type: "text",

          text:
            messages[
              messages.length - 1
            ]?.content ||
            "Explain this image",
        },

        ...images.map((img) => ({
          type: "image_url",

          image_url: {
            url: img,
          },
        })),
      ],
    });
  }

  // =====================================
  // 🚀 API REQUEST
  // =====================================

  const response =
    await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${apiKey}`,

          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({

          model,

          messages:
            formattedMessages,

          stream: true,

          temperature: 0.7,
        }),
      }
    );

  if (!response.ok) {

    throw new Error(
      await response.text()
    );
  }

  // =====================================
  // 🔥 STREAM TOKENS
  // =====================================

  async function* streamTokens() {

    const decoder =
      new TextDecoder();

    let fullText = "";

    for await (
      const chunk of response.body
    ) {

      const text =
        decoder.decode(chunk);

      const lines =
        text.split("\n");

      for (const line of lines) {

        if (
          !line.startsWith("data:")
        ) {
          continue;
        }

        const json =
          line.replace(
            "data:",
            ""
          ).trim();

        if (
          json === "[DONE]"
        ) {
          return;
        }

        try {

          const parsed =
            JSON.parse(json);

          const token =
            parsed?.choices?.[0]
              ?.delta?.content;

          if (
            typeof token ===
            "string"
          ) {

            fullText += token;

            yield token;
          }

        } catch (_) {}
      }
    }

    // =====================================
    // ⚠️ EMPTY SAFETY
    // =====================================

    if (!fullText.trim()) {

      yield
        "⚠️ OpenRouter returned empty response.";
    }
  }

  // =====================================
  // ✅ RETURN
  // =====================================

  return {

    stream:
      streamTokens(),

    usedModel:
      model,
  };
 
};
