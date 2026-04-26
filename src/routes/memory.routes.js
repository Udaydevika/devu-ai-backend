import express from "express";
import { ensureUser } from "../middlewares/ensureUser.js";
import {
  saveMemory,
  getMemories,
  updateMemory,
  deleteMemory,
} from "../controllers/memory.controller.js";

const router = express.Router();

/**
 * ✅ CREATE / UPSERT MEMORY
 * POST /memory/save
 */
router.post("/save", saveMemory);

/**
 * ✅ GET ALL MEMORIES FOR USER
 * GET /memory/:userId
 */
router.get("/", ensureUser, (req, res) => {
  req.params.userId = req.userId;
  return getMemories(req, res);
});

/**
 * ✅ UPDATE MEMORY (EDIT)
 * PUT /memory/:id
 */
router.put("/:id", updateMemory);

/**
 * ✅ DELETE MEMORY
 * DELETE /memory/:id
 */
router.delete("/:id", deleteMemory);

export default router;
