import axios from "axios";
import fs from "fs";
import path from "path";

export async function imageToVideo(imageUrl) {
  try {
    // 🔥 Use free Replicate / Pika style model
    const res = await axios.post(
      "https://api.replicate.com/v1/predictions",
      {
        version: "783d3e...video-model",
        input: {
          image: imageUrl,
          motion: "slow zoom",
        },
      },
      {
        headers: {
          Authorization: `Token ${process.env.REPLICATE_API_KEY}`,
        },
      }
    );

    const videoUrl = res.data?.urls?.get;

    return videoUrl;
  } catch (err) {
    console.error("Video error:", err.message);
    return null;
  }
}