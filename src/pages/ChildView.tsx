import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import EditableField from '@/components/profile/EditableField';
import SessionListItem from '@/components/SessionListItem';
import { useChildView } from '@/hooks/useChildView';

const ChildView: React.FC = () => {
  const { childId } = useParams<{ childId: string }>();
  const navigate = useNavigate();
  const { data, isLoading, updateChild, updating } = useChildView(childId || '');
  const profile = data?.profile;
  const sessions = data?.sessions ?? [];

  const [name, setName] = useState('');
  const [prompt, setPrompt] = useState('');

  useEffect(() => {
    if (profile) {
      setName(profile.display_name || '');
      setPrompt(profile.system_message || '');
    }
  }, [profile]);

  if (!childId) return <p className="p-4">Child not found.</p>;

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 w-full bg-white border-b border-gray-100 h-14 flex items-center px-4 z-10">
        <Button variant="ghost" size="icon" onClick={() => navigate('/profile')}>
          <ArrowLeft />
          <span className="sr-only">Back to Profile</span>
        </Button>
        <h1 className="flex-1 text-center font-medium">Child View</h1>
      </header>
      <main className="pt-16 p-4 max-w-md mx-auto space-y-4">
        {isLoading ? (
          <p>Loading...</p>
        ) : (
          <>
            <EditableField value={name} onChange={setName} onSave={() => updateChild({ display_name: name })} />
            <EditableField
              value={prompt}
              onChange={setPrompt}
              onSave={() => updateChild({ system_message: prompt })}
              className="text-sm"
              inputClassName="w-full border-gray-300"
            />
            <div className="space-y-2">
              <h2 className="font-medium">Chat Sessions</h2>
              <ul className="space-y-1">
                {sessions.map((s) => (
                  <SessionListItem
                    key={s.id}
                    session={{
                      id: s.id,
                      title: s.name || 'New chat',
                      description: s.description,
                      createdAt: s.created_at,
                    }}
                  />
                ))}
              </ul>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default ChildView;
