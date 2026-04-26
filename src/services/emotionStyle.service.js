/**
 * 🎭 Convert emotion → AI personality style
 */
export function getEmotionStyle(emotion) {
  switch (emotion) {
    case "happy":
      return "Be cheerful, positive, and slightly energetic.";

    case "sad":
      return "Be empathetic, calm, and comforting.";

    case "angry":
      return "Be calm, respectful, and de-escalate the situation.";

    case "excited":
      return "Be energetic, enthusiastic, and engaging.";

    case "confused":
      return "Be clear, simple, and guiding.";

    case "love":
      return "Be warm, caring, and friendly.";

    default:
      return "Be natural, helpful, and human-like.";
  }
}