
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ArrowLeft, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useChat } from '@/contexts/ChatContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { heroColor } = useChat();
  const { user, signOut } = useAuth();
  
  const [name, setName] = useState(user?.user_metadata?.name || 'User');
  const [accountType, setAccountType] = useState('parent');
  const [loading, setLoading] = useState(false);
  
  // Fetch profile on load
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('display_name, user_role')
          .eq('id', user.id)
          .single();
        
        if (error) throw error;
        
        if (data) {
          setName(data.display_name || name);
          setAccountType(data.user_role || 'parent');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };
    
    fetchProfile();
  }, [user]);
  
  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      toast({
        title: "Error signing out",
        variant: "destructive"
      });
    }
  };
  
  const handleProfileUpdate = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: name,
          user_role: accountType,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully"
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
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
            <AvatarImage src={user?.user_metadata?.avatar_url} />
            <AvatarFallback className="text-2xl text-white">
              {name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-xl font-semibold">{name}</h2>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
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
            onClick={handleProfileUpdate}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Changes"}
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
