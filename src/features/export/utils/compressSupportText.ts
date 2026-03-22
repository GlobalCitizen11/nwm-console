export const compressSupportText = (text: string, maxLength = 140) => {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxLength) {
    return cleaned;
  }
  return `${cleaned.slice(0, maxLength).replace(/[ ,;:.!?-]+$/, "")}...`;
};
