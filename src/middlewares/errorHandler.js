export const errorHandler = (err, req, res, next) => {
  console.error("🔥 ERROR:", err);

  // 🔥 IF STREAMING → SEND SSE FORMAT
  if (res.headersSent) {
    try {
      res.write(
        `data: ${JSON.stringify({
          choices: [
            {
              delta: { content: "⚠️ Server error" },
            },
          ],
        })}\n\n`
      );

      res.write("data: [DONE]\n\n");
      return res.end();
    } catch {}
    return;
  }

  const status = err.status || 500;

  res.status(status).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
};