Codex Guardrails & Regression Prevention Guide

Audience: AI agents (e.g., ChatGPT Codex) and human contributors working in this repository.

Objective: Capture the regression patterns we have encountered since May 17 – 20, 2025 and institutionalize practices that stop them from recurring. Every PR must link back to this guide in its description and confirm the checklist at the bottom.

⸻

1  Why this file exists

Over the last week Codex shipped rapid-fire fixes and features, but several of them broke previously working functionality or required immediate hot-fixes. Examples include:

AreaRegressionRoot causeFix PR
Streaming chatDuplicate tokens + multiple DOM elements per chunkChatContext persisted messages during the SSE stream instead of after completion#41 Fix streaming duplication (github.com)
Runtime configEnv vars & runtime /config endpoint flipped direction three times within 24 hChanging strategy without updating all call-sites & Netlify config#87–#95 series (github.com)
Session namingAuto-generated session names stopped populatingRefactor removed the summarisation call & did not run the tests that guarded it#84, #88 (implicit) (github.com)
Child visibilityParents could not see child chat historyNew UI shipped without matching RLS policy & Supabase view#38 Add RLS policies (github.com)
UI affordancesHide / Delete buttons always visible (inconsistent with message controls)Copied pattern but omitted group-hover / mobile-tap logic#99 Implement session hide/delete (github.com)
Edge streaming APIFront-end broke after OpenAI path changeHard-coded URL segments & fragile SSE parsing#74–#83 stream patches (github.com)

These illustrate recurring failure modes:
1.Partial context: Codex often edits a single file and ignores cross-cutting contracts (env, RLS, tests).
2.Optimistic UI assumptions: Saves or renders state before the async process is finished.
3.Brittle parsing / hard-coded paths.
4.Missing automated checks: Failing (or absent) unit & E2E tests allow silent breakage.

⸻

2  Golden Rules for Codex
1.Never rename or relocate a public contract (environment variable, API route, DB table, RLS policy) without updating all call-sites and the docs.
2.Defer persistence until the full async cycle completes. For SSE/streaming, commit the final message in oncomplete, not on each data chunk.
3.Every schema change ships with: (a) a Supabase migration, (b) matching RLS, (c) updated TypeScript types, (d) tests.
4.Mirror existing UI interaction patterns. If a control uses group-hover/group-focus, copy that pattern—don’t invent a new one.
5.Write tests before you patch regressions. A failing test that reproduces the bug must accompany the fix.
6.Parse streams defensively. Treat data: lines that are empty, 
, or [DONE] specially. Use regex: /^data:\s*(.*)$/.
7.Fail fast & loudly. Throw explicit errors when a critical env var is missing instead of silently falling back.
8.Respect the project structure. Config lives in /src/lib/config.ts; edge-function files read env directly; React code never touches process.env.

⸻

3  Pre-PR Checklist (copy into your PR description)

### Codex Guardrail Checklist
- [ ] I ran `bun run test` and all suites pass.
- [ ] No env var or public API contract was renamed; if yes, I updated docs & affected code.
- [ ] For any DB change, I added a Supabase migration **and** RLS policy.
- [ ] I reproduced the original bug with a failing test and the test now passes.
- [ ] I manually tested streaming in the Netlify preview (desktop + mobile).
- [ ] I confirmed UI affordances match existing hover/tap behaviour.
- [ ] I updated `docs/codex_guardrails.md` if I introduced new patterns or learned lessons.

⸻

4  Adding new guardrails

When a new regression slips through, append a short entry to the table in §1 and, if needed, expand the Golden Rules. Keep each entry factual: what broke, why, how we fixed it.

⸻

5  About this file
•Location: docs/codex_guardrails.md (lives with other developer docs for easy linking).
•Owners: Repo maintainers & Codex itself.
•Enforcement: CI will fail if a PR’s description is missing the checklist.

Feel free to iterate—this document is meant to evolve as we learn.
