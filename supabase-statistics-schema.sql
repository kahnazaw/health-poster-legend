/**
 * نظام الإحصائيات الميدانية لقطاع كركوك الأول
 * بناءً على نموذج الإحصائية الرسمي
 */

-- 1. جدول المواضيع الصحية (مستوحى من ملف الإحصائية)
CREATE TABLE IF NOT EXISTS health_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_name TEXT NOT NULL, -- رعاية الأم والطفل، التحصين، إلخ
    topic_name TEXT NOT NULL,
    display_order INTEGER DEFAULT 0, -- ترتيب العرض
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. جدول الإحصائيات اليومية
CREATE TABLE IF NOT EXISTS daily_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    center_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES health_topics(id) ON DELETE CASCADE,
    individual_meetings INTEGER DEFAULT 0, -- اللقاءات الفردية
    lectures INTEGER DEFAULT 0,           -- المحاضرات
    seminars INTEGER DEFAULT 0,            -- الندوات
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT, -- ملاحظات إضافية
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, topic_id, entry_date) -- منع الإدخال المتكرر لنفس اليوم
);

-- 3. جدول تقييم المراكز (Smart Evaluation)
CREATE TABLE IF NOT EXISTS center_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    center_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    score DECIMAL(5, 2), -- النقاط (0-100)
    period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly')),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_meetings INTEGER DEFAULT 0,
    total_lectures INTEGER DEFAULT 0,
    total_seminars INTEGER DEFAULT 0,
    evaluation_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. جدول التقارير الآلية
CREATE TABLE IF NOT EXISTS automated_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_type TEXT NOT NULL CHECK (report_type IN ('weekly', 'monthly')),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    generated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    pdf_url TEXT, -- رابط ملف PDF
    excel_url TEXT, -- رابط ملف Excel
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'generated', 'sent')),
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_daily_statistics_user_date ON daily_statistics(user_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_daily_statistics_topic_date ON daily_statistics(topic_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_center_evaluations_center_period ON center_evaluations(center_id, period_type, period_start);
CREATE INDEX IF NOT EXISTS idx_automated_reports_type_period ON automated_reports(report_type, period_start);

-- إدراج المواضيع الـ 11 الرسمية من ملف الإحصائية
INSERT INTO health_topics (category_name, topic_name, display_order) VALUES
('رعاية الأم والطفل', 'فحص ما قبل الزواج', 1),
('رعاية الأم والطفل', 'رعاية الحامل المعرضة للخطورة', 2),
('رعاية الأم والطفل', 'متابعة الحمل', 3),
('التحصين', 'لقاح الأطفال الروتيني', 4),
('التحصين', 'الحملات التلقيحية', 5),
('الأمراض الانتقالية', 'الأنفلونزا الوبائية', 6),
('الأمراض الانتقالية', 'الكوليرا', 7),
('الأمراض غير الانتقالية', 'السكري', 8),
('الأمراض غير الانتقالية', 'ارتفاع ضغط الدم', 9),
('الصحة النفسية', 'الصحة النفسية للشباب', 10),
('الصحة النفسية', 'الصحة النفسية للمرأة', 11)
ON CONFLICT DO NOTHING;

-- Row Level Security Policies
ALTER TABLE health_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE center_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE automated_reports ENABLE ROW LEVEL SECURITY;

-- Policy: جميع المستخدمين يمكنهم قراءة المواضيع
CREATE POLICY "Anyone can read health topics" ON health_topics FOR SELECT USING (true);

-- Policy: المستخدمون يمكنهم إدخال إحصائياتهم فقط
CREATE POLICY "Users can insert own statistics" ON daily_statistics FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own statistics" ON daily_statistics FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own statistics" ON daily_statistics FOR UPDATE 
    USING (auth.uid() = user_id);

-- Policy: المديرون يمكنهم قراءة جميع الإحصائيات
CREATE POLICY "Admins can read all statistics" ON daily_statistics FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Policy: المديرون يمكنهم قراءة جميع التقييمات
CREATE POLICY "Admins can read all evaluations" ON center_evaluations FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Policy: المديرون يمكنهم إنشاء التقارير
CREATE POLICY "Admins can manage reports" ON automated_reports FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- دالة لحساب النقاط التلقائي
CREATE OR REPLACE FUNCTION calculate_center_score(
    p_center_id UUID,
    p_period_start DATE,
    p_period_end DATE
) RETURNS DECIMAL AS $$
DECLARE
    v_total_meetings INTEGER;
    v_total_lectures INTEGER;
    v_total_seminars INTEGER;
    v_score DECIMAL;
BEGIN
    -- جمع الإحصائيات للفترة المحددة
    SELECT 
        COALESCE(SUM(individual_meetings), 0),
        COALESCE(SUM(lectures), 0),
        COALESCE(SUM(seminars), 0)
    INTO v_total_meetings, v_total_lectures, v_total_seminars
    FROM daily_statistics
    WHERE center_id = p_center_id
    AND entry_date BETWEEN p_period_start AND p_period_end;
    
    -- حساب النقاط (كل محاضرة = 2 نقطة، كل ندوة = 3 نقاط، كل لقاء = 1 نقطة)
    v_score := (v_total_meetings * 1) + (v_total_lectures * 2) + (v_total_seminars * 3);
    
    -- تطبيع النقاط إلى 0-100
    v_score := LEAST(v_score / 10, 100);
    
    RETURN v_score;
END;
$$ LANGUAGE plpgsql;

-- دالة لمنع الإدخال المتكرر
CREATE OR REPLACE FUNCTION prevent_duplicate_entry()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM daily_statistics
        WHERE user_id = NEW.user_id
        AND topic_id = NEW.topic_id
        AND entry_date = NEW.entry_date
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
    ) THEN
        RAISE EXCEPTION 'تم إدخال بيانات هذا الموضوع لهذا اليوم مسبقاً';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger لمنع الإدخال المتكرر
CREATE TRIGGER check_duplicate_entry
BEFORE INSERT OR UPDATE ON daily_statistics
FOR EACH ROW
EXECUTE FUNCTION prevent_duplicate_entry();

