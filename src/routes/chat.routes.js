import express from "express";
import multer from "multer";

import { chatController } from "../controllers/chat.controller.js";
import { chatStreamController } from "../controllers/chat.stream.controller.js";

import { ensureUser } from "../middlewares/ensureUser.js";
import { freeChatLimiter } from "../middlewares/freeChatLimiter.js";

const router = express.Router();

/**
 * =========================
 * 📁 MULTER CONFIG
 * Memory storage = best for AI image upload
 * =========================
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB
    files: 5,
  },
});

/**
 * =========================
 * NORMAL CHAT (JSON)
 * ✅ counts free chats
 * =========================
 */
router.post(
  "/chat",
  ensureUser,
  freeChatLimiter,

   upload.array("files", 5),
   
  chatController
);

/**
 * =========================
 * TEMPORARY CHAT (JSON)
 * ❌ no memory
 * ❌ no DB save
 * ❌ no free chat decrement
 * =========================
 */
router.post(
  "/chat/temp",
  ensureUser,
  (req, res, next) => {
    req.isTemporaryChat = true;
    next();
  },
  chatController
);

/**
 * =========================
 * STREAM CHAT (SSE + FILES)
 * ✅ image upload ready
 * ✅ counts free chats once
 * =========================
 */
router.post(
  "/chat/stream",
  ensureUser,
  freeChatLimiter,

  (req, res, next) => {
    upload.array("files", 5)(
      req,
      res,
      function (err) {
        if (err) {
          return res.status(400).json({
            error:
              "Upload failed. File too large or invalid.",
          });
        }

        next();
      }
    );
  },

  ...chatStreamController
);

export default router;
