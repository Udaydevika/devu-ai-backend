export const MODEL_FALLBACK = {
  gpt4o: ["gpt4o", "gemini", "groq", "huggingface"],
  "gpt-4o-mini": ["gpt-4o-mini", "gpt4o", "gemini", "groq"],

  gemini: ["gemini", "gpt4o", "groq", "huggingface"],

  groq: ["groq", "gpt4o", "gemini", "huggingface"],

  huggingface: ["huggingface", "gpt4o", "gemini"],
};