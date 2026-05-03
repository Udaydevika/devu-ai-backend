// src/ai/tools/image.tool.js

import fetch from "node-fetch";

/**
 * ==========================================
 * 🔥 DevU AI FULL FREE IMAGE TOOL
 * Powered by Hugging Face
 *
 * Supports:
 * ✅ Ghibli art
 * ✅ Anime style
 * ✅ Logo
 * ✅ Thumbnail
 * ✅ Poster
 * ✅ Realistic image
 * ✅ Free alternative to Replicate
 * ==========================================
 */

export async function generateImage(
  prompt = ""
) {
  try {
    if (!prompt.trim()) {
      return null;
    }

    const apiKey =
      process.env
        .HUGGINGFACE_API_KEY;

    if (!apiKey) {
      throw new Error(
        "HUGGINGFACE_API_KEY missing"
      );
    }

    const lower =
      prompt.toLowerCase();

    // ======================================
    // SMART STYLE DETECTION
    // ======================================
    let style =
      "high quality detailed digital art";

    if (
      lower.includes(
        "ghibli"
      ) ||
      lower.includes(
        "anime"
      )
    ) {
      style =
        "Studio Ghibli style anime illustration, soft cinematic lighting, whimsical background";
    } else if (
      lower.includes(
        "logo"
      )
    ) {
      style =
        "clean modern logo design, vector style";
    } else if (
      lower.includes(
        "thumbnail"
      ) ||
      lower.includes(
        "youtube"
      )
    ) {
      style =
        "viral youtube thumbnail, dramatic composition, eye catching";
    } else if (
      lower.includes(
        "poster"
      )
    ) {
      style =
        "cinematic poster art, dramatic lighting";
    } else if (
      lower.includes(
        "realistic"
      )
    ) {
      style =
        "photorealistic ultra detailed professional photography";
    }

    const finalPrompt = `
${style},
${prompt},
high resolution, masterpiece
`.trim();

    // ======================================
    // HF MODEL
    // ======================================
    const res =
      await fetch(
        "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
        {
          method: "POST",
          headers: {
            Authorization:
              `Bearer ${apiKey}`,
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(
            {
              inputs:
                finalPrompt,
            }
          ),
        }
      );

    if (!res.ok) {
      throw new Error(
        await res.text()
      );
    }

    const arrayBuffer =
      await res.arrayBuffer();

    const base64 =
      Buffer.from(
        arrayBuffer
      ).toString(
        "base64"
      );

    // return image as data URL
    return `data:image/png;base64,${base64}`;
  } catch (err) {
    console.error(
      "❌ HF Image Error:",
      err.message
    );

    return null;
  }
}