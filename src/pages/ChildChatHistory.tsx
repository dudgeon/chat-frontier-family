import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChatDatabase } from '@/hooks/chatSessions/useChatDatabase';
import { ChatSession } from '@/types/chatContext';
import MessageList from '@/components/chat/MessageList';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const ChildChatHistory: React.FC = () => {
  const { childId } = useParams<{ childId: string }>();
  const navigate = useNavigate();
  const { fetchUserSessions } = useChatDatabase();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!childId) return;
      try {
        const data = await fetchUserSessions(childId);
        setSessions(data);
        if (data.length > 0) {
          setActiveId(data[0].id);
        }
      } catch (err) {
        console.error('Error fetching child sessions:', err);
      }
    };
    load();
  }, [childId, fetchUserSessions]);

  const activeSession = sessions.find(s => s.id === activeId);

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 w-full bg-white border-b border-gray-100 h-14 flex items-center px-4 z-10">
        <Button variant="ghost" size="icon" onClick={() => navigate('/profile')}>
          <ArrowLeft />
          <span className="sr-only">Back</span>
        </Button>
        <h1 className="flex-1 text-center font-medium">Child Chat History</h1>
      </header>
      <main className="pt-20 px-4 max-w-md mx-auto space-y-4">
        <div>
          <h2 className="font-medium mb-2">Sessions</h2>
          <ul className="space-y-2">
            {sessions.map(session => (
              <li key={session.id}>
                <button
                  className={`w-full text-left p-2 rounded border ${session.id === activeId ? 'bg-gray-100' : 'bg-white'}`}
                  onClick={() => setActiveId(session.id)}
                >
                  {session.name || 'Untitled'}
                </button>
              </li>
            ))}
          </ul>
        </div>
        {activeSession && (
          <div className="border rounded p-2">
            <h3 className="font-medium mb-2">Messages</h3>
            <MessageList messages={activeSession.messages} />
          </div>
        )}
      </main>
    </div>
  );
};

export default ChildChatHistory;
