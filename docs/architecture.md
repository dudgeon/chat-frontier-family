# Chat Streaming Architecture

This project uses the OpenAI **Responses API** through a Supabase edge
function. Communication happens in two steps:

1. **Create response** – `POST /v1/responses`
2. **Stream events** – `GET /v1/responses/{id}/events`

The client sends chat messages to the edge function which creates a
response with OpenAI. The resulting `response_id` is then used to fetch
the event stream.

```text
Client ──▶ Edge Function ──▶ OpenAI /v1/responses
Client ◀─┐               └─▶ /v1/responses/{id}/events
```

Events use an envelope format:

```json
{ "type": "token" | "image" | "tool", "delta": "text", "url": "http..." }
```

Depending on row level security you must provide either a user JWT or an
anonymous key in the `Authorization` header when calling the function.
