-- Ensure new users default to adult role
ALTER TABLE profiles ALTER COLUMN user_role SET DEFAULT 'adult';

-- Update any existing parent roles to adult
UPDATE profiles SET user_role='adult' WHERE user_role='parent';
