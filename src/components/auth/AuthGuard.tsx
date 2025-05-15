
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { session, loading } = useAuth();
  const location = useLocation();
  
  useEffect(() => {
    if (!loading) {
      console.log('AuthGuard: Session status:', session ? 'Authenticated' : 'Not authenticated');
    }
  }, [session, loading]);

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading your session...</p>
      </div>
    );
  }

  if (!session) {
    console.log('AuthGuard: Redirecting to login, no session found');
    // Redirect to the login page, but save the current location
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
};

export default AuthGuard;
