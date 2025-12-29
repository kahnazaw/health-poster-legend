-- جدول إحصائيات البوسترات (Poster Analytics)
-- لتتبع أنواع البوسترات الأكثر طلباً

CREATE TABLE IF NOT EXISTS poster_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  campaign_type TEXT NOT NULL,
  target_audience TEXT NOT NULL,
  visual_style TEXT NOT NULL,
  language TEXT NOT NULL CHECK (language IN ('ar', 'tr')),
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE poster_analytics ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own analytics
CREATE POLICY "Users can view own poster analytics"
  ON poster_analytics FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Admins can view all analytics
CREATE POLICY "Admins can view all poster analytics"
  ON poster_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Authenticated users can insert analytics
CREATE POLICY "Authenticated users can insert poster analytics"
  ON poster_analytics FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_poster_analytics_user_id ON poster_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_poster_analytics_campaign_type ON poster_analytics(campaign_type);
CREATE INDEX IF NOT EXISTS idx_poster_analytics_target_audience ON poster_analytics(target_audience);
CREATE INDEX IF NOT EXISTS idx_poster_analytics_visual_style ON poster_analytics(visual_style);
CREATE INDEX IF NOT EXISTS idx_poster_analytics_generated_at ON poster_analytics(generated_at);

