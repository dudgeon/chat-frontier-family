
import React from 'react';
import { cn } from '@/lib/utils';

interface ColorPickerProps {
  currentColor: string;
  onColorChange: (color: string) => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ currentColor, onColorChange }) => {
  // Predefined color options with the new color set, with dark purple first as default
  const colorOptions = [
    { value: '#4C356B', label: 'Dark Purple' },
    { value: '#E92F2F', label: 'Red' },
    { value: '#F66737', label: 'Orange' },
    { value: '#FDD85D', label: 'Yellow' },
    { value: '#F699B3', label: 'Pink' },
    { value: '#00A199', label: 'Teal' },
  ];

  return (
    <div className="flex justify-center gap-3">
      {colorOptions.map((color) => (
        <button
          key={color.value}
          className={cn(
            "w-8 h-8 rounded-full transition-all relative",
            currentColor === color.value 
              ? "scale-110" 
              : "hover:scale-105"
          )}
          style={{ backgroundColor: color.value }}
          onClick={() => onColorChange(color.value)}
          title={color.label}
          aria-label={color.label}
        >
          {currentColor === color.value && (
            <span 
              className="absolute inset-0 border-2 rounded-full" 
              style={{ borderColor: color.value }}
            />
          )}
        </button>
      ))}
    </div>
  );
};

export default ColorPicker;
