import { accumulateAssistantText } from "./utils/accumulate.ts";

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
