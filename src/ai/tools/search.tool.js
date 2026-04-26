import axios from "axios";

export async function generateImage(prompt) {
  try {
    const res = await axios.post(
      "https://openrouter.ai/api/v1/images/generations",
      {
        model: "openai/dall-e-3",
        prompt: prompt,
        size: "1024x1024",
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return res.data?.data?.[0]?.url;
  } catch (err) {
    console.error("❌ Image error:", err.message);
    return null;
  }
}