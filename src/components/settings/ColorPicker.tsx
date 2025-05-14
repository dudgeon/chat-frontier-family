
import React from 'react';
import { cn } from '@/lib/utils';

interface ColorPickerProps {
  currentColor: string;
  onColorChange: (color: string) => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ currentColor, onColorChange }) => {
  // Predefined color options with the new color set
  const colorOptions = [
    { value: '#E92F2F', label: 'Red' },
    { value: '#F66737', label: 'Orange' },
    { value: '#FDD85D', label: 'Yellow' },
    { value: '#F699B3', label: 'Pink' },
    { value: '#4C356B', label: 'Purple' },
    { value: '#00A199', label: 'Teal' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {colorOptions.map((color) => (
          <button
            key={color.value}
            className={cn(
              "w-8 h-8 rounded-full border transition-all",
              currentColor === color.value 
                ? "border-gray-900 ring-2 ring-hero/50 scale-110" 
                : "border-transparent hover:scale-105"
            )}
            style={{ backgroundColor: color.value }}
            onClick={() => onColorChange(color.value)}
            title={color.label}
          />
        ))}
      </div>
    </div>
  );
};

export default ColorPicker;
