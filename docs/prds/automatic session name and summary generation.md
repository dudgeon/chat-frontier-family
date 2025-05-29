# PRD: Automatic Session Naming & Summaries

**Product:** Chat Frontier Family (web & mobile)

---

## 1. Problem / Opportunity
Listing sessions by the literal first user prompt clutters the UI and can reveal sensitive text.  
A concise **title** and one-sentence **summary** make it easy for parents and kids to locate conversations.

## 2. Goals
* Generate a title (≤ 12 words) that refreshes as the chat evolves.  
* Generate a single-sentence summary (≤ 140 characters, truncate at 200 stored).  
* Store both in `chat_sessions` and show them live in the UI.  
* Keep costs low by using `gpt-4.1-nano` at most once every 3 assistant replies.

## 3. Success Metrics
| KPI                                   | Target |
|---------------------------------------|--------|
| Clicks to reopen desired session      | ↓ 25 % |
| Parent rating of list clarity (5-pt)  | ≥ 4.0 |
| OpenAI cost per 100 chats             | ≤ $0.02 |
| Edge-function failure rate            | < 0.5 % |

## 4. User Stories
1. **Parent:** I see “Planning Spring Break Trip” instead of a raw prompt.  
2. **Child:** My chats auto-rename when topics change, without manual effort.  
3. **Developer:** I can scan Supabase and know what a chat is about from the summary column.

## 5. Functional Requirements

### 5.1 Generation Logic
| Field     | Title                | Summary                  |
|-----------|----------------------|--------------------------|
| Model     | `gpt-4.1-nano`       | `gpt-4.1-nano`           |
| Trigger   | Every 3 assistant replies | Same call              |
| Prompt (sys)  | Naming assistant     | Summarizer             |
| Prompt (user) | “Generate a chat session name (≤ 12 words)…“ | “Summarize the conversation in ≤ 140 chars…“ |
| Truncate  | —                    | UTF-8 safe to 200 chars  |

### 5.2 Edge Function (`generate-chat-name`)
1. Fetch message history for `session_id`.  
2. Call OpenAI twice (title & summary) or sequentially.  
3. `UPDATE chat_sessions SET name=?, session_summary=?, updated_at=now()` using service-role.  
4. Return `{ title, session_summary }` for debug.  
5. Retry twice on 429/5xx.

### 5.3 Front-end Hook
* Watches assistant message count; on modulo 3, calls the edge function.  
* Optimistically updates local state; realtime merges server truth.

### 5.4 Session Creation
* Insert row with `name = NULL`, `session_summary = NULL`.  
* UI placeholder shows “New Chat”.

### 5.5 Permissions (RLS)

    create policy "user_can_update_metadata" on chat_sessions
      for update using (user_id = auth.uid());

### 5.6 UI Rules
* **Parent dashboard:** title + faint summary.  
* **Child view:** title only.

## 6. Non-Functional Requirements
* Latency ≤ 2 s from trigger to visible update.  
* Edge function cold-start < 400 ms, memory ≤ 128 MB.  
* Cost cap: 4 invocations per session.  
* Log all errors to Logflare tagged with `session_id`.

## 7. Risks & Mitigations
| Risk                     | Mitigation                                |
|--------------------------|-------------------------------------------|
| Model retires            | Use env-var fallback (`gpt-3.5-turbo`).   |
| Long chats blow tokens   | Trim history to last 40 messages.         |
| RLS blocks updates       | CI test validates service-role write succeeds. |

## 8. Release Plan
1. Develop behind feature flag `metadata_v2`.
2. QA with synthetic 50-message chat.
3. Gradual rollout 10 % → 100 %.
4. Monitor cost and error logs for 7 days.

## 9. Implementation Notes & Guardrails
* **Default model:** `gpt-4.1-nano`; upgrades toggled via `featureFlags.metadataModel`.
* **Guard clause:** `if (!chatName || !chatSummary)` prevents duplicate generator calls.
* **Integration test:** verify the name/summary generator executes once per session with coverage.
* **Model change gate:** document cost & latency benchmarks and secure @dudgeon approval before merging.
* **RLS online migration:** add new policy, back-fill rows, drop old policy in a later release.
* **Edge-function CI:** path filter so edge-function tests run only on `supabase/functions/**` changes.
* **Acceptance:** zero user-visible downtime and no duplicate DB writes.

---

*End of document*
