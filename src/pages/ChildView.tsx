import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supa';
import { Button } from '@/components/ui/button';
import EditableField from '@/components/profile/EditableField';
import { SessionListItem } from '@/components/common';
import { ArrowLeft } from 'lucide-react';

interface SessionRow { id: string; name: string | null; description: string | null; last_updated: string; }

const fetchChild = async (childId: string) => {
  const { data, error } = await supabase.functions.invoke(`children/${childId}`, { method: 'GET' });
  if (error) throw new Error(error.message);
  return data as { profile: { display_name: string | null; system_message: string | null }; sessions: SessionRow[] };
};

const ChildView: React.FC = () => {
  const { childId } = useParams<{ childId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery(['child', childId], () => fetchChild(childId!), { enabled: !!childId });

  const [name, setName] = useState('');
  const [prompt, setPrompt] = useState('');

  React.useEffect(() => {
    if (data) {
      setName(data.profile.display_name || '');
      setPrompt(data.profile.system_message || '');
    }
  }, [data]);

  const saveMutation = useMutation(
    async () => {
      await supabase.functions.invoke(`children/${childId}`, {
        method: 'PATCH',
        body: { display_name: name, system_message: prompt }
      });
    },
    { onSuccess: () => queryClient.invalidateQueries(['child', childId]) }
  );

  if (!childId) return <p className="p-4">Child not found.</p>;

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 w-full bg-white border-b border-gray-100 h-14 flex items-center px-4 z-10">
        <Button variant="ghost" size="icon" onClick={() => navigate('/profile')}>
          <ArrowLeft />
          <span className="sr-only">Back</span>
        </Button>
        <h1 className="flex-1 text-center font-medium">Child View</h1>
      </header>
      <main className="pt-16 p-4 max-w-md mx-auto space-y-6">
        {isLoading || !data ? (
          <p>Loading...</p>
        ) : (
          <>
            <div className="space-y-2">
              <EditableField value={name} onChange={setName} onSave={() => saveMutation.mutate()} />
              <EditableField
                value={prompt}
                onChange={setPrompt}
                onSave={() => saveMutation.mutate()}
                inputClassName="w-full border-gray-300"
                className="text-sm text-muted-foreground"
              />
            </div>
            <div className="space-y-2">
              <h2 className="font-medium">Chat Sessions</h2>
              <ul className="space-y-1">
                {data.sessions.map((s) => (
                  <SessionListItem
                    key={s.id}
                    session={{
                      id: s.id,
                      name: s.name,
                      description: s.description,
                      lastUpdated: s.last_updated
                    }}
                    onSelect={(id) => navigate(`/sessions/${id}`)}
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
