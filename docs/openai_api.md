# Preferred OpenAI API Usage

This project now uses the **Chat Completions API** with streaming enabled.

Key points:

- Requests are sent to `https://api.openai.com/v1/chat/completions` with `stream: true`.
- Chat messages are provided as the `messages` array.
- After the stream finishes the full assistant text is stored in the `chat_messages` table.

For implementation examples, see the Supabase Edge Functions in [`supabase/functions`](../supabase/functions).

Official documentation: [OpenAI Chat Completions](https://platform.openai.com/docs/api-reference/chat/create).
