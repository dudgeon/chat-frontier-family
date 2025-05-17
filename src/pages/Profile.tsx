
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '@/contexts/ChatContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Import refactored components
import ProfileHeader from '@/components/profile/ProfileHeader';
import UserInfoSection from '@/components/profile/UserInfoSection';
import AccountTypeSection from '@/components/profile/AccountTypeSection';
import SubscriptionSection from '@/components/profile/SubscriptionSection';
import LogoutButton from '@/components/profile/LogoutButton';
import ChildAccountsSection from '@/components/profile/ChildAccountsSection';

const Profile: React.FC = () => {
  const { heroColor } = useChat();
  const { user } = useAuth();
  
  const [name, setName] = useState(user?.user_metadata?.name || 'User');
  const [email, setEmail] = useState(user?.email || '');
  const [systemMessage, setSystemMessage] = useState(
    'You are a helpful assistant. Provide friendly, concise responses.'
  );
  const [loading, setLoading] = useState(false);
  
  // Fetch profile on load
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('display_name, user_role, subscription_tier, system_message')
          .eq('id', user.id)
          .single();
        
        if (error) throw error;
        
        if (data) {
          setName(data.display_name || name);
          setSystemMessage(
            data.system_message ||
              'You are a helpful assistant. Provide friendly, concise responses.'
          );
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };
    
    fetchProfile();
  }, [user]);
  
  const handleProfileUpdate = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // If updating email, check that it's not already used
      if (email !== user.email) {
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
          system_message: systemMessage,
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
      <ProfileHeader />
      
      <main className="pt-20 px-4 max-w-md mx-auto">
        <UserInfoSection 
          name={name}
          email={email}
          heroColor={heroColor}
          updateName={setName}
          updateEmail={setEmail}
          handleProfileUpdate={handleProfileUpdate}
        />
        
        <div className="space-y-6">
          <AccountTypeSection />

          <ChildAccountsSection />

          <SubscriptionSection />

          <LogoutButton />
        </div>
      </main>
    </div>
  );
};

export default Profile;
