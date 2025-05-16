
import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import SubscriptionTable from './SubscriptionTable';

const SubscriptionSection: React.FC = () => {
  const { isPaid } = useFeatureAccess();
  
  return (
    <div className="space-y-3">
      <Label>Subscription Tier</Label>
      <div className="p-2 bg-gray-50 rounded-md border border-gray-200">
        <p className="text-sm font-medium">{isPaid ? 'Paid' : 'Free'}</p>
        <p className="text-xs text-gray-500 mt-1">
          {isPaid 
            ? "You have access to all premium features and models" 
            : "Upgrade to access premium features and models"}
        </p>
      </div>
      
      <SubscriptionTable />
      
      <Button 
        className="w-full mt-4"
        style={{ 
          backgroundColor: '#9b87f5',
          color: 'white' 
        }}
        disabled
      >
        Upgrade to Premium (Coming Soon)
      </Button>
    </div>
  );
};

export default SubscriptionSection;
