
import { useState, useEffect } from 'react';

export const useApiKey = () => {
  const [apiKey, setApiKey] = useState<string>(() => {
    const savedKey = localStorage.getItem('openai-api-key');
    return savedKey || '';
  });
  
  // Save API key to localStorage when it changes
  useEffect(() => {
    if (apiKey) {
      localStorage.setItem('openai-api-key', apiKey);
    }
  }, [apiKey]);

  return { apiKey, setApiKey };
};
