import { invokeWithAuth } from '@/lib/invokeWithAuth';

export async function requestSessionMetadata(sessionId: string) {
  try {
    const { error } = await invokeWithAuth('generate-chat-name', {
      session_id: sessionId,
    });
    if (error) {
      console.error('requestSessionMetadata failed', error.message);
    }
  } catch (err) {
    console.error('requestSessionMetadata failed', err);
  }
}
