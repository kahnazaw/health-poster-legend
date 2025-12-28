export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-900">
      <h1 className="text-3xl font-bold mb-4">
        المنصة الصحية
      </h1>
      <p className="mb-6 text-gray-600">
        الصفحة الرئيسية تعمل بشكل صحيح
      </p>
      <a
        href="/poster"
        className="px-6 py-2 bg-emerald-600 text-white rounded-lg"
      >
        الذهاب إلى صفحة البوستر
      </a>
    </main>
  );
}
