-- =====================================================
-- 🔧 UPDATE SCHEMA: Make health_center_name Optional
-- =====================================================
-- 
-- This script updates the existing database to make
-- health_center_name optional (can be empty string or NULL)
--
-- Run this in Supabase SQL Editor after running supabase-schema.sql
--
-- =====================================================

-- Step 1: Update existing profiles to have empty string if NULL
UPDATE public.profiles
SET health_center_name = ''
WHERE health_center_name IS NULL;

-- Step 2: Alter column to allow empty string (remove NOT NULL constraint)
ALTER TABLE public.profiles
ALTER COLUMN health_center_name DROP NOT NULL;

-- Step 3: Set default value to empty string
ALTER TABLE public.profiles
ALTER COLUMN health_center_name SET DEFAULT '';

-- Step 4: Update the trigger function to handle optional health_center_name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, health_center_name, role, is_approved)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'health_center_name', ''), ''), -- Optional: defaults to empty string
    COALESCE(NEW.raw_user_meta_data->>'role', 'center_user'),
    false
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Verify the changes
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name = 'health_center_name';

-- Expected result:
-- column_name: health_center_name
-- data_type: text
-- is_nullable: YES (or NO with default '')
-- column_default: ''::text

-- =====================================================
-- ✅ SUCCESS CHECKLIST
-- =====================================================
-- After running this script:
--
-- ✅ health_center_name column allows empty strings
-- ✅ New users can sign up without providing center name
-- ✅ Existing profiles with NULL center names are updated
-- ✅ Trigger function handles optional center name
--
-- =====================================================

