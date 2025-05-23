
/**
 * Feature Flags Configuration
 * 
 * This file controls which features are enabled in the application.
 * Set a feature to false to disable it completely.
 */

export const featureFlags = {
  // Core features
  chat: true,
  settings: true,
  
  // Voice features
  voiceMode: false,
  
  // User management
  userProfiles: true,

  // Subscription features
  subscriptionTier: false,
  
  // Future features
  imageGeneration: true,
  documentUpload: false,
};

/**
 * Check if a feature is enabled
 * @param feature - The feature to check
 * @returns boolean indicating if the feature is enabled
 */
export const isFeatureEnabled = (feature: keyof typeof featureFlags): boolean => {
  return featureFlags[feature] === true;
};
