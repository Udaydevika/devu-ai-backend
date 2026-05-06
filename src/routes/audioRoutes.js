import express from "express";
import { upload } from "../middlewares/upload.js";
import { handleAudioUpload } from "../controllers/audioController.js";

const router = express.Router();

router.post("/audio/upload", upload.single("file"), handleAudioUpload);

export default router;