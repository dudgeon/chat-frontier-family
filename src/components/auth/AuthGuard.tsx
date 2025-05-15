
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // You could show a loading indicator here
    return <div className="h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!session) {
    // Redirect to the login page, but save the current location they were
    // trying to go to so we can send them there after logging in
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default AuthGuard;
