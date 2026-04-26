export function explainMemory(memory) {
  if (memory.pinned) {
    return "You pinned this memory so it is always remembered.";
  }

  if (memory.confidence > 0.8) {
    return "You mentioned this repeatedly, so it was reinforced.";
  }

  if (memory.confidence > 0.4) {
    return "This was remembered from recent conversations.";
  }

  return "This memory is fading and may be forgotten soon.";
}
