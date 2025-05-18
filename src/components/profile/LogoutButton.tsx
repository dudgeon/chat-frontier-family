
import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

const LogoutButton: React.FC = () => {
  const { signOut } = useAuth();
  
  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      toast({
        title: "Error signing out",
        variant: "destructive"
      });
    }
  };
  
  return (
    <Button 
      variant="outline"
      className="w-full flex items-center gap-2 border-destructive text-destructive hover:bg-destructive/10"
      onClick={handleLogout}
    >
      <LogOut size={16} />
      Log Out
    </Button>
  );
};

export default LogoutButton;
