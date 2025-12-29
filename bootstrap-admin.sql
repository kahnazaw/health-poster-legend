-- =====================================================
-- 🔐 ADMIN BOOTSTRAP SCRIPT (SAFE & PRODUCTION-READY)
-- =====================================================
-- 
-- This script creates a bootstrap admin account for the
-- Health Promotion Statistics System.
--
-- ⚠️  IMPORTANT: Run this AFTER creating the user in Supabase Auth
-- 
-- Steps:
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Click "Add user" or "Invite user"
-- 3. Email: admin@health.gov.iq (or your preferred email)
-- 4. Set password manually or via email invite
-- 5. Run this SQL script in Supabase SQL Editor
--
-- =====================================================

-- Step 1: Verify the admin user exists in auth.users
-- (Replace 'admin@health.gov.iq' with your admin email if different)
DO $$
DECLARE
  admin_user_id UUID;
  admin_email TEXT := 'admin@health.gov.iq';
BEGIN
  -- Check if user exists
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = admin_email;
  
  IF admin_user_id IS NULL THEN
    RAISE EXCEPTION 'Admin user not found in auth.users. Please create the user in Supabase Dashboard → Authentication → Users first. Email: %', admin_email;
  END IF;
  
  RAISE NOTICE 'Found admin user: % (ID: %)', admin_email, admin_user_id;
END $$;

-- Step 2: Insert or Update Admin Profile
-- This is idempotent (safe to run multiple times)
WITH admin_user AS (
  SELECT id, email
  FROM auth.users
  WHERE email = 'admin@health.gov.iq'
)
INSERT INTO public.profiles (
  id,
  email,
  full_name,
  health_center_name,
  role,
  is_approved,
  created_at,
  updated_at
)
SELECT
  id,
  email,
  'مدير النظام - دائرة صحة كركوك',
  'إدارة القطاع',
  'admin',
  true,
  NOW(),
  NOW()
FROM admin_user
ON CONFLICT (id)
DO UPDATE SET
  role = 'admin',
  is_approved = true,
  health_center_name = 'إدارة القطاع',
  full_name = 'مدير النظام - دائرة صحة كركوك',
  updated_at = NOW();

-- Step 3: Verify the admin profile was created/updated
SELECT 
  id,
  email,
  full_name,
  health_center_name,
  role,
  is_approved,
  created_at
FROM public.profiles
WHERE email = 'admin@health.gov.iq';

-- Step 4: Verify RLS Policy allows admin to read own profile
-- (This should already exist from supabase-schema.sql)
-- If you get permission errors, ensure this policy exists:
--
-- CREATE POLICY "Users can view own profile"
-- ON profiles FOR SELECT
-- USING (auth.uid() = id);

-- =====================================================
-- ✅ SUCCESS CHECKLIST
-- =====================================================
-- After running this script, verify:
--
-- ✅ Query above returns one row with:
--    - role = 'admin'
--    - is_approved = true
--    - health_center_name = 'إدارة القطاع'
--
-- ✅ You can log in at /login with:
--    - Email: admin@health.gov.iq
--    - Password: (the one you set in Supabase Auth)
--
-- ✅ After login, you should have access to:
--    - /sector-dashboard
--    - /admin/approvals
--    - /admin/audit-log
--    - /admin/reports
--
-- ✅ No "pending approval" screen should appear
--
-- =====================================================

