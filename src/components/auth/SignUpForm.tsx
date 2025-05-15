
import React, { useState, useEffect } from 'react';
import { differenceInYears } from "date-fns";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CardContent, CardFooter } from "@/components/ui/card";
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import DateOfBirthPicker from './DateOfBirthPicker';

const SignUpForm: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [isOver18, setIsOver18] = useState(true);
  const [dateSelected, setDateSelected] = useState(false);
  
  // Check if user is over 18 when date changes
  useEffect(() => {
    if (date) {
      const age = differenceInYears(new Date(), date);
      setIsOver18(age >= 18);
      setDateSelected(true);
    } else {
      setDateSelected(false);
    }
  }, [date]);

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date) {
      toast({
        title: "Missing information",
        description: "Please enter your date of birth.",
        variant: "destructive"
      });
      return;
    }
    
    if (!isOver18) {
      toast({
        title: "Age restriction",
        description: "You must be over 18 years old to create an account.",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            date_of_birth: date.toISOString().split('T')[0],
          }
        }
      });
      
      if (error) throw error;
      
      // Also save the user type as 'adult' in their profile
      if (data?.user) {
        await supabase.from('profiles').update({
          user_role: 'adult'
        }).eq('id', data.user.id);
      }
      
      toast({
        title: "Account created",
        description: "Please check your email to confirm your account.",
      });
    } catch (error) {
      console.error('Sign up error:', error);
      toast({
        title: "Signup failed",
        description: error.message || "Please try again with a different email.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleEmailSignUp}>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="signup-email" className="block text-sm font-medium">Email</label>
          <Input
            id="signup-email"
            type="email"
            placeholder="Your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="signup-password" className="block text-sm font-medium">Password</label>
          <Input
            id="signup-password"
            type="password"
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <DateOfBirthPicker 
          date={date}
          setDate={setDate}
          isOver18={isOver18}
          dateSelected={dateSelected}
        />
      </CardContent>
      <CardFooter>
        <Button 
          type="submit" 
          className="w-full bg-hero text-white" 
          disabled={loading || !dateSelected || !isOver18}
        >
          {loading ? 'Creating Account...' : 'Sign Up'}
        </Button>
      </CardFooter>
    </form>
  );
};

export default SignUpForm;
