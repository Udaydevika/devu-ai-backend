import User from "../models/user.model.js";

export async function ensureUser(req, res, next) {
  try {
    let userId =
      req.headers["x-user-id"] ||
      req.body?.userId ||
      req.query?.userId;

    // 🛡️ FIX: AUTO GENERATE USER (VERY IMPORTANT)
    if (!userId || typeof userId !== "string") {
      userId = "guest_" + Date.now();
    }

    if (Array.isArray(userId)) {
      userId = userId[0];
    }

    userId = userId.trim();

    let user = await User.findOne({ uid: userId });

    if (!user) {
      user = await User.create({ uid: userId });
    }

    req.user = user;
    req.userId = user.uid;

    next();
  } catch (err) {
    console.error("❌ ensureUser error:", err);

    next(err); // 🔥 IMPORTANT (don't break stream)
  }
}