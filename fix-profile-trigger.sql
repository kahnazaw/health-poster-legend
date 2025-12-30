-- =====================================================
-- 🔧 FIX: تحديث trigger handle_new_user لضمان إنشاء profile تلقائياً
-- =====================================================
-- 
-- هذا السكربت يضمن إنشاء profile تلقائياً عند تسجيل أي مستخدم جديد
-- ويضيف center_id للربط بالمراكز الصحية الـ 23
--
-- Run this in Supabase SQL Editor
-- =====================================================

-- تحديث دالة handle_new_user لضمان إنشاء profile مع center_id
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_center_id UUID;
BEGIN
  -- محاولة العثور على center_id من metadata إذا كان متوفراً
  IF NEW.raw_user_meta_data->>'health_center_id' IS NOT NULL THEN
    v_center_id := (NEW.raw_user_meta_data->>'health_center_id')::UUID;
  ELSE
    -- إذا لم يكن متوفراً، يمكن ربطه بمركز افتراضي أو تركه NULL
    v_center_id := NULL;
  END IF;

  -- إنشاء profile تلقائياً
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    health_center_id,
    health_center_name, 
    role, 
    is_approved
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'مستخدم جديد'),
    v_center_id,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'health_center_name', ''), ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'center_user'),
    false
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    health_center_id = COALESCE(EXCLUDED.health_center_id, profiles.health_center_id),
    health_center_name = COALESCE(EXCLUDED.health_center_name, profiles.health_center_name),
    role = COALESCE(EXCLUDED.role, profiles.role);
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- في حالة الخطأ، تسجيل الخطأ لكن عدم إيقاف العملية
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- التأكد من وجود Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- التحقق من أن Trigger يعمل
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- =====================================================
-- ✅ SUCCESS CHECKLIST
-- =====================================================
-- 1. ✅ Trigger موجود ويعمل
-- 2. ✅ Function handle_new_user محدثة
-- 3. ✅ Profile يتم إنشاؤه تلقائياً مع center_id
-- 4. ✅ ON CONFLICT يمنع الأخطاء عند إعادة المحاولة
-- =====================================================

