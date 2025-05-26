# Chat Frontier Family

Family friendly chat application with parental supervision, built with Vite, React and Supabase.

## Quick start
```bash
bun install
bun run dev
```

Run lint and tests:
```bash
bun run lint
bun run test
```

## Architecture
The app streams OpenAI responses via Supabase Edge Functions. See [architecture docs](docs/architecture.md) for diagrams and flow details.

Database policies and storage buckets are described in [docs/supabase.md](docs/supabase.md). UI conventions live in [docs/ui.md](docs/ui.md).

## Environment
Create a `.env` with your Supabase project credentials and OpenAI keys. Example variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `OPENAI_API_KEY`

More configuration help resides in [docs/openai.md](docs/openai.md).

## Further reading
- [Roadmap](docs/roadmap.md)
- [Backlog](docs/backlog.md)
- [Component Map](./COMPONENT_MAP.md)
- [Changelog](CHANGELOG.md)
