import express from "express";

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
 * ✅ counts free chats ONCE
 * =========================
 * chatStreamController already includes multer
 */
router.post(
  "/chat/stream",
  ensureUser,
  freeChatLimiter,
  ...chatStreamController
);

export default router;
