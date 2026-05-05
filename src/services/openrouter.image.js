// src/services/openrouter.image.js

import axios from "axios";

const IMAGE_URL =
  "https://openrouter.ai/api/v1/images/generations";

export async function generateImageOpenRouter(prompt = "") {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY missing");
    }

    const res = await axios.post(
      IMAGE_URL,
      {
        model: "openai/dall-e-3",
        prompt: prompt,
        size: "1024x1024",
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    return res.data?.data?.[0]?.url || null;
  } catch (err) {
    console.error("Image API error:", err.message);
    return null;
  }
}