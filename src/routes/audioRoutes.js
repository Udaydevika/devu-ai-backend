import express from "express";
import multer from "multer";
import { handleAudioUpload } from "../controllers/audioController.js";

const router = express.Router();

const upload = multer({ dest: "uploads/" });

router.post("/audio/upload", upload.single("audio"), handleAudioUpload);

export default router;