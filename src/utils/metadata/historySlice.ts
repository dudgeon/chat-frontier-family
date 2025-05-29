export function historySlice<T>(messages: T[], limit = 40): T[] {
  return messages.slice(-limit);
}
