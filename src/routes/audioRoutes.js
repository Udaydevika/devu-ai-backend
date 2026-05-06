import express from "express";
import { upload } from "../middlewares/upload.js";
import multer from "multer";
import { handleAudioUpload } from "../controllers/audioController.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024,
  },
});

router.post(
  "/audio/upload",
  upload.single("audio"),
  handleAudioUpload
);

export default router;