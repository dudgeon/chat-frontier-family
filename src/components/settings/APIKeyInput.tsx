
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Save } from 'lucide-react';
import { useChat } from '@/contexts/ChatContext';
import { toast } from '@/components/ui/use-toast';

const APIKeyInput: React.FC = () => {
  const { apiKey, setApiKey } = useChat();
  const [inputValue, setInputValue] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);

  const handleSave = () => {
    if (inputValue.trim().length < 30) {
      toast({
        title: "Invalid API Key",
        description: "This doesn't look like a valid OpenAI API key",
        variant: "destructive"
      });
      return;
    }
    
    setApiKey(inputValue.trim());
    toast({
      title: "API Key Saved",
      description: "Your OpenAI API key has been saved"
    });
  };

  return (
    <div className="space-y-2">
      <h3 className="font-medium text-lg">OpenAI API Key</h3>
      <p className="text-sm text-muted-foreground">
        Enter your OpenAI API key to enable GPT-4o responses
      </p>
      <div className="flex gap-2">
        <Input
          type={showKey ? "text" : "password"}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="sk-..."
          className="flex-1"
        />
        <Button variant="outline" size="icon" onClick={() => setShowKey(!showKey)}>
          {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
        </Button>
        <Button onClick={handleSave} className="bg-hero text-white" disabled={inputValue === apiKey}>
          <Save size={16} className="mr-2" />
          Save
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Your API key is stored only in your browser's local storage.
      </p>
    </div>
  );
};

export default APIKeyInput;
