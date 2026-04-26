export function enhanceTextForSpeech(text, emotion) {
  let enhanced = text;

  // 🫁 breathing pauses
  enhanced = enhanced.replace(/,/g, ", ...");
  enhanced = enhanced.replace(/\./g, "...");

  // 🤫 whisper mode
  if (emotion === "sad") {
    enhanced = enhanced.toLowerCase();
  }

  // 😊 expressive tone
  if (emotion === "happy") {
    enhanced = enhanced + " 😊";
  }

  return enhanced;
}