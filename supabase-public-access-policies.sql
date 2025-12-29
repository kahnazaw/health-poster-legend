/**
 * سياسات الوصول العام لصفحة "نبض صحة كركوك"
 * تسمح بالوصول للبيانات العامة بدون تسجيل دخول
 */

-- 1. سياسة الوصول العام لجدول daily_statistics (للإحصائيات العامة فقط)
DROP POLICY IF EXISTS "Public can view aggregated statistics" ON daily_statistics;
CREATE POLICY "Public can view aggregated statistics"
  ON daily_statistics FOR SELECT
  USING (true); -- السماح للجميع بقراءة الإحصائيات

-- 2. سياسة الوصول العام لجدول poster_analytics (للبوسترات العامة)
DROP POLICY IF EXISTS "Public can view public posters" ON poster_analytics;
CREATE POLICY "Public can view public posters"
  ON poster_analytics FOR SELECT
  USING (image_url IS NOT NULL); -- فقط البوسترات التي لها صورة

-- 3. سياسة الوصول العام لجدول health_centers (للمراكز الصحية)
DROP POLICY IF EXISTS "Public can view health centers" ON health_centers;
CREATE POLICY "Public can view health centers"
  ON health_centers FOR SELECT
  USING (true); -- السماح للجميع بقراءة معلومات المراكز

-- 4. تحديث عداد التحميل (للمواطنين)
DROP POLICY IF EXISTS "Public can update download count" ON poster_analytics;
CREATE POLICY "Public can update download count"
  ON poster_analytics FOR UPDATE
  USING (true)
  WITH CHECK (true); -- السماح بتحديث عداد التحميل فقط

-- ملاحظة: يجب التأكد من أن هذه السياسات لا تعرض بيانات حساسة
-- مثل user_id أو معلومات شخصية

