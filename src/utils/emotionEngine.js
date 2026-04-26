export function detectEmotion(text = "") {
  const t = text.toLowerCase();

  if (t.includes("sad") || t.includes("tired")) return "sad";
  if (t.includes("love") || t.includes("happy")) return "happy";
  if (t.includes("angry") || t.includes("hate")) return "angry";
  if (t.includes("help") || t.includes("please")) return "caring";

  return "neutral";
}