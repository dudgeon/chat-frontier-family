import React, { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface ChildAccount {
  id: string;
  display_name: string | null;
}

const ChildAccountsSection: React.FC = () => {
  const { user } = useAuth();
  const { isAdult } = useFeatureAccess();
  const [children, setChildren] = useState<ChildAccount[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchChildren = async () => {
      if (!user || !isAdult) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name')
        .eq('parent_id', user.id);
      if (error) {
        console.error('Error fetching child accounts:', error);
        return;
      }
      setChildren(data || []);
    };
    fetchChildren();
  }, [user, isAdult]);

  if (!isAdult) return null;

  return (
    <div className="space-y-3">
      <Label>Child Accounts</Label>
      {children.length === 0 ? (
        <p className="text-sm text-gray-500">No child accounts found.</p>
      ) : (
        <div className="space-y-2">
          {children.map((child) => (
            <Button
              key={child.id}
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate(`/child-history/${child.id}`)}
            >
              {child.display_name || 'Unnamed Child'}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChildAccountsSection;
