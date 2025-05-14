
export const hexToHSL = (hex: string): string => {
  // Remove the # if present
  hex = hex.replace(/^#/, '');
  
  // Parse the hex values
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;
  
  // Find the max and min values
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    
    h = Math.round(h * 60);
  }
  
  s = Math.round(s * 100);
  const lightness = Math.round(l * 100);
  
  return `${h} ${s}% ${lightness}%`;
};

export const updateCssVariable = (colorHex: string): void => {
  const root = document.documentElement;
  root.style.setProperty('--hero', hexToHSL(colorHex));
  
  // Save to localStorage
  localStorage.setItem('chat-app-color', colorHex);
};

// Default color is now dark purple
export const DEFAULT_THEME_COLOR = '#4C356B';

// Load color from localStorage or use default
export const loadSavedColor = (): string => {
  return localStorage.getItem('chat-app-color') || DEFAULT_THEME_COLOR;
};
