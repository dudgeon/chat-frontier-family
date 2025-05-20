# Chat Streaming Architecture

This project streams responses from the OpenAI **Chat Completions API** via a
Supabase edge function. The client posts chat messages and receives a Server
Sent Events stream directly from OpenAI.

```text
Client ──▶ Edge Function ──▶ OpenAI /v1/chat/completions (stream:true)
Client ◀───────────────────────────────────────────────
```

Depending on row level security you must provide either a user JWT or an
anonymous key in the `Authorization` header when calling the function.
