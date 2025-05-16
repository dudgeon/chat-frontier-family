
import { featureFlags, isFeatureEnabled } from '@/config/featureFlags';

/**
 * Hook to access feature flags throughout the application
 */
export const useFeatureFlags = () => {
  return {
    flags: featureFlags,
    isEnabled: isFeatureEnabled
  };
};
