// src/ai/tools/image.tool.js

import fetch from "node-fetch";

export async function generateImage(prompt) {
  try {
    const enhancedPrompt = `
Studio Ghibli style illustration, anime, soft lighting, detailed background, 
${prompt}
`;

    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${process.env.REPLICATE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version:
          "db21e45b6c5d9f5bbf4b7e0e7c0c0d9b6a8c2e9c9e6f5b7c2d6f3e2a1b0c9d8", // stable diffusion model
        input: {
          prompt: enhancedPrompt,
          width: 768,
          height: 768,
        },
      }),
    });

    const data = await response.json();

    let imageUrl = null;

    // ⏳ WAIT FOR RESULT (important)
    let status = data.status;
    let prediction = data;

    while (status !== "succeeded" && status !== "failed") {
      await new Promise((r) => setTimeout(r, 2000));

      const res = await fetch(prediction.urls.get, {
        headers: {
          Authorization: `Token ${process.env.REPLICATE_API_KEY}`,
        },
      });

      prediction = await res.json();
      status = prediction.status;
    }

    if (prediction.status === "succeeded") {
      imageUrl = prediction.output[0];
    }

    return imageUrl || "Failed to generate image";
  } catch (err) {
    console.error("❌ Image Error:", err.message);
    return "Error generating image";
  }
}