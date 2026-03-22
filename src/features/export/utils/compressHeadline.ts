const LEAD_IN_PATTERNS = [
  /^(this|the)\s+(world|scenario|environment|system)\s+/i,
  /^(there is|there are)\s+/i,
  /^(signals?|evidence|pressure|attention)\s+(indicate|shows?|suggests?)\s+/i,
  /^(the current state|current state|latest shift|dominant path|alternate path)\s+(is|shows?)\s+/i,
];

const STOP_WORDS = new Set(["a", "an", "the", "and", "or", "of", "to", "for", "in", "on"]);

const cleanText = (text: string) => text.replace(/\s+/g, " ").replace(/[;:]+/g, ",").trim();

const firstClause = (text: string) => cleanText(text).split(/[.!?]/)[0]?.split(/,\s+(?=[A-Z])/)[0]?.trim() ?? "";

const trimLeadIn = (text: string) =>
  LEAD_IN_PATTERNS.reduce((current, pattern) => current.replace(pattern, ""), text).replace(/^\W+/, "").trim();

const toHeadlineCase = (words: string[]) =>
  words
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (index !== 0 && STOP_WORDS.has(lower)) {
        return lower;
      }
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");

export const compressHeadline = (text: string, maxWords = 9) => {
  const cleaned = trimLeadIn(firstClause(text));
  const words = cleaned.split(/\s+/).filter(Boolean);
  const selected = words.slice(0, Math.max(6, maxWords));
  return toHeadlineCase(selected.length ? selected : cleanText(text).split(/\s+/).slice(0, Math.max(6, maxWords)));
};
