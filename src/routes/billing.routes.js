import express from "express";

const router = express.Router();

/**
 * 🔐 VERIFY PURCHASE (SKELETON)
 */
router.post("/verify", async (req, res) => {
  const { userId, purchaseToken, productId } = req.body;

  // TODO:
  // 1. Verify with Google Play API
  // 2. Mark user as premium in DB
  // 3. Store subscription expiry

  res.json({
    success: true,
    isPremium: true,
  });
});

export default router;

if (!userId) {
  return res.status(400).json({ error: "userId required" });
}