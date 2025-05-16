
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit } from 'lucide-react';

interface EditableFieldProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  type?: string;
  className?: string;
  inputClassName?: string;
  buttonClassName?: string;
}

const EditableField: React.FC<EditableFieldProps> = ({ 
  value, 
  onChange, 
  onSave,
  type = "text",
  className = "text-xl font-semibold",
  inputClassName = "max-w-[200px] border-hero/30 focus:border-hero",
  buttonClassName = "h-8 w-8 text-gray-500 hover:text-gray-700"
}) => {
  const [isEditing, setIsEditing] = useState(false);

  const handleBlur = () => {
    onSave();
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSave();
      setIsEditing(false);
    }
  };

  return isEditing ? (
    <Input 
      className={inputClassName}
      type={type}
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      autoFocus
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    />
  ) : (
    <>
      <p className={className}>{value}</p>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => setIsEditing(true)}
        className={buttonClassName}
      >
        <Edit size={16} />
        <span className="sr-only">Edit field</span>
      </Button>
    </>
  );
};

export default EditableField;
