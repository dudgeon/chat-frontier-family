
import React from 'react';
import { cn } from '@/lib/utils';

interface ColorPickerProps {
  currentColor: string;
  onColorChange: (color: string) => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ currentColor, onColorChange }) => {
  // Predefined color options
  const colorOptions = [
    { value: '#6366F1', label: 'Indigo' },    // Default
    { value: '#3B82F6', label: 'Blue' },
    { value: '#10B981', label: 'Green' },
    { value: '#F59E0B', label: 'Amber' },
    { value: '#EF4444', label: 'Red' },
    { value: '#8B5CF6', label: 'Purple' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {colorOptions.map((color) => (
          <button
            key={color.value}
            className={cn(
              "w-full aspect-square rounded-full border-2",
              currentColor === color.value ? "border-gray-900" : "border-transparent"
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
