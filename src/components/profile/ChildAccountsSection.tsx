import React, { useEffect, useState } from 'react';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '../../lib/supa';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import EditableField from './EditableField';
import { Link } from 'react-router-dom';
import { createChildAccount } from '@/utils/createChildAccount';

interface ChildProfile {
  id: string;
  display_name: string | null;
  system_message: string | null;
}

const ChildAccountsSection: React.FC = () => {
  const { isAdult } = useFeatureAccess();
  const { user } = useAuth();

  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newMessage, setNewMessage] = useState('');

  const fetchChildren = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, system_message')
        .eq('parent_id', user.id);

      if (error) throw error;

      if (data) {
        setChildren(data as ChildProfile[]);
      }
    } catch (error) {
      console.error('Error fetching children:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChildren();
  }, [user]);

  const handleCreateChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      setLoading(true);
      await createChildAccount(email, password);
      toast({ title: 'Child account created' });
      setEmail('');
      setPassword('');
      setNewMessage('');
      fetchChildren();
    } catch (err: any) {
      console.error('Error creating child account:', err);
      toast({ title: 'Failed to create child', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMessage = async (childId: string, message: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ system_message: message })
        .eq('id', childId);

      if (error) throw error;
      toast({ title: 'System message updated' });
      setChildren(prev => prev.map(c => c.id === childId ? { ...c, system_message: message } : c));
    } catch (err: any) {
      console.error('Error updating system message:', err);
      toast({ title: 'Update failed', description: err.message, variant: 'destructive' });
    }
  };

  // Show the section for adult accounts or any user that has children
  if (!isAdult && children.length === 0 && !loading) return null;

  return (
    <div className="space-y-3">
      <Label>Child Accounts</Label>
      <div className="p-2 bg-gray-50 rounded-md border border-gray-200 space-y-4">
        {children.length === 0 && !loading && (
          <p className="text-sm text-gray-500">No child accounts</p>
        )}
        {children.map((child) => (
          <div key={child.id} className="space-y-1">
            <p className="text-sm font-medium">{child.display_name || child.id}</p>
            {isAdult ? (
              <EditableField
                value={child.system_message || ''}
                onChange={(val) =>
                  setChildren((prev) =>
                    prev.map((c) =>
                      c.id === child.id ? { ...c, system_message: val } : c
                    )
                  )
                }
                onSave={() =>
                  handleUpdateMessage(
                    child.id,
                    children.find((c) => c.id === child.id)?.system_message || ''
                  )
                }
                className="text-sm text-muted-foreground"
                inputClassName="max-w-[250px] border-gray-300"
                buttonClassName="h-7 w-7 text-gray-500 hover:text-gray-700"
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                {child.system_message}
              </p>
            )}
            <Link
              to={`/child-history/${child.id}`}
              className="text-xs text-blue-600 hover:underline"
            >
              View history
            </Link>
          </div>
        ))}
      </div>

      {isAdult && (
        <form onSubmit={handleCreateChild} className="space-y-2 pt-4">
          <Input
            type="email"
            placeholder="Child email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Input
            type="text"
            placeholder="System message"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating...' : 'Create Child Account'}
          </Button>
        </form>
      )}
    </div>
  );
};

export default ChildAccountsSection;
