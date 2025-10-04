/*
  # Fix Profiles Insert Policy

  1. Changes
    - Add INSERT policy for profiles table to allow new users to create their own profile
    - This allows authenticated users to insert their own profile during signup
    
  2. Security
    - Policy ensures users can only create profile with their own auth.uid()
    - Prevents users from creating profiles for other users
*/

-- Add INSERT policy for profiles
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
