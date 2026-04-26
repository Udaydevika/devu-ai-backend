
/**
 * 🚫 Free chat limiter disabled
 * Allows unlimited chats for all users
 */

export async function freeChatLimiter(req, res, next) {
  next();
}
