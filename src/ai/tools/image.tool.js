// src/ai/tools/image.tool.js

import axios from "axios";
import fs from "fs";
import path from "path";

/**
 * ==========================================
 * 🔥 DevU AI IMAGE TOOL (PRO + FALLBACK)
 *
 * Features:
 * ✅ OpenRouter (Primary - Fast)
 * ✅ HuggingFace (Fallback - Free)
 * ✅ Auto Retry
 * ✅ Always returns image (no null)
 * ✅ Local save for download
 * ==========================================
 */

const OPENROUTER_API =
  "https://openrouter.ai/api/v1/images/generations";

const HF_API =
  "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0";

// ================= HELPERS =================

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function buildStyle(prompt) {
  const lower = prompt.toLowerCase();

  if (lower.includes("ghibli") || lower.includes("anime")) {
    return "Studio Ghibli style, anime illustration, soft cinematic lighting";
  }

  if (lower.includes("logo")) {
    return "modern minimal logo, vector design";
  }

  if (lower.includes("thumbnail")) {
    return "viral youtube thumbnail, bold contrast";
  }

  if (lower.includes("poster")) {
    return "cinematic poster, dramatic lighting";
  }

  if (lower.includes("realistic")) {
    return "photorealistic ultra detailed 4k";
  }

  return "high quality digital art";
}

// ================= MAIN =================

export async function generateImage(prompt = "") {
  if (!prompt.trim()) return null;

  const style = buildStyle(prompt);
  const finalPrompt = `${style}, ${prompt}, masterpiece`;

  // ================= 1. OPENROUTER =================
  try {
    const url = await generateOpenRouter(finalPrompt);
    if (url) return url;
  } catch (e) {
    console.log("⚠️ OpenRouter failed → fallback");
  }

  // ================= 2. HUGGINGFACE =================
  try {
    const url = await generateHuggingFace(finalPrompt);
    if (url) return url;
  } catch (e) {
    console.log("⚠️ HuggingFace failed");
  }

  return "⚠️ Image generation failed. Try again.";
}

// ================= OPENROUTER =================

async function generateOpenRouter(prompt) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("Missing OpenRouter key");

  let imageUrl = null;

  for (let i = 0; i < 3; i++) {
    try {
      const res = await axios.post(
        OPENROUTER_API,
        {
          model: "openai/dall-e-3",
          prompt,
          size: "1024x1024",
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        }
      );

      imageUrl = res.data?.data?.[0]?.url;

      if (imageUrl) break;
    } catch (err) {
      console.log("Retry OpenRouter...", i);
      await sleep(1500);
    }
  }

  if (!imageUrl) return null;

  return await saveImage(imageUrl);
}

// ================= HUGGINGFACE =================

async function generateHuggingFace(prompt) {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) throw new Error("Missing HF key");

  const res = await axios.post(
    HF_API,
    { inputs: prompt },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      responseType: "arraybuffer",
    }
  );

  const dir = path.join(process.cwd(), "public", "generated");
  ensureDir(dir);

  const fileName = `hf_${Date.now()}.png`;
  const filePath = path.join(dir, fileName);

  fs.writeFileSync(filePath, res.data);

  return `${process.env.PUBLIC_URL}/generated/${fileName}`;
}

// ================= SAVE =================

async function saveImage(imageUrl) {
  const dir = path.join(process.cwd(), "public", "generated");
  ensureDir(dir);

  const fileName = `img_${Date.now()}_${Math.floor(
    Math.random() * 1000
  )}.png`;

  const filePath = path.join(dir, fileName);

  const imgRes = await axios.get(imageUrl, {
    responseType: "arraybuffer",
  });

  fs.writeFileSync(filePath, imgRes.data);

  return `${process.env.PUBLIC_URL}/generated/${fileName}`;
}

// ================= VARIATIONS =================

export async function generateVariations(prompt, count = 3) {
  const results = [];

  for (let i = 0; i < count; i++) {
    const img = await generateImage(
      `${prompt}, variation ${i + 1}`
    );

    if (img && img.startsWith("http")) {
      results.push(img);
    }
  }

  return results;
}