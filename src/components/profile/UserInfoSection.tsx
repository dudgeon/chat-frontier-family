
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import EditableField from './EditableField';
import ProfileAvatar from './ProfileAvatar';

interface UserInfoSectionProps {
  name: string;
  email: string;
  heroColor: string;
  updateName: (value: string) => void;
  updateEmail: (value: string) => void;
  handleProfileUpdate: () => void;
}

const UserInfoSection: React.FC<UserInfoSectionProps> = ({
  name,
  email,
  heroColor,
  updateName,
  updateEmail,
  handleProfileUpdate,
}) => {
  const { isPaid, isAdult } = useFeatureAccess();

  return (
    <div className="flex flex-col items-center mb-8">
      <ProfileAvatar name={name} heroColor={heroColor} />
      
      <div className="flex items-center gap-2">
        <EditableField
          value={name}
          onChange={updateName}
          onSave={handleProfileUpdate}
        />
      </div>
      
      <div className="flex items-center gap-2 mt-1">
        <EditableField
          value={email}
          onChange={updateEmail}
          onSave={handleProfileUpdate}
          inputClassName="max-w-[250px] border-hero/30 focus:border-hero"
          className="text-sm text-muted-foreground"
          buttonClassName="h-7 w-7 text-gray-500 hover:text-gray-700"
          type="email"
        />
      </div>
      
      <div className="flex mt-2 gap-2">
        <Badge variant={isAdult ? "default" : "outline"}>
          {isAdult ? "Adult" : "Child"}
        </Badge>
        <Badge variant={isPaid ? "default" : "outline"} 
          className={isPaid ? "bg-emerald-600" : ""}>
          {isPaid ? "Paid" : "Free"}
        </Badge>
      </div>
    </div>
  );
};

export default UserInfoSection;
