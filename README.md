# Chat Streaming App

[View architecture diagram](docs/architecture.md)

## Quick Start

```bash
bun install
bun run dev
```

Production build:

```bash
bun run build
bun run preview
```

Deploy Supabase edge function:

```bash
supabase functions deploy chat --project-ref <project-id>
```

## Environment Variables

| Name | Purpose |
| ---- | ------- |
| `VITE_SUPABASE_URL` | Supabase project URL for the client |
| `VITE_SUPABASE_ANON_KEY` | Public anon key for browser requests |
| `OPENAI_API_KEY` | Server key for OpenAI requests |
| `ENABLE_METRICS` | When set, log latency to `edge_logs` table |
| `SUPABASE_URL` | Supabase URL for edge functions |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key for edge inserts |

## Streaming Chat Flow

1. User submits a message.
2. Browser calls the `/chat` edge function with `stream: true`.
3. Edge forwards the request to `OpenAI /chat/completions`.
4. OpenAI streams tokens back via SSE.
5. Edge relays tokens to the browser while accumulating full text.
6. After the stream finishes, the assistant text is inserted into `chat_messages`.

## Deploy

This project can be hosted on Netlify. Configure the environment variables above and run:

```bash
netlify deploy --prod
```

Supabase edge functions are deployed separately using the `supabase` CLI (see quick start above).

### Edge functions

| Endpoint | Purpose |
| -------- | ------- |
| `/functions/v1/hideSession` | Mark a chat session as hidden |
| `/functions/v1/deleteSession` | Soft delete a chat session |

Example request:

```bash
curl -X POST \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"id":"uuid"}' \
  https://<project>.supabase.co/functions/v1/hideSession
```

### GitHub Actions

Automated CI workflows handle Supabase deploys and migrations.

#### Deploy Edge Functions

- **Workflow:** `.github/workflows/deploy-functions.yml`
- **Triggers:** push to `main` under `supabase/functions/**` or manual dispatch
- **Secrets:** `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_ID`

#### Run Migrations

![Migrations](https://github.com/<you>/<repo>/actions/workflows/run-migrations.yml/badge.svg)

- **Workflow:** `.github/workflows/run-migrations.yml`
- **Triggers:** push to `main` under `supabase/migrations/**` or manual dispatch
- **Secrets:** `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_ID`

## Troubleshooting

| Issue | Resolution |
| ----- | ---------- |
| 401/404 from edge | Check `Authorization` header and function URL |
| CORS errors | Ensure `Access-Control-Allow-Origin` is `*` or your domain |
| `context_length_exceeded` | Reduce previous messages before sending |

## Roadmap

- Multimodal image packets
- Voice TTS responses
- Agentic function calls
- Replace manual image generation invocation with agentic workflow
