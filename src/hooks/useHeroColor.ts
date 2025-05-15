
import { useState, useEffect } from 'react';
import { updateCssVariable, loadSavedColor } from '@/utils/colorUtils';
import { COLOR_STORAGE_KEY } from '@/types/chatContext';

export const useHeroColor = () => {
  // Get stored color or use default via loadSavedColor utility
  const [heroColor, setHeroColorState] = useState<string>(() => loadSavedColor());

  // Update CSS variable when hero color changes - updateCssVariable now handles localStorage
  useEffect(() => {
    updateCssVariable(heroColor);
  }, [heroColor]);

  return { heroColor, setHeroColor: setHeroColorState };
};
