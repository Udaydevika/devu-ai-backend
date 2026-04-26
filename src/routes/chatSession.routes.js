import express from "express";
import {
  createChat,
  getChats,
  updateChat,
  deleteChat,
} from "../controllers/chatSession.controller.js";

import { ensureUser } from "../middlewares/ensureUser.js";

const router = express.Router();

router.post("/", ensureUser, createChat);
router.get("/", ensureUser, getChats);
router.put("/:id", ensureUser, updateChat);
router.delete("/:id", ensureUser, deleteChat);

export default router;