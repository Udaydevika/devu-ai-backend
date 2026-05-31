// src/ai/tools/image.tool.js

import axios from "axios";
import fs from "fs";
import path from "path";

/**
 * ==========================================
 * 🔥 DevU AI FINAL IMAGE TOOL
 *
 * Features:
 * ✅ OpenRouter DALL·E
 * ✅ HuggingFace fallback
 * ✅ Ghibli art
 * ✅ Local image save
 * ✅ Download ready
 * ✅ Stable response format
 * ==========================================
 */

const OPENROUTER_API =
  "https://openrouter.ai/api/v1/images/generations";

const HF_API =
  "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0";

// ==========================================
// HELPERS
// ==========================================

function sleep(ms) {
  return new Promise((r) =>
    setTimeout(r, ms)
  );
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, {
      recursive: true,
    });
  }
}

function buildStyle(prompt) {
const lower =
  String(prompt || "")
    .toLowerCase()
    .trim();

  // 🎨 Ghibli / Anime
  if (
    lower.includes("ghibli") ||
    lower.includes("anime")
  ) {
    return `
Studio Ghibli style,
anime illustration,
soft cinematic lighting,
detailed fantasy background,
beautiful colors
`;
  }

  // 🧠 Logo
  if (
    lower.includes("logo")
  ) {
    return `
modern logo,
minimal branding,
vector design
`;
  }

  // 📺 Thumbnail
  if (
    lower.includes(
      "thumbnail"
    )
  ) {
    return `
viral youtube thumbnail,
bold contrast,
dramatic lighting
`;
  }

  // 🎬 Poster
  if (
    lower.includes("poster")
  ) {
    return `
cinematic movie poster,
epic composition,
dramatic lighting
`;
  }

  // 📷 Realistic
  if (
    lower.includes(
      "realistic"
    )
  ) {
    return `
photorealistic,
ultra detailed,
4k photography
`;
  }

  return `
high quality digital art,
detailed illustration
`;
}

// ==========================================
// MAIN
// ==========================================

export async function generateImage(
  prompt = ""
) {
  try {
    if (!prompt.trim()) {
      return {
        type: "text",
        text:
          "⚠️ Empty image prompt.",
      };
    }

    const style =
      buildStyle(prompt);

    const finalPrompt = `
${style}

${prompt}

masterpiece,
high quality,
4k
`.trim();

    // ======================================
    // OPENROUTER
    // ======================================

    try {
      const url =
        await generateOpenRouter(
          finalPrompt
        );

      if (url) {
        return {
          type: "image",
          url,
        };
      }

    } catch (err) {
      console.log(
        "⚠️ OpenRouter failed"
      );
    }

    // ======================================
    // HUGGINGFACE FALLBACK
    // ======================================

    try {
      const url =
        await generateHF(
          finalPrompt
        );

      if (url) {
        return {
          type: "image",
          url,
        };
      }

    } catch (err) {
      console.log(
        "⚠️ HF fallback failed"
      );
    }

    // ======================================
    // FAIL
    // ======================================

    return {
      type: "text",
      text:
        "⚠️ Image generation failed.",
    };

  } catch (err) {
    console.error(
      "❌ Image Tool:",
      err.message
    );

    return {
      type: "text",
      text:
        "⚠️ Image generation failed.",
    };
  }
}

// ==========================================
// OPENROUTER
// ==========================================

async function generateOpenRouter(
  prompt
) {
  const apiKey =
    process.env
      .OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Missing OpenRouter key"
    );
  }

  let imageUrl = null;

  // 🔁 RETRY
  for (
    let i = 0;
    i < 3;
    i++
  ) {
    try {
      const res =
        await axios.post(
          OPENROUTER_API,
          {
            model:
              "openai/dall-e-3",
            prompt,
            size: "1024x1024",
          },
          {
            headers: {
              Authorization:
                `Bearer ${apiKey}`,
              "Content-Type":
                "application/json",
            },
            timeout: 60000,
          }
        );

      imageUrl =
        res.data?.data?.[0]
          ?.url;

      if (imageUrl) {
        break;
      }

    } catch (err) {
      console.log(
        "Retry OpenRouter:",
        i + 1
      );

      await sleep(2000);
    }
  }

  if (!imageUrl) {
    return null;
  }

  return await saveImage(
    imageUrl
  );
}

// ==========================================
// HUGGINGFACE
// ==========================================
async function generateHF(
  prompt
) {

  const apiKey =
    process.env
      .HUGGINGFACE_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Missing HF key"
    );
  }

  const res =
    await axios.post(
      HF_API,
      {
        inputs: prompt,
      },
      {
        headers: {
          Authorization:
            `Bearer ${apiKey}`,
        },
        responseType:
          "arraybuffer",
        timeout: 120000,
      }
    );

  // ======================================
  // 🔥 VALIDATE IMAGE RESPONSE
  // ======================================

  const contentType =
    res.headers[
      "content-type"
    ] || "";

  if (
    !contentType.includes(
      "image"
    )
  ) {

    const txt =
      Buffer.from(
        res.data
      ).toString("utf8");

    console.error(
      "HF ERROR:",
      txt
    );

    return null;
  }

  const dir = path.join(
    process.cwd(),
    "public",
    "generated"
  );

  ensureDir(dir);

  const fileName =
    `hf_${Date.now()}.png`;

  const filePath =
    path.join(
      dir,
      fileName
    );

  fs.writeFileSync(
    filePath,
    res.data
  );

  const base =
  process.env.PUBLIC_URL ||
  "https://devu-ai.onrender.com";

return `${base}/generated/${fileName}`;
}

// ==========================================
// SAVE IMAGE
// ==========================================

async function saveImage(
  imageUrl
) {
  const dir = path.join(
    process.cwd(),
    "public",
    "generated"
  );

  ensureDir(dir);

  const fileName =
    `img_${Date.now()}_${Math.floor(
      Math.random() * 9999
    )}.png`;

  const filePath =
    path.join(
      dir,
      fileName
    );

  const imgRes =
    await axios.get(
      imageUrl,
      {
        responseType:
          "arraybuffer",
        timeout: 60000,
      }
    );

  fs.writeFileSync(
    filePath,
    imgRes.data
  );

  const base =
  process.env.PUBLIC_URL ||
  "https://devu-ai.onrender.com";

return `${base}/generated/${fileName}`;
}

// ==========================================
// VARIATIONS
// ==========================================
export async function generateVariations(
  prompt,
  count = 3
) {

  const jobs = Array.from(
    { length: count },
    (_, i) =>

      generateImage(
        `${prompt}, variation ${i + 1}`
      )
  );

  const outputs =
    await Promise.allSettled(
      jobs
    );

  return outputs

    .filter(
      (r) =>
        r.status ===
          "fulfilled" &&

        r.value?.type ===
          "image"
    )

    .map(
      (r) => r.value.url
    );
}