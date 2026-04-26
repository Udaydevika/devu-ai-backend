import express from "express";
import multer from "multer";
import { handleDocumentUpload } from "../controllers/documentController.js";

const router = express.Router();

const upload = multer({ dest: "uploads/" });

router.post("/document/upload", upload.single("file"), handleDocumentUpload);

export default router;