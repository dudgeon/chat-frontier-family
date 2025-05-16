
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, LogOut, Edit } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useChat } from '@/contexts/ChatContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
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
import { useFeatureFlags } from '@/hooks/useFeatureFlags';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { heroColor } = useChat();
  const { user, signOut } = useAuth();
  const { isPaid, isAdult, isFree, isChild } = useFeatureAccess();
  const { isEnabled } = useFeatureFlags();
  
  const [name, setName] = useState(user?.user_metadata?.name || 'User');
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  
  // Fetch profile on load
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('display_name, user_role, subscription_tier')
          .eq('id', user.id)
          .single();
        
        if (error) throw error;
        
        if (data) {
          setName(data.display_name || name);
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
      navigate('/login');
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
      
      // If updating email, check that it's not already used
      if (isEditingEmail && email !== user.email) {
        const { data: existingUsers, error: checkError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single();
          
        if (checkError || existingUsers) {
          throw new Error('This email is already in use by another account');
        }
        
        // Update email in auth.users
        const { error: updateAuthError } = await supabase.auth.updateUser({
          email: email,
        });
        
        if (updateAuthError) throw updateAuthError;
      }
      
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: name,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully"
      });
      
      setIsEditingName(false);
      setIsEditingEmail(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update failed",
        description: typeof error === 'object' && error !== null && 'message' in error 
          ? String(error.message) 
          : "Failed to update profile. Please try again.",
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
          
          <div className="flex items-center gap-2">
            {isEditingName ? (
              <Input 
                className="max-w-[200px] border-hero/30 focus:border-hero"
                value={name} 
                onChange={(e) => setName(e.target.value)}
                autoFocus
                onBlur={() => {
                  handleProfileUpdate();
                  setIsEditingName(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleProfileUpdate();
                    setIsEditingName(false);
                  }
                }}
              />
            ) : (
              <>
                <h2 className="text-xl font-semibold">{name}</h2>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsEditingName(true)}
                  className="h-8 w-8 text-gray-500 hover:text-gray-700"
                >
                  <Edit size={16} />
                  <span className="sr-only">Edit name</span>
                </Button>
              </>
            )}
          </div>
          
          <div className="flex items-center gap-2 mt-1">
            {isEditingEmail ? (
              <Input 
                className="max-w-[250px] border-hero/30 focus:border-hero"
                type="email"
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                onBlur={() => {
                  handleProfileUpdate();
                  setIsEditingEmail(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleProfileUpdate();
                    setIsEditingEmail(false);
                  }
                }}
              />
            ) : (
              <>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsEditingEmail(true)}
                  className="h-7 w-7 text-gray-500 hover:text-gray-700"
                >
                  <Edit size={14} />
                  <span className="sr-only">Edit email</span>
                </Button>
              </>
            )}
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
        
        <div className="space-y-6">
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
