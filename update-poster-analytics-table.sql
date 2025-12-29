-- تحديث جدول poster_analytics لإضافة الحقول المطلوبة للمعرض
-- Run this SQL in Supabase SQL Editor

-- إضافة الحقول الجديدة
ALTER TABLE poster_analytics 
ADD COLUMN IF NOT EXISTS suggested_title TEXT,
ADD COLUMN IF NOT EXISTS prompt TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS download_count INTEGER DEFAULT 0;

-- إنشاء دالة لتحديث عداد التحميلات
CREATE OR REPLACE FUNCTION increment_poster_download(poster_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE poster_analytics
  SET download_count = COALESCE(download_count, 0) + 1
  WHERE id = poster_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- تحديث السياسات للسماح بقراءة جميع البوسترات للمستخدمين المصرح لهم
DROP POLICY IF EXISTS "Users can view own poster analytics" ON poster_analytics;
DROP POLICY IF EXISTS "Admins can view all poster analytics" ON poster_analytics;

-- Policy: جميع المستخدمين المصرح لهم يمكنهم رؤية جميع البوسترات (للمعرض)
CREATE POLICY "Authenticated users can view all poster analytics"
  ON poster_analytics FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Policy: Admins can view all analytics (keep for admin-specific queries)
CREATE POLICY "Admins can view all poster analytics"
  ON poster_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

