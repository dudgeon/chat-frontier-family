
import { useUserPermissions } from './useUserPermissions';

/**
 * Hook to check if a user has access to specific features
 * This provides a central place to control feature access across the app
 */
export const useFeatureAccess = () => {
  const { permissions, userRole, subscriptionTier, isLoading } = useUserPermissions();

  /**
   * Check if a specific feature is available
   * @param featureKey The feature to check access for
   * @returns boolean indicating if the feature is accessible
   */
  const canAccess = (featureKey: string): boolean => {
    if (isLoading) return false;

    switch (featureKey) {
      case 'deleteMessages':
        return permissions.canDeleteMessages;
      case 'deleteSessions':
        return permissions.canDeleteSessions;
      case 'hideMessages':
        return permissions.canHideMessages;
      case 'hideSessions':
        return permissions.canHideSessions;
      case 'createChildAccounts':
        return permissions.canCreateChildAccounts;
      case 'advancedModels':
        return subscriptionTier === 'paid';
      case 'admin':
        return userRole === 'adult';
      default:
        console.warn(`Unknown feature check: ${featureKey}`);
        return false;
    }
  };

  /**
   * Get available models based on subscription tier
   * @returns Array of available model names
   */
  const getAvailableModels = (): string[] => {
    return permissions.availableModels;
  };

  /**
   * Check if the user is of a specific role
   * @param role The role to check
   * @returns boolean indicating if the user has the role
   */
  const hasRole = (role: string): boolean => {
    return userRole === role;
  };

  return {
    canAccess,
    getAvailableModels,
    hasRole,
    isAdult: userRole === 'adult',
    isChild: userRole === 'child',
    isPaid: subscriptionTier === 'paid',
    isFree: subscriptionTier === 'free',
    isLoading
  };
};
