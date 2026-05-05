// src/ai/tools/image.edit.tool.js

import axios from "axios";
import { generateImage } from "./image.tool.js";

/**
 * ==========================================
 * 🔥 DevU AI IMAGE EDIT TOOL (PRO PIPELINE)
 *
 * Flow:
 * 1. Analyze uploaded image (Vision AI)
 * 2. Generate improved prompt
 * 3. Regenerate new image
 * 4. Return final image URL
 *
 * Features:
 * ✅ Works like ChatGPT edit
 * ✅ Uses uploaded image context
 * ✅ Stable (fallback safe)
 * ==========================================
 */

export async function editImage(file, userPrompt = "") {
  try {
    if (!file || !file.buffer) {
      return "⚠️ No image provided.";
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY missing");
    }

    // =============================
    // STEP 1 — Convert image to base64
    // =============================
    const base64 = file.buffer.toString("base64");

    // =============================
    // STEP 2 — Vision Prompt
    // =============================
    const visionPrompt = `
You are an AI image editor.

Analyze the uploaded image and rewrite a HIGH QUALITY image generation prompt.

User request:
"${userPrompt}"

Rules:
- Keep main subject consistent
- Apply requested changes
- Improve lighting, quality, details
- Return ONLY final image prompt (no explanation)
`;

    const res = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: visionPrompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:${file.mimeType};base64,${base64}`,
                },
              },
            ],
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    const enhancedPrompt =
      res.data?.choices?.[0]?.message?.content?.trim();

    if (!enhancedPrompt) {
      return "⚠️ Failed to analyze image.";
    }

    // =============================
    // STEP 3 — Generate Edited Image
    // =============================
    const finalImage = await generateImage(enhancedPrompt);

    if (!finalImage) {
      return "⚠️ Failed to generate edited image.";
    }

    return finalImage;

  } catch (err) {
    console.error("❌ Image Edit Error:", err.message);

    return "⚠️ Image editing failed.";
  }
}