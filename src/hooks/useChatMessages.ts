import { useEffect, useState } from 'react';
import { Message } from '@/types/chat';
import { supabase } from '@/lib/supa';
import { dedupeById } from '@/utils/dedupeById';

export const useChatMessages = (sessionId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (!sessionId) return;
    const load = async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('id, content, is_user, created_at, image_url')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });
      if (!error && data) {
        setMessages(
          data.map((m) => ({
            id: m.id,
            content: m.content,
            isUser: m.is_user,
            timestamp: new Date(m.created_at).getTime(),
            imageUrl: m.image_url ?? undefined,
          }))
        );
      }
    };
    void load();
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    let cb: (payload: any) => void;
    const channel = supabase
      .channel(`messages_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          cb?.(payload);
        }
      )
      .subscribe();
    cb = (payload) => {
      setMessages((prev) => {
        if (payload.eventType === 'DELETE') {
          const id = payload.old.id as string;
          return prev.filter((m) => m.id !== id);
        }
        if (payload.eventType === 'INSERT') {
          if (prev.some((m) => m.id === payload.new.id)) return prev;
          const m: Message = {
            id: payload.new.id,
            content: payload.new.content,
            isUser: payload.new.is_user,
            timestamp: new Date(payload.new.created_at).getTime(),
            imageUrl: payload.new.image_url ?? undefined,
          };
          return dedupeById([...prev, m]);
        }
        if (payload.eventType === 'UPDATE') {
          const updated = payload.new;
          return prev.map((m) =>
            m.id === updated.id
              ? { ...m, content: updated.content, imageUrl: updated.image_url ?? undefined }
              : m
          );
        }
        return prev;
      });
    };
    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  return { messages, setMessages };
};

