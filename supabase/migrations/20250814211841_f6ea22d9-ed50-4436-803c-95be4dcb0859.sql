-- Create foreign key relationship between team_members and profiles
ALTER TABLE team_members 
ADD CONSTRAINT team_members_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Ensure profiles table has proper constraint
ALTER TABLE profiles 
ADD CONSTRAINT profiles_user_id_unique 
UNIQUE (user_id);