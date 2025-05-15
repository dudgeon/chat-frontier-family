
export type UserRole = 'adult' | 'child';
export type SubscriptionTier = 'free' | 'paid';

export interface UserPermissions {
  canDeleteMessages: boolean;
  canDeleteSessions: boolean;
  canHideMessages: boolean;
  canHideSessions: boolean;
  canCreateChildAccounts: boolean;
  availableModels: string[];
}

export interface UserFeatureAccess {
  permissions: UserPermissions;
  subscriptionTier: SubscriptionTier;
  role: UserRole;
}
