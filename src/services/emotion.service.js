export async function detectEmotion(message) {
  if (!message) return "neutral";

  const text = message.toLowerCase();

  if (text.includes("sad") || text.includes("depressed")) return "sad";
  if (text.includes("angry") || text.includes("mad")) return "angry";
  if (text.includes("love")) return "love";
  if (text.includes("excited")) return "excited";
  if (text.includes("confused")) return "confused";

  return "neutral";
}