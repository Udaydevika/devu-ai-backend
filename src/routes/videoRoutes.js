import express from "express";
import multer from "multer";
import { handleVideoUpload } from "../controllers/videoController.js";

const router = express.Router();

const upload = multer({ dest: "uploads/" });

router.post("/video/upload", upload.single("video"), handleVideoUpload);

export default router;