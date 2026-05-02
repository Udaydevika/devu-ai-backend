// src/routes/audioRoutes.js

import express from "express";
import multer from "multer";
import { handleAudioUpload } from "../controllers/audioController.js";

const router = express.Router();

const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB
    files: 1,
  },
});

router.post(
  "/audio/upload",
  upload.single("audio"),
  handleAudioUpload
);

export default router;