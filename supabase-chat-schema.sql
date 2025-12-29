/**
 * نظام الدردشة المتكامل لقطاع كركوك الأول
 * يدعم: القناة العامة، الدردشة الخاصة، والمجموعات
 */

-- 1. جدول الغرف (Chat Rooms)
CREATE TABLE IF NOT EXISTS chat_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('public', 'private', 'group')),
    description TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. جدول المشاركين (Participants)
CREATE TABLE IF NOT EXISTS chat_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_read_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(room_id, user_id)
);

-- 3. جدول الرسائل (Messages)
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'poster', 'file', 'link')),
    metadata JSONB, -- للصور، البوسترات، الملفات
    reply_to UUID REFERENCES chat_messages(id) ON DELETE SET NULL,
    is_edited BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. جدول حالة الاتصال (User Presence)
CREATE TABLE IF NOT EXISTS user_presence (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'away', 'offline')),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON chat_messages(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_room ON chat_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user ON chat_participants(user_id);

-- إنشاء القناة العامة الافتراضية
INSERT INTO chat_rooms (id, name, type, description) 
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'القناة العامة - قطاع كركوك الأول',
    'public',
    'القناة العامة لجميع موظفي القطاع الـ 23'
) ON CONFLICT (id) DO NOTHING;

-- Row Level Security Policies
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

-- Policy: يمكن للجميع قراءة الغرف العامة
CREATE POLICY "Anyone can read public rooms" ON chat_rooms FOR SELECT 
    USING (type = 'public');

-- Policy: يمكن للجميع قراءة الغرف التي هم مشاركون فيها
CREATE POLICY "Users can read their rooms" ON chat_rooms FOR SELECT 
    USING (
        type = 'public' OR
        EXISTS (
            SELECT 1 FROM chat_participants 
            WHERE chat_participants.room_id = chat_rooms.id 
            AND chat_participants.user_id = auth.uid()
        )
    );

-- Policy: المديرون يمكنهم إنشاء الغرف
CREATE POLICY "Admins can create rooms" ON chat_rooms FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Policy: يمكن للمشاركين قراءة الرسائل في غرفهم
CREATE POLICY "Participants can read messages" ON chat_messages FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM chat_participants 
            WHERE chat_participants.room_id = chat_messages.room_id 
            AND chat_participants.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM chat_rooms 
            WHERE chat_rooms.id = chat_messages.room_id 
            AND chat_rooms.type = 'public'
        )
    );

-- Policy: يمكن للمشاركين إرسال الرسائل
CREATE POLICY "Participants can send messages" ON chat_messages FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM chat_participants 
            WHERE chat_participants.room_id = chat_messages.room_id 
            AND chat_participants.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM chat_rooms 
            WHERE chat_rooms.id = chat_messages.room_id 
            AND chat_rooms.type = 'public'
        )
    );

-- Policy: يمكن للمستخدمين تحديث رسائلهم الخاصة
CREATE POLICY "Users can update own messages" ON chat_messages FOR UPDATE 
    USING (user_id = auth.uid());

-- Policy: يمكن للمستخدمين حذف رسائلهم الخاصة
CREATE POLICY "Users can delete own messages" ON chat_messages FOR UPDATE 
    USING (user_id = auth.uid());

-- Policy: يمكن للجميع قراءة حالة الاتصال
CREATE POLICY "Anyone can read presence" ON user_presence FOR SELECT 
    USING (true);

-- Policy: يمكن للمستخدمين تحديث حالتهم
CREATE POLICY "Users can update own presence" ON user_presence FOR ALL 
    USING (user_id = auth.uid());

-- دالة لتحديث حالة الاتصال تلقائياً
CREATE OR REPLACE FUNCTION update_user_presence()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_presence (user_id, status, last_seen, updated_at)
    VALUES (NEW.id, 'online', NOW(), NOW())
    ON CONFLICT (user_id) DO UPDATE
    SET status = 'online', last_seen = NOW(), updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger لتحديث الحالة عند تسجيل الدخول (يمكن تفعيله لاحقاً)

-- دالة لإضافة جميع المستخدمين إلى القناة العامة تلقائياً
CREATE OR REPLACE FUNCTION add_users_to_public_room()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO chat_participants (room_id, user_id)
    VALUES ('00000000-0000-0000-0000-000000000001', NEW.id)
    ON CONFLICT (room_id, user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger لإضافة المستخدمين الجدد إلى القناة العامة
CREATE TRIGGER on_user_created_add_to_public_room
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION add_users_to_public_room();
