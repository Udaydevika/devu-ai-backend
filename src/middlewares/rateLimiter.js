const users = new Map();

export function rateLimiter(req, res, next) {
  const ip = req.ip;
  const now = Date.now();

  if (!users.has(ip)) {
    users.set(ip, []);
  }

  const requests = users.get(ip).filter(t => now - t < 60000);

  if (requests.length > 30) {
    return res.status(429).json({ error: "Too many requests" });
  }

  requests.push(now);
  users.set(ip, requests);

  // 🔥 CLEAN OLD USERS (IMPORTANT)
  if (users.size > 1000) {
    users.clear();
  }

  next();
}