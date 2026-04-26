import Memory from "../models/memory.model.js";

export async function buildSystemPrompt(userId) {
  const memories = await Memory.find({ userId, isDeleted: false })
    .sort({ confidence: -1 })
    .limit(20);

  if (!memories.length) return "";

  return `
Known user information:
${memories
  .map(m => `- (${m.type}) ${m.key}: ${m.value}`)
  .join("\n")}
`;
}
