import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ChildChatHistory from '@/components/profile/ChildChatHistory';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const ChildHistory: React.FC = () => {
  const { childId } = useParams<{ childId: string }>();
  const navigate = useNavigate();

  if (!childId) {
    return <p className="p-4">Child not found.</p>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 w-full bg-white border-b border-gray-100 h-14 flex items-center px-4 z-10">
        <Button variant="ghost" size="icon" onClick={() => navigate('/profile')}>
          <ArrowLeft />
          <span className="sr-only">Back</span>
        </Button>
        <h1 className="flex-1 text-center font-medium">Chat History</h1>
      </header>
      <main className="pt-16 p-4 max-w-md mx-auto">
        <ChildChatHistory childId={childId} />
      </main>
    </div>
  );
};

export default ChildHistory;
