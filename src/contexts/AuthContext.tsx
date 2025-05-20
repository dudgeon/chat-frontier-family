
import React, { createContext, useState, useEffect, useContext } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supa';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  signOut: async () => {},
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const navigate = useNavigate();

  // Handle auth state changes
  useEffect(() => {
    if (initialized) {
      return; // Skip if already initialized to prevent infinite loops
    }
    
    console.log('Setting up auth state listener');
    
    // Set initializing flag to prevent duplicate initialization
    setInitialized(true);
    
    // Set up auth state listener and session initialization
    let subscription: { unsubscribe: () => void } | undefined;
    const { data: { subscription: sub } } = supabase.auth.onAuthStateChange(
        (event, currentSession) => {
          console.log('Auth state changed:', event);
        
        if (event === 'SIGNED_IN') {
          // Store session in localStorage for persistence
          if (currentSession) {
            localStorage.setItem('supabase-auth-session', JSON.stringify({
              session: currentSession,
              timestamp: new Date().toISOString()
            }));
          }
        }
        
        if (event === 'SIGNED_OUT') {
          localStorage.removeItem('supabase-auth-session');
        }
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);
        }
      );
    subscription = sub;

    // THEN check for existing session
    const initializeSession = async () => {
      try {
        // First try to get session from Supabase
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (currentSession) {
          console.log('Session found through Supabase auth.getSession()');
          setSession(currentSession);
          setUser(currentSession.user);
          setLoading(false);
          return;
        }
        
        // If no session from Supabase, check localStorage as fallback
        const storedSession = localStorage.getItem('supabase-auth-session');
        
        if (storedSession) {
          try {
            const { session: localSession, timestamp } = JSON.parse(storedSession);
            const sessionAge = new Date().getTime() - new Date(timestamp).getTime();
            
            // Only use localStorage session if it's less than 1 hour old
            if (sessionAge < 3600000 && localSession) {
              console.log('Using session from localStorage');
              
              // Try to refresh the session
              const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession({
                refresh_token: localSession.refresh_token,
              });
              
              if (refreshData.session) {
                console.log('Session refreshed successfully');
                setSession(refreshData.session);
                setUser(refreshData.session.user);
              } else {
                console.log('Failed to refresh session:', refreshError);
                // Still use the stored session as fallback
                setSession(localSession);
                setUser(localSession.user);
                
                // Show toast about potential session issues
                toast({
                  title: "Session Warning",
                  description: "Your session couldn't be refreshed. You may need to login again soon.",
                  variant: "default",
                });
              }
            } else {
              console.log('Stored session too old or invalid');
              localStorage.removeItem('supabase-auth-session');
            }
          } catch (e) {
            console.error('Error parsing stored session:', e);
            localStorage.removeItem('supabase-auth-session');
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error initializing session:', error);
        setLoading(false);
      }
    };

    void initializeSession();
    return () => {
      console.log('Cleaning up auth listener');
      subscription?.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
      }
    } finally {
      // Ensure local state and storage are cleared even if signOut fails
      localStorage.removeItem('supabase-auth-session');
      setSession(null);
      setUser(null);
      navigate('/login');
    }
  };

  const value = {
    session,
    user,
    signOut,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
