AGENTS.md – Chat Frontier Family

Scope All folders in this repository unless a more-deeply-nested AGENTS.md overrides.

Last Reviewed: 26 May 2025

⸻

📦 Project Mission & Stack

Family-friendly chat platform that lets parents supervise children’s AI interactions.
Tech-stack: Vite + React + TypeScript, Tailwind CSS, shadcn-ui, Supabase (Postgres + RLS + Edge Functions + Storage), OpenAI (chat Responses & DALL·E image gen), Vitest, ESLint (flat config), Bun / Node.

⸻

🗺️ Directory Map

Path	Purpose
src/	React front-end (all TSX). @/ alias resolves here.
supabase/migrations/	Idempotent SQL migrations. Do not write CREATE POLICY … IF NOT EXISTS (< PG16). Wrap column adds in IF NOT EXISTS checks.
scripts/	One-off utilities (e.g. create_image_bucket.ts).
.github/workflows/	CI, deployment of edge functions & migrations.
tests/	Unit tests (Vitest).
public/	Static assets.
docs/	Markdown docs & architecture diagram.

Add sub-AGENTS.md if you need rules that apply only to a subtree.

⸻

🔧 Setup & Common Commands

bun install           # or npm i
bun run dev           # local dev server (Vite)
bun run lint          # ESLint flat config
bun run test          # Vitest (node env)
bun run build         # production build
supabase functions deploy <fn> --project-ref <id>  # deploy edge fn

Programmatic Check

All changes must pass:

bun run lint && bun run test

CI will enforce; run locally before committing.
Feature Logging
For every PR tagged `feat:` you must add an entry to CHANGELOG.md under `Unreleased`.


⸻

🖋️ Coding Conventions
	•	TypeScript strict (noImplicitAny, etc.) – fix red squiggles before commit.
	•	ESLint + Prettier (via Tailwind plugin) handle style; run bun run lint --fix for auto-fix.
	•	File naming
	•	Component = PascalCase.tsx in a folder with same name + index.ts barrel.
	•	Hooks = useSomething.ts.
	•	Prefer functional components & hooks; no class comps.
	•	Re-export UI primitives from @/components/ui – keeps imports short.
	•	No default exports except page‐level routes.
	•	Keep React state local; use useContext only for cross-page state (AuthContext, ChatContext).
	•	Tests live beside code as *.test.ts or under tests/ mirroring path.

⸻

🗄️ Supabase Guard-Rails
	1.	RLS Policies
	•	Maintain adult-child separation: adults can read their kids; children only themselves.
	•	Enable RLS with ALTER TABLE … ENABLE ROW LEVEL SECURITY;.
	•	Use DROP POLICY IF EXISTS → CREATE POLICY pattern.
	2.	Columns – wrap ALTER TABLE in existence check (information_schema.columns).
	3.	Storage – Bucket chat-images stores generated images.
	•	Bucket creation is idempotent via scripts/create_image_bucket.ts. Add a call to this script in the supabase DB migrations workflow when new buckets are added.
	4.	Edge Functions
	•	chat (OpenAI streaming) & generate-image live in functions/ (deploy via GH Action or CLI).
	•	Use text/event-stream responses for streaming; remember return new Response(stream, { headers }).

⸻

🤖 OpenAI Integration Tips
	•	Responses API – Use for chat; supports SSE streaming.
	•	Model selection – Default via VITE_OPENAI_MODEL (browser) or env in edge fn.
	•	Put secrets only in server code / Supabase env vars, never shipped to browser.

⸻

⬆️ UI behaviours & Recent Bug Lessons
	•	After Hide or Delete chat session, immediately optimistically remove row in UI. Verify the Supabase mutation succeeded; on error, rollback.
	•	Ensure React Query cache invalidation (queryClient.invalidateQueries(['sessions'])) so other tabs update.
	•	Image generation now persists: after edge fn returns URL, insert message & image metadata in same DB transaction.

⸻

📝 Commit & PR Guidelines

Commit messages (Conventional)

feat(chat): enable SSE streaming for Responses API
fix(ui): hide session now removes row without refresh

PR Template

### What & Why
- _Short bullet explanation of change._

### How Tested
```bash
bun run lint && bun run test
supabase functions serve  # verified stream locally

Checklist
	•	Tests pass & lint clean
	•	RLS policies respected
	•	Edge function deployed (if applicable)
	•	Documentation updated (README / docs/)

---

## 🚦 Failing Fast
* Treat red CI as **signal** – fix then push.
* Append recurring learnings here so Codex doesn’t repeat mistakes.

---

## 🛑 When in Doubt
Ask the human in the PR or in the prompt: **“Here’s my understanding – am I missing anything?”**
