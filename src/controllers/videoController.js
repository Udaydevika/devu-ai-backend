import fs from "fs";
import path from "path";

/**
 * ==========================================
 * 🔥 DevU AI VIDEO CONTROLLER
 * ==========================================
 */

export const handleVideoUpload = async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: "No video uploaded",
      });
    }

    const ext =
      path.extname(file.originalname) || ".mp4";

    const fileName = `video_${Date.now()}${ext}`;

    const dir = path.join(
      process.cwd(),
      "public",
      "generated"
    );

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const filePath = path.join(dir, fileName);

    // ✅ SAVE VIDEO
    fs.writeFileSync(filePath, file.buffer);

    return res.json({
      success: true,
      type: "video",
      url: `${process.env.PUBLIC_URL}/generated/${fileName}`,
    });

  } catch (err) {
    console.error("❌ Video Controller:", err.message);

    return res.status(500).json({
      success: false,
      error: "Video processing failed",
    });
  }
};