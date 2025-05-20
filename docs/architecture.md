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

## Message Moderation

Adult users can hide or permanently delete individual messages. Hiding a message
is a purely client‑side action implemented in `MessageList.tsx`. The component
maintains a list of hidden message IDs and filters them from the display:

```tsx
const [hiddenMessageIds, setHiddenMessageIds] = useState<string[]>([]);

const handleHideMessage = (messageId?: string) => {
  if (!messageId) return;
  setHiddenMessageIds((prev) => [...prev, messageId]);
};
```

Deleting a message requires an adult account. `ChatContext` verifies the user's
role before removing the record from Supabase and the local state:

```tsx
const { data: profileData } = await supabase
  .from("profiles")
  .select("user_role, system_message")
  .eq("id", user.id)
  .single();

if (profileData.user_role !== "adult") {
  toast({ title: "Permission denied" });
  return;
}

await supabase.from("chat_messages").delete().eq("id", messageId);
```

### Session Management

The same pattern is used for entire chat sessions. Users can hide a session on
the client, and adults may delete a session from the database. `useChatSessions`
exposes `hideSession` and `deleteChat`. `ChatHistory` shows buttons that call
these helpers when the current user has the corresponding permission.
