# Preferred OpenAI API Usage

This project interacts with OpenAI exclusively through the **Responses API**. The earlier *Completions API* is considered legacy for this application and should not be used.

Key points:

- All requests are made to `https://api.openai.com/v1/responses`.
- Edge functions automatically add the header `OpenAI-Beta: responses=auto` so requests are routed correctly.
- Chat messages are sent as `input` arrays of messages rather than a single `prompt` string.
- Responses may be streamed from `GET /v1/responses/{id}/events` for realtime updates.

For implementation examples, see the Supabase Edge Functions in [`supabase/functions`](../supabase/functions).

Official documentation: [OpenAI Responses API](https://platform.openai.com/docs/api-reference/responses).
