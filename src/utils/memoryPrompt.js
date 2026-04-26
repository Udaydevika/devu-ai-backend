/**
 * 🧠 Build Smart Memory System Prompt (PRO VERSION)
 * ✔ Priority-aware (importance + usage + recency)
 * ✔ Deduplicates memory
 * ✔ Token-safe limiting
 * ✔ Strong personalization instructions
 */
export function buildMemorySystemPrompt(memories = []) {
  if (!Array.isArray(memories) || memories.length === 0) return null;

  // ===============================
  // 🎯 NORMALIZE IMPORTANCE
  // ===============================
  const normalizeImportance = (imp) => {
    if (imp === "high") return 3;
    if (imp === "medium") return 2;
    if (imp === "low") return 1;
    if (typeof imp === "number") return imp;
    return 0;
  };

  // ===============================
  // 🎯 SORT (importance + usage + confidence + recency)
  // ===============================
  const sorted = [...memories].sort((a, b) => {
    return (
      normalizeImportance(b.importance) -
        normalizeImportance(a.importance) ||
      (b.usageCount || 0) - (a.usageCount || 0) ||
      (b.confidence || 0) - (a.confidence || 0) ||
      new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
    );
  });

  // ===============================
  // 🔁 REMOVE DUPLICATES (by key)
  // ===============================
  const seen = new Set();
  const unique = [];

  for (const m of sorted) {
    const id = `${m.type}:${m.key}`;
    if (!seen.has(id)) {
      seen.add(id);
      unique.push(m);
    }
  }

  // ===============================
  // ✂️ LIMIT MEMORY (TOKEN SAFE)
  // ===============================
  const limited = unique.slice(0, 10); // tighter than before

  // ===============================
  // 📦 GROUP BY TYPE
  // ===============================
  const grouped = {
    profile: [],
    preference: [],
    habit: [],
    context: [],
  };

  for (const m of limited) {
    if (!grouped[m.type]) continue;

    const value =
      m.key && m.value
        ? `${m.key}: ${m.value}`
        : m.value || m.content;

    if (value) {
      grouped[m.type].push(value);
    }
  }

  // ===============================
  // 🧠 BUILD MEMORY TEXT
  // ===============================
  const sections = [];

  if (grouped.profile.length) {
    sections.push(`User profile:\n- ${grouped.profile.join("\n- ")}`);
  }

  if (grouped.preference.length) {
    sections.push(`User preferences:\n- ${grouped.preference.join("\n- ")}`);
  }

  if (grouped.habit.length) {
    sections.push(`User habits:\n- ${grouped.habit.join("\n- ")}`);
  }

  if (grouped.context.length) {
    sections.push(`Recent context:\n- ${grouped.context.join("\n- ")}`);
  }

  if (sections.length === 0) return null;

  // ===============================
  // 🧠 FINAL PROMPT
  // ===============================
  return {
    role: "system",
    content: `
You are DevU AI, a highly intelligent personal assistant.

You remember important details about the user.

${sections.join("\n\n")}

Instructions:
- Use memory only when relevant
- Personalize naturally (like a human would)
- Do NOT mention memory explicitly
- Do NOT force personalization
- Prefer helpfulness over mentioning user data
- Avoid repeating the same memory again and again
`.trim(),
  };
}