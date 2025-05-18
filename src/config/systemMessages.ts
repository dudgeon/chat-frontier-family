export const DEFAULT_ADULT_SYSTEM_MESSAGE = 'You are a very helpful assistant. Provide friendly, concise responses.';
export const DEFAULT_CHILD_SYSTEM_MESSAGE = 'You are a friendly assistant for children. Keep responses safe and age-appropriate.';

export const getDefaultSystemMessage = (role: 'adult' | 'child' = 'adult'): string => {
  return role === 'child' ? DEFAULT_CHILD_SYSTEM_MESSAGE : DEFAULT_ADULT_SYSTEM_MESSAGE;
};
