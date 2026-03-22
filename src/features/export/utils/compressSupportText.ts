const cleanText = (text: string) => text.replace(/\s+/g, " ").trim();

const splitSentences = (text: string) =>
  cleanText(text)
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

export const compressSupportText = (text: string, maxLength = 170, maxSentences = 2) => {
  const sentences = splitSentences(text);
  if (sentences.length === 0) {
    return "";
  }

  const firstTwo = sentences.slice(0, maxSentences);
  let combined = firstTwo.join(" ");
  if (combined.length <= maxLength) {
    return combined;
  }

  const clauses = cleanText(text)
    .split(/[;:](?!\/\/)|,\s+(?=[A-Z])/)
    .map((clause) => clause.trim())
    .filter(Boolean);

  combined = clauses.slice(0, 2).join(". ");
  if (combined && !/[.!?]$/.test(combined)) {
    combined += ".";
  }

  if (combined.length <= maxLength) {
    return combined;
  }

  const words = cleanText(combined).split(/\s+/);
  let result = "";
  for (const word of words) {
    const candidate = result ? `${result} ${word}` : word;
    if (candidate.length > maxLength) {
      break;
    }
    result = candidate;
  }
  result = result.replace(/[ ,;:]+$/, "");
  if (!/[.!?]$/.test(result)) {
    const trimmedWords = result.split(/\s+/);
    if (trimmedWords.length > 4) {
      trimmedWords.pop();
      result = trimmedWords.join(" ");
    }
  }
  return result.replace(/[ ,;:]+$/, "").replace(/([A-Za-z0-9])$/, "$1.");
};
