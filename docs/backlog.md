### 🔄 Delete-session clean-up (P2)
When a chat session is permanently deleted (`deleteSession` edge function), iterate over every `chat_messages.image_url` in that session and call `storage.remove()` on each corresponding object. Failure to delete must not block the DB operation; log and continue.

### 🧹 Delete-message clean-up (P3)
If/when we implement per-message deletion, include an optional `image_url` removal path. Edge function should accept the message ID, check ownership via RLS, delete Storage object if present, then hard-delete the DB row.
