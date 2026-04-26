import dotenv from 'dotenv';
dotenv.config();

export const env = {
  port: process.env.PORT || 3000,
  openaiKey: process.env.OPENAI_API_KEY,
  geminiKey: process.env.GEMINI_API_KEY,
  groqKey: process.env.GROQ_API_KEY,
  hfKey: process.env.HUGGINGFACE_API_KEY,
};
