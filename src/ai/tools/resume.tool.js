// src/ai/tools/resume.tool.js

import { createPDF } from "./pdf.tool.js";

export async function generateResume(prompt = "") {
  const content = `
Professional Resume

${prompt}

Skills:
Communication
Problem Solving
Leadership
`;

  return await createPDF(
    "Professional Resume",
    content
  );
}