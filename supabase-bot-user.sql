/**
 * إنشاء مستخدم آلي (Bot User) للمساعد الإداري الذكي
 */

-- إنشاء مستخدم آلي في auth.users (يجب تنفيذه يدوياً في Supabase Dashboard أو عبر API)
-- Email: bot@kirkuk-health.gov.iq
-- Password: (يتم إنشاؤه تلقائياً)

-- بعد إنشاء المستخدم في auth.users، قم بتشغيل هذا السكربت:

-- إدراج ملف تعريف للمساعد
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
    'bot@kirkuk-health.gov.iq',
    'مساعد قطاع كركوك الأول',
    'إدارة القطاع',
    'admin',
    true
FROM auth.users
WHERE email = 'bot@kirkuk-health.gov.iq'
ON CONFLICT (id) DO UPDATE
SET 
    full_name = 'مساعد قطاع كركوك الأول',
    role = 'admin',
    is_approved = true;

-- إضافة المساعد إلى القناة العامة
INSERT INTO chat_participants (room_id, user_id, role)
SELECT 
    '00000000-0000-0000-0000-000000000001',
    id,
    'admin'
FROM auth.users
WHERE email = 'bot@kirkuk-health.gov.iq'
ON CONFLICT (room_id, user_id) DO NOTHING;

-- جدول إعدادات المساعد
CREATE TABLE IF NOT EXISTS bot_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bot_enabled BOOLEAN DEFAULT true,
    response_mode TEXT DEFAULT 'auto' CHECK (response_mode IN ('auto', 'manual', 'hybrid')),
    knowledge_base JSONB DEFAULT '{}',
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إدراج إعدادات افتراضية
INSERT INTO bot_settings (id, bot_enabled, response_mode)
VALUES ('00000000-0000-0000-0000-000000000002', true, 'auto')
ON CONFLICT (id) DO NOTHING;

-- Row Level Security
ALTER TABLE bot_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage bot settings" ON bot_settings FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

