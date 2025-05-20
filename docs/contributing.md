# Contributing

## Prerequisites

- Node.js or Bun
- Supabase CLI installed and logged in

## Development

```bash
bun install
bun run dev
```

Run lint and tests before pushing:

```bash
npm run lint
npm test
```

## Creating a Pull Request

1. Create a feature branch: `git checkout -b my-feature`
2. Commit your changes with a clear message.
3. Push the branch and open a PR targeting `main`.
4. Ensure the checklist passes:
   - [ ] `npm run lint`
   - [ ] `npm test`
   - [ ] Updated docs

### Deploying Edge Functions

Use the Supabase CLI:

```bash
supabase functions deploy chat --project-ref <project-id>
```
