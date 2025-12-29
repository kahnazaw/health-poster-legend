-- Supabase Database Schema for Health Promotion Statistics System
-- Run this SQL in your Supabase SQL Editor

-- 1. Health Centers Table
CREATE TABLE IF NOT EXISTS health_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default health centers
INSERT INTO health_centers (name) VALUES
  ('مركز صحي الحويجة'),
  ('مركز صحي الرشيد'),
  ('مركز صحي الشورجة'),
  ('مركز صحي العباسية'),
  ('مركز صحي الكرامة'),
  ('مركز صحي المأمون'),
  ('مركز صحي النصر'),
  ('مركز صحي الهاشمية'),
  ('مركز صحي الوحدة'),
  ('مركز صحي الحرية'),
  ('مركز صحي الشهداء'),
  ('مركز صحي السلام'),
  ('مركز صحي الجهاد'),
  ('مركز صحي الفردوس'),
  ('مركز صحي الزهراء'),
  ('مركز صحي الإخاء'),
  ('مركز صحي التضامن'),
  ('مركز صحي الأمل'),
  ('مركز صحي الفتح'),
  ('مركز صحي النهضة')
ON CONFLICT (name) DO NOTHING;

-- 2. User Profiles Table (linked to auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  health_center_id UUID REFERENCES health_centers(id),
  health_center_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'center_user')) DEFAULT 'center_user',
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- 3. Monthly Statistics Table
CREATE TABLE IF NOT EXISTS monthly_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  health_center_id UUID REFERENCES health_centers(id),
  health_center_name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  month TEXT NOT NULL,
  year INTEGER NOT NULL,
  statistics_data JSONB NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')) DEFAULT 'draft',
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (health_center_id, health_center_name, month, year)
);

-- Enable Row Level Security
ALTER TABLE monthly_statistics ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own statistics
CREATE POLICY "Users can insert own statistics"
  ON monthly_statistics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own statistics (only if draft or rejected)
CREATE POLICY "Users can update own statistics"
  ON monthly_statistics FOR UPDATE
  USING (
    auth.uid() = user_id 
    AND (status = 'draft' OR status = 'rejected')
  );

-- Policy: Users can view their own statistics
CREATE POLICY "Users can view own statistics"
  ON monthly_statistics FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Admins can view all statistics
CREATE POLICY "Admins can view all statistics"
  ON monthly_statistics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, health_center_name, role, is_approved)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'health_center_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'center_user'),
    false
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Audit Logs Table (Lightweight & Safe)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('signup', 'approved', 'rejected', 'login')),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own audit logs
CREATE POLICY "Users can view own audit logs"
  ON audit_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Anyone authenticated can insert audit logs (for signup/login)
CREATE POLICY "Authenticated users can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_health_center_id ON profiles(health_center_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_monthly_statistics_health_center ON monthly_statistics(health_center_id, month, year);
CREATE INDEX IF NOT EXISTS idx_monthly_statistics_user_id ON monthly_statistics(user_id);
CREATE INDEX IF NOT EXISTS idx_monthly_statistics_status ON monthly_statistics(status);
CREATE INDEX IF NOT EXISTS idx_monthly_statistics_approved_by ON monthly_statistics(approved_by);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
