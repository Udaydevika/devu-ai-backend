// src/ai/utils/promptEnhancer.js

export function enhancePrompt(prompt = "") {
  const base = `
ultra detailed, cinematic lighting, 8k resolution,
sharp focus, high quality, professional composition
`.trim();

  return `${base}, ${prompt}`.trim();
}