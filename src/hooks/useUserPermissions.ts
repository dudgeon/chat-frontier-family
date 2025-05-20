
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getSupabase } from '@/lib/supa';
import { UserPermissions, UserRole, SubscriptionTier, UserFeatureAccess } from '@/types/userTypes';

export const useUserPermissions = (): {
  permissions: UserPermissions;
  userRole: UserRole;
  subscriptionTier: SubscriptionTier;
  isLoading: boolean;
} => {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<UserRole>('adult');
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>('free');
  const [isLoading, setIsLoading] = useState(true);
  
  // Determine permissions based on role and subscription tier
  const permissions: UserPermissions = {
    canDeleteMessages: userRole === 'adult',
    canDeleteSessions: userRole === 'adult',
    canHideMessages: true, // Both adult and child can hide messages
    canHideSessions: true, // Both adult and child can hide sessions
    canCreateChildAccounts: userRole === 'adult',
    availableModels: subscriptionTier === 'paid' 
      ? ['gpt-4o', 'gpt-4o-mini'] 
      : ['gpt-4o-mini']
  };

  // Fetch user role and subscription info from database
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      try {
        const supabase = await getSupabase();
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('user_role, subscription_tier, system_message')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Error fetching user role:', profileError);
          setIsLoading(false);
          return;
        }
        
        if (profileData) {
          // Set user role from database (defaulting to 'adult' if not found)
          setUserRole(profileData.user_role as UserRole || 'adult');
          
          // Set subscription tier from database (defaulting to 'free' if not found)
          setSubscriptionTier(profileData.subscription_tier as SubscriptionTier || 'free');
        }
      } catch (error) {
        console.error('Error checking user permissions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserInfo();
  }, [user]);

  return { 
    permissions,
    userRole,
    subscriptionTier,
    isLoading
  };
};
