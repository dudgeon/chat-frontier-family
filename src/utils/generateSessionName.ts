export const generateSessionName = (prompt: string): string => {
  const trimmed = prompt.trim();
  if (trimmed.length <= 40) {
    return trimmed;
  }
  return trimmed.slice(0, 40).replace(/\s+$/, '') + '…';
};
