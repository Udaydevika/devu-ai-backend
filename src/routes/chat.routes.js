import express from "express";
import { upload } from "../middlewares/upload.middleware.js";

import { chatController } from "../controllers/chat.controller.js";
import { chatStreamController } from "../controllers/chat.stream.controller.js";

import { ensureUser } from "../middlewares/ensureUser.js";
import { freeChatLimiter } from "../middlewares/freeChatLimiter.js";

const router = express.Router();

// ==========================================
// 🔥 MULTI MEDIA UPLOAD
// ==========================================

const multiUpload = upload.fields([
{ name: "files", maxCount: 10 },
{ name: "image", maxCount: 10 },
{ name: "audio", maxCount: 10 },
{ name: "video", maxCount: 10 },
]);

/**

* =========================
* NORMAL CHAT
* =========================
  */
  router.post(
  "/chat",
  ensureUser,
  freeChatLimiter,

multiUpload,

chatController
);

/**

* =========================
* TEMP CHAT
* =========================
  */
  router.post(
  "/chat/temp",
  ensureUser,

(req, res, next) => {
req.isTemporaryChat = true;
next();
},

multiUpload,

chatController
);

/**

* =========================
* STREAM CHAT
* =========================
  */
  router.post(
  "/chat/stream",
  ensureUser,
  freeChatLimiter,

multiUpload,

chatStreamController
);

export default router;
