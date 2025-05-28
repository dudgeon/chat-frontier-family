import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchChildProfile, updateChildProfile, ChildSession } from '@/utils/childViewApi';
import EditableField from '@/components/profile/EditableField';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Trash2 } from 'lucide-react';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { invokeWithAuth } from '@/lib/invokeWithAuth';

const ChildView: React.FC = () => {
  const { childId } = useParams<{ childId: string }>();
  const navigate = useNavigate();
  const { isAdult } = useFeatureAccess();
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [sessions, setSessions] = useState<ChildSession[]>([]);

  useEffect(() => {
    if (!childId) return;
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchChildProfile(childId);
        setName(data.profile.display_name || '');
        setPrompt(data.profile.system_message || '');
        setSessions(data.sessions);
      } catch (err) {
        console.error('Failed to load child', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [childId]);

  if (!isAdult) {
    return <p className="p-4">Access denied.</p>;
  }

  if (!childId) {
    return <p className="p-4">Child not found.</p>;
  }

  const save = async () => {
    try {
      await updateChildProfile(childId, { display_name: name, system_message: prompt });
    } catch (err) {
      console.error('Update failed', err);
    }
  };

  const removeSession = async (id: string) => {
    const { error } = await invokeWithAuth('deleteSession', { id });
    if (!error) {
      setSessions((prev) => prev.filter((s) => s.id !== id));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 w-full bg-white border-b border-gray-100 h-14 flex items-center px-4 z-10">
        <Button variant="ghost" size="icon" onClick={() => navigate('/profile')}>
          <ArrowLeft />
          <span className="sr-only">Back</span>
        </Button>
        <h1 className="flex-1 text-center font-medium">Child</h1>
      </header>
      <main className="pt-16 p-4 max-w-md mx-auto space-y-4">
        <EditableField value={name} onChange={setName} onSave={save} />
        <EditableField
          value={prompt}
          onChange={setPrompt}
          onSave={save}
          className="text-sm text-muted-foreground"
          inputClassName="max-w-[250px] border-gray-300"
          buttonClassName="h-7 w-7 text-gray-500 hover:text-gray-700"
        />
        <ul className="space-y-2">
          {sessions.map((s) => (
            <li key={s.id} className="flex items-center gap-2">
              <Link to={`/chat/${s.id}`} className="flex-1 overflow-hidden">
                <span className="font-bold block truncate">{s.name || 'Chat'}</span>
                <span className="text-xs text-muted-foreground truncate">
                  {s.session_summary}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(s.created_at).toLocaleDateString()}
                </span>
              </Link>
              <button aria-label="Delete" onClick={() => removeSession(s.id)}>
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
};

export default ChildView;
