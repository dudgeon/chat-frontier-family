# Architecture Overview

This project uses Supabase Edge Functions to proxy requests to the OpenAI Responses API.
When a client requests streaming output, the function first creates the response via
`POST /v1/responses` and then proxies the event stream from
`GET /v1/responses/{id}/events` back to the browser. This two step flow preserves
OpenAI token streaming while allowing the transport to be extended for future
modalities like images or voice.

```
Client --(POST /functions/v1/chat?stream=true)--> Edge Function
Edge Function --(POST /v1/responses)--> OpenAI
Edge Function <--(id)---
Edge Function --(GET /v1/responses/{id}/events)--> OpenAI
Edge Function <--(SSE stream)--
Edge Function --(SSE stream)--> Client
```

For non-stream requests the function polls `GET /v1/responses/{id}` until the
status becomes `completed` and then returns the JSON payload.

Future extensions will envelope each SSE packet as JSON allowing additional types
(`"image"`, `"tool"`, etc.) without changing the underlying streaming transport.
