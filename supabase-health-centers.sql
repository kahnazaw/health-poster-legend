/**
 * جدول المراكز الصحية الـ 23 لقطاع كركوك الأول
 */

CREATE TABLE IF NOT EXISTS health_centers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    center_name TEXT NOT NULL UNIQUE, -- الاسم الرسمي للمركز
    center_code TEXT UNIQUE, -- رمز المركز (اختياري)
    sector TEXT DEFAULT 'قطاع كركوك الأول',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إدراج المراكز الـ 23 (أمثلة - يجب تحديثها بالأسماء الرسمية)
INSERT INTO health_centers (center_name, center_code) VALUES
('مركز صحي الحويجة', 'HC001'),
('مركز صحي الدبس', 'HC002'),
('مركز صحي الرشيد', 'HC003'),
('مركز صحي الشورجة', 'HC004'),
('مركز صحي العباسي', 'HC005'),
('مركز صحي الزاب', 'HC006'),
('مركز صحي المفتي', 'HC007'),
('مركز صحي النور', 'HC008'),
('مركز صحي السلام', 'HC009'),
('مركز صحي الوحدة', 'HC010'),
('مركز صحي الشهداء', 'HC011'),
('مركز صحي الحرية', 'HC012'),
('مركز صحي الكرامة', 'HC013'),
('مركز صحي الفتح', 'HC014'),
('مركز صحي النصر', 'HC015'),
('مركز صحي التحرير', 'HC016'),
('مركز صحي الاستقلال', 'HC017'),
('مركز صحي الجمهورية', 'HC018'),
('مركز صحي الشعب', 'HC019'),
('مركز صحي العروبة', 'HC020'),
('مركز صحي الوحدة العربية', 'HC021'),
('مركز صحي التضامن', 'HC022'),
('مركز صحي التعاون', 'HC023')
ON CONFLICT (center_name) DO NOTHING;

-- تحديث جدول profiles لإضافة health_center_id
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS health_center_id UUID REFERENCES health_centers(id) ON DELETE SET NULL;

-- Row Level Security
ALTER TABLE health_centers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read health centers" ON health_centers FOR SELECT USING (true);

CREATE POLICY "Admins can manage health centers" ON health_centers FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

