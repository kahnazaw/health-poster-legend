# 🔐 Bootstrap Admin Account - Setup Guide

## 📋 Overview

This guide creates a bootstrap admin account that can log in immediately without requiring approval. This is a **one-time setup** for initial system access.

---

## ⚠️ Prerequisites

- Access to Supabase Dashboard
- SQL Editor access in Supabase
- Admin email address (default: `admin@health.gov.iq`)

---

## 🚀 Step-by-Step Instructions

### **STEP 1: Create User in Supabase Auth**

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Authentication** → **Users**
4. Click **"Add user"** or **"Invite user"**
5. Enter:
   - **Email**: `admin@health.gov.iq` (or your preferred email)
   - **Password**: Choose a strong password (12+ characters, numbers, symbols)
   - **Auto Confirm User**: ✅ Check this box (optional, but recommended)
6. Click **"Create user"** or **"Send invite"**

**⚠️ Important**: Do NOT use the signup UI (`/signup`) for this step. Create the user directly in Supabase Dashboard.

---

### **STEP 2: Run Bootstrap SQL Script**

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **"New query"**
3. Open the file `bootstrap-admin.sql` from this repository
4. **If using a different email**, replace `admin@health.gov.iq` with your email in the script
5. Click **"Run"** or press `Ctrl+Enter`

**Expected Result**: 
- ✅ Query executes successfully
- ✅ One row returned showing admin profile with `role = 'admin'` and `is_approved = true`

---

### **STEP 3: Verify Setup**

Run this verification query in SQL Editor:

```sql
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
```

**Expected Output**:
```
id          | email                  | full_name                    | health_center_name | role  | is_approved | created_at
------------|------------------------|------------------------------|---------------------|-------|-------------|------------
[uuid]      | admin@health.gov.iq    | مدير النظام - دائرة صحة كركوك | إدارة القطاع        | admin | true        | [timestamp]
```

---

### **STEP 4: Test Login**

1. Go to your application login page:
   - Production: `https://health-poster-legend.vercel.app/login`
   - Local: `http://localhost:3000/login`

2. Enter credentials:
   - **Email**: `admin@health.gov.iq`
   - **Password**: (the password you set in Step 1)

3. Click **"تسجيل الدخول"** (Login)

**✅ Expected Result**:
- ✅ Immediate login (no "pending approval" screen)
- ✅ Redirect to `/sector-dashboard` or appropriate admin page
- ✅ Full access to admin features:
  - `/sector-dashboard` - Sector dashboard
  - `/admin/approvals` - User approvals
  - `/admin/audit-log` - Audit logs
  - `/admin/reports` - Reports
  - `/admin/presentation` - Executive presentation
  - `/admin/user-guide` - User guide

---

## 🔒 Security Notes

### ✅ Safe Practices

- ✅ Script is **idempotent** (safe to run multiple times)
- ✅ Only affects the specified admin email
- ✅ Does NOT change behavior for normal users
- ✅ Does NOT weaken security policies
- ✅ Does NOT auto-approve other users

### ❌ What This Does NOT Do

- ❌ Does NOT create users in `auth.users` (must be done manually)
- ❌ Does NOT expose admin creation in UI
- ❌ Does NOT auto-create admins for new signups
- ❌ Does NOT remove approval requirements for `center_user` role

---

## 🛠️ Troubleshooting

### Problem: "Admin user not found in auth.users"

**Solution**: 
- Make sure you created the user in Supabase Dashboard → Authentication → Users first
- Verify the email matches exactly (case-sensitive)
- Check if user was created successfully

### Problem: "Permission denied" when running SQL

**Solution**:
- Ensure you're using the SQL Editor with proper permissions
- Check that RLS policies exist (should be from `supabase-schema.sql`)
- Verify the policy "Users can view own profile" exists

### Problem: Can't log in after setup

**Checklist**:
1. ✅ User exists in `auth.users` table
2. ✅ Profile exists in `profiles` table with `role = 'admin'`
3. ✅ Profile has `is_approved = true`
4. ✅ Password is correct
5. ✅ Email matches exactly (case-sensitive)

**Debug Query**:
```sql
-- Check auth user
SELECT id, email, email_confirmed_at 
FROM auth.users 
WHERE email = 'admin@health.gov.iq';

-- Check profile
SELECT id, email, role, is_approved 
FROM public.profiles 
WHERE email = 'admin@health.gov.iq';
```

### Problem: Still seeing "pending approval" screen

**Solution**:
- Verify `is_approved = true` in profiles table
- Verify `role = 'admin'` in profiles table
- Clear browser cache and cookies
- Check that `ProtectedRoute.tsx` has the admin bypass logic (should be fixed already)

---

## 📝 Manual SQL (Alternative Method)

If you prefer to run SQL manually instead of using the script:

```sql
-- Replace 'admin@health.gov.iq' with your admin email
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
  is_approved
)
SELECT
  id,
  email,
  'مدير النظام - دائرة صحة كركوك',
  'إدارة القطاع',
  'admin',
  true
FROM admin_user
ON CONFLICT (id)
DO UPDATE SET
  role = 'admin',
  is_approved = true,
  health_center_name = 'إدارة القطاع',
  full_name = 'مدير النظام - دائرة صحة كركوك';
```

---

## ✅ Success Checklist

After completing all steps, verify:

- [ ] User created in Supabase Auth
- [ ] Profile created/updated in `profiles` table
- [ ] `role = 'admin'` in profile
- [ ] `is_approved = true` in profile
- [ ] Can log in successfully
- [ ] No "pending approval" screen appears
- [ ] Can access `/sector-dashboard`
- [ ] Can access `/admin/approvals`
- [ ] Can approve/reject user requests
- [ ] Can view audit logs

---

## 🎯 Next Steps (Optional)

After bootstrap admin is working, consider:

1. **Admin Management UI**: Add UI to create/manage admins (future feature)
2. **Audit Log Entry**: Log the bootstrap action in audit_logs
3. **Password Reset**: Set up password reset flow
4. **2FA**: Enable two-factor authentication for admin accounts
5. **Admin Roles**: Implement multiple admin roles (super admin, sector admin, etc.)

---

## 📞 Support

If you encounter issues:

1. Check Supabase Dashboard logs
2. Check browser console for errors
3. Verify RLS policies are correctly configured
4. Review `supabase-schema.sql` for table structure
5. Check `ProtectedRoute.tsx` for approval logic

---

**Last Updated**: 2024
**Version**: 1.0
**Status**: Production-Ready ✅

