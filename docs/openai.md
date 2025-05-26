# OpenAI Integration

The application calls the **Chat Completions** API with `stream: true` to forward tokens to the browser in real time. After streaming completes, the full assistant message is stored in the `chat_messages` table.

Image generation uses the `images/generations` endpoint with the model specified by `OPENAI_IMAGE_MODEL` (default `dall-e-3`). All secret keys remain server-side.

For implementation details, see the Supabase edge functions in [`supabase/functions`](../supabase/functions).
