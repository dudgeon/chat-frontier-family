import React, { useEffect, useState } from 'react';
import { ChatSession } from '@/types/chatContext';
import { useChatDatabase } from '@/hooks/chatSessions/useChatDatabase';
import MessageList from '@/components/chat/MessageList';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent
} from '@/components/ui/accordion';

interface ChildChatHistoryProps {
  childId: string;
}

const ChildChatHistory: React.FC<ChildChatHistoryProps> = ({ childId }) => {
  const { fetchUserSessions } = useChatDatabase();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchUserSessions(childId);
        setSessions(data);
      } catch (err) {
        console.error('Failed to load child sessions', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [childId, fetchUserSessions]);

  if (loading) {
    return <p className="p-4">Loading...</p>;
  }

  if (sessions.length === 0) {
    return <p className="p-4">No chat history.</p>;
  }

  return (
    <Accordion type="single" collapsible className="w-full">
      {sessions.map((session) => (
        <AccordionItem key={session.id} value={session.id}>
          <AccordionTrigger>
            <div className="flex flex-col text-left">
              <span>{session.name || 'Unnamed chat'}</span>
              {session.sessionSummary && (
                <span className="text-xs text-muted-foreground truncate">
                  {session.sessionSummary}
                </span>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <MessageList messages={session.messages} />
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};

export default ChildChatHistory;
