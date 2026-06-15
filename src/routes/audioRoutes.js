import multer from "multer";

import {
  transcribeAudioController,
} from "../controllers/audioController.js";

const router = express.Router();

// ✅ SINGLE upload declaration ONLY
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024,
  },
});

// ✅ AUDIO ROUTE
router.post(
  "/transcribe",
  upload.single("audio"),
  transcribeAudioController
);

export default router;