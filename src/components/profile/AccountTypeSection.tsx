
import React from 'react';
import { Label } from '@/components/ui/label';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';

const AccountTypeSection: React.FC = () => {
  const { isAdult } = useFeatureAccess();
  
  return (
    <div className="space-y-3">
      <Label>Account Type</Label>
      <div className="p-2 bg-gray-50 rounded-md border border-gray-200">
        <p className="text-sm font-medium">{isAdult ? 'Adult' : 'Child'}</p>
        {isAdult && (
          <p className="text-xs text-gray-500 mt-1">
            You can manage child accounts and delete messages
          </p>
        )}
      </div>
    </div>
  );
};

export default AccountTypeSection;
