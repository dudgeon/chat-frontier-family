
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProfileHeader: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <header className="fixed top-0 w-full bg-white border-b border-gray-100 h-14 flex items-center px-4 z-10">
      <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
        <ArrowLeft />
        <span className="sr-only">Back</span>
      </Button>
      <h1 className="flex-1 text-center font-medium">Profile</h1>
    </header>
  );
};

export default ProfileHeader;
