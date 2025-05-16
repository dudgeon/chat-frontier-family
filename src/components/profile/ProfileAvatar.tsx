
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';

interface ProfileAvatarProps {
  name: string;
  heroColor: string;
}

const ProfileAvatar: React.FC<ProfileAvatarProps> = ({ name, heroColor }) => {
  const { user } = useAuth();
  
  return (
    <Avatar className="h-24 w-24 mb-4" style={{ backgroundColor: heroColor }}>
      <AvatarImage src={user?.user_metadata?.avatar_url} />
      <AvatarFallback className="text-2xl text-white">
        {name.charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
};

export default ProfileAvatar;
