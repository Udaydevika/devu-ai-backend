import express from "express";
import { upload } from "../middlewares/upload.middleware.js";

import { chatController } from "../controllers/chat.controller.js";
import { chatStreamController } from "../controllers/chat.stream.controller.js";

import { ensureUser } from "../middlewares/ensureUser.js";
import { freeChatLimiter } from "../middlewares/freeChatLimiter.js";

const router = express.Router();



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

   upload.array("files"),
   
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

  upload.array("files"),

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

  upload.single("file"),

  ...chatStreamController
);
export default router;
