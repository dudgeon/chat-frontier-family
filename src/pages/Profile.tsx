
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ArrowLeft, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useChat } from '@/contexts/ChatContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { heroColor } = useChat();
  
  // Mock user data - in a real app, this would come from authentication context
  const [name, setName] = useState('Alex Johnson');
  const [accountType, setAccountType] = useState('parent');
  
  const handleLogout = () => {
    // In a real app, this would clear authentication state
    alert('User logged out');
    navigate('/');
  };
  
  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 w-full bg-white border-b border-gray-100 h-14 flex items-center px-4 z-10">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft />
          <span className="sr-only">Back</span>
        </Button>
        <h1 className="flex-1 text-center font-medium">Profile</h1>
      </header>
      
      <main className="pt-20 px-4 max-w-md mx-auto">
        <div className="flex flex-col items-center mb-8">
          <Avatar className="h-24 w-24 mb-4" style={{ backgroundColor: heroColor }}>
            <AvatarFallback className="text-2xl text-white">
              {name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-xl font-semibold">{name}</h2>
        </div>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              className="border-hero/30 focus:border-hero"
            />
          </div>
          
          <div className="space-y-3">
            <Label>Account Type</Label>
            <RadioGroup value={accountType} onValueChange={setAccountType} className="space-y-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="parent" id="parent" />
                <Label htmlFor="parent">Parent</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="kid" id="kid" />
                <Label htmlFor="kid">Kid</Label>
              </div>
            </RadioGroup>
          </div>
          
          <Button 
            className="w-full"
            style={{ 
              backgroundColor: heroColor,
              color: 'white' 
            }}
            onClick={() => alert('Profile updated successfully')}
          >
            Save Changes
          </Button>
          
          <Button 
            variant="outline"
            className="w-full flex items-center gap-2 mt-4 border-destructive text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <LogOut size={16} />
            Log Out
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Profile;
