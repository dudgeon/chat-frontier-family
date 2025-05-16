
import React from 'react';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';

const SubscriptionTable: React.FC = () => {
  const { isPaid } = useFeatureAccess();
  const { isEnabled } = useFeatureFlags();
  
  return (
    <div className="mt-4 border rounded-md overflow-hidden">
      <Table>
        <TableCaption>Your current plan: <Badge>{isPaid ? "Premium" : "Free"}</Badge></TableCaption>
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead className="w-[150px]">Feature</TableHead>
            <TableHead>Free</TableHead>
            <TableHead>Premium</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium">AI Models</TableCell>
            <TableCell>GPT-4 Mini</TableCell>
            <TableCell>GPT-4 & GPT-4 Mini</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Advanced Voice</TableCell>
            <TableCell>Not Available</TableCell>
            <TableCell>Coming Soon</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Image Generation</TableCell>
            <TableCell>Not Available</TableCell>
            <TableCell>Coming Soon</TableCell>
          </TableRow>
          {isEnabled('documentUpload') && (
            <TableRow>
              <TableCell className="font-medium">Document Upload</TableCell>
              <TableCell>Limited (5/month)</TableCell>
              <TableCell>Unlimited</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default SubscriptionTable;
