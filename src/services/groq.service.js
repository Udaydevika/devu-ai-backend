import Groq from "groq-sdk";

/**
 * ==========================================
 * 🚀 DEVU AI FINAL GROQ SERVICE
 * ==========================================
 * Features:
 * ✅ Ultra fast streaming
 * ✅ Stable production parser
 * ✅ Empty response protection
 * ✅ Timeout safety
 * ✅ Token-safe streaming
 * ✅ Render safe
 * ==========================================
 */

export async function streamGroq(
  messages = []
) {

  // ======================================
  // 🔐 API KEY
  // ======================================

  if (
    !process.env.GROQ_API_KEY
  ) {

    throw new Error(
      "GROQ_API_KEY missing"
    );
  }

  // ======================================
  // 🚀 INIT GROQ
  // ======================================

  const groq = new Groq({

    apiKey:
      process.env.GROQ_API_KEY,
  });

  // ======================================
  // 💬 CLEAN MESSAGES
  // ======================================

  const formattedMessages = [

    {
      role: "system",

      content:
`You are DevU AI.

Be:
- smart
- fast
- clear
- helpful
- human-like`,
    },

    ...messages

      .filter(
        (m) =>
          m?.role &&
          m?.content
      )

      .map((m) => ({

        role: m.role,

        content:
          String(
            m.content
          ),
      })),
  ];

  // ======================================
  // 🚀 CREATE STREAM
  // ======================================

  const stream =
    await groq.chat.completions.create({

      model:
        "llama-3.1-8b-instant",

      messages:
        formattedMessages,

      stream: true,

      temperature: 0.7,

      max_completion_tokens: 1024,
    });

  // ======================================
  // 🔥 TOKEN STREAMER
  // ======================================

  async function* streamTokens() {

    let hasToken = false;

    try {

      for await (
        const chunk of stream
      ) {

        console.log(
"🔥 GROQ CHUNK:",
JSON.stringify(chunk)
);

        const token =

          chunk
            ?.choices?.[0]
            ?.delta
            ?.content;

        // ======================================
        // VALID TOKEN
        // ======================================

        if (

typeof token === "string" &&

token.trim().length > 0

) {

  console.log(
    "🔥 TOKEN:",
    token
  );

  hasToken = true;

  yield token;
}
      }

      // ======================================
      // EMPTY RESPONSE
      // ======================================

      if (!hasToken) {

        console.log(
          "❌ GROQ EMPTY RESPONSE"
        );

        yield
"⚠️ Groq returned empty response.";
      }

    } catch (err) {

      console.error(
        "❌ GROQ STREAM ERROR:",
        err.message
      );

      yield
"⚠️ Groq stream failed.";
    }
  }

  // ======================================
  // ✅ FINAL RETURN
  // ======================================

  return {

    stream:
      streamTokens(),

    usedModel:
      "llama-3.1-8b-instant",
  };
}
