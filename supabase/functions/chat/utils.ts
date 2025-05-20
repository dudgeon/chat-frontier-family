export async function accumulateAssistantText(
  stream: ReadableStream<Uint8Array>,
  onFirstChunk?: (latency: number) => void,
): Promise<string> {
  const decoder = new TextDecoder();
  const reader = stream.getReader();
  let buffer = "";
  let full = "";
  let first = true;
  const start = Date.now();
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let index;
    while ((index = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, index).trim();
      buffer = buffer.slice(index + 1);
      if (!line) continue;
      if (line.startsWith("data:")) {
        const data = line.slice(5).trim();
        if (data === "[DONE]") continue;
        try {
          const json = JSON.parse(data);
          const token = json.choices?.[0]?.delta?.content;
          if (token) {
            full += token;
            if (first) {
              first = false;
              onFirstChunk?.(Date.now() - start);
            }
          }
        } catch {
          // ignore parse errors
        }
      }
    }
  }
  if (buffer.trim().startsWith("data:")) {
    const data = buffer.trim().slice(5).trim();
    if (data !== "[DONE]") {
      try {
        const json = JSON.parse(data);
        const token = json.choices?.[0]?.delta?.content;
        if (token) {
          full += token;
          if (first) {
            first = false;
            onFirstChunk?.(Date.now() - start);
          }
        }
      } catch {
        // ignore
      }
    }
  }
  return full;
}

export function pipeAndStore(
  stream: ReadableStream<Uint8Array>,
  chatId: string,
  supabase: { from(table: string): { insert(values: Record<string, unknown>): Promise<unknown> } },
  logLatency: (latency: number) => void,
): ReadableStream<Uint8Array> {
  const [logStream, clientStream] = stream.tee();
  accumulateAssistantText(logStream, logLatency).then(async (full) => {
    await supabase
      .from('chat_messages')
      .insert({ chat_id: chatId, role: 'assistant', content: full });
  });
  return clientStream;
}
