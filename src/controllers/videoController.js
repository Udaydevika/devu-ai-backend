import fs from "fs";
import path from "path";
import { extractFrames } from "../utils/extractframes.js";
import axios from "axios";

export const handleVideoUpload = async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No video uploaded" });
    }

    const videoPath = file.path;

    console.log("📹 Video received:", videoPath);

    // STEP 1: Extract frames
    const frames = await extractFrames(videoPath);

    console.log("🖼 Frames extracted:", frames);

    // STEP 2: Convert frames to base64
    const images = frames.map((framePath) => {
      const buffer = fs.readFileSync(framePath);
      return `data:image/png;base64,${buffer.toString("base64")}`;
    });

    // STEP 3: Send to AI model
    const aiResponse = await analyzeVideoFrames(images);

    // cleanup files
    fs.unlinkSync(videoPath);
    frames.forEach(f => fs.unlinkSync(f));

    return res.json({
      success: true,
      result: aiResponse
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Video processing failed" });
  }
};

async function analyzeVideoFrames(images) {

  const content = [
    {
      type: "text",
      text: "Explain what is happening in this video clearly."
    }
  ];

  // attach frames
  images.forEach(img => {
    content.push({
      type: "image_url",
      image_url: {
        url: img
      }
    });
  });

  const response = await axios.post(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      model: "openai/gpt-4o",
      messages: [
        {
          role: "user",
          content: content
        }
      ]
    },
    {
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      }
    }
  );

  return response.data.choices[0].message.content;
}