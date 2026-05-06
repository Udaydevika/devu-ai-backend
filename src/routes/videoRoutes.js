import express from "express";
import multer from "multer";
import { handleVideoUpload } from "../controllers/videoController.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
});

router.post(
  "/video/upload",
  upload.single("video"),
  handleVideoUpload
);

export default router;