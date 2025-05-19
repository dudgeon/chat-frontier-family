export interface SSEPacket { type: string; delta?: string; [key: string]: unknown }

export function parseSSELine(line: string): SSEPacket | null {
  if (!line.startsWith('data:')) return null;
  const dataStr = line.replace(/^data:\s*/, '');
  if (dataStr === '[DONE]') return null;
  try {
    return JSON.parse(dataStr);
  } catch {
    return null;
  }
}
