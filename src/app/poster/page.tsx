"use client";

import { useState, useRef } from "react";
import { toPng } from "html-to-image";

const topics = [
  {
    title: "غسل اليدين",
    message:
      "غسل اليدين بالماء والصابون لمدة 20 ثانية يقي من العديد من الأمراض المعدية ويحافظ على صحتك وصحة من حولك.",
  },
  {
    title: "التغذية الصحية",
    message:
      "اتباع نظام غذائي متوازن غني بالخضروات والفواكه يعزز المناعة ويساهم في الوقاية من الأمراض المزمنة.",
  },
  {
    title: "النشاط البدني",
    message:
      "ممارسة النشاط البدني لمدة 30 دقيقة يوميًا تساعد على تحسين صحة القلب والجسم.",
  },
  {
    title: "الصحة النفسية",
    message:
      "الاهتمام بالصحة النفسية لا يقل أهمية عن الصحة الجسدية، وطلب المساعدة عند الحاجة قوة وليس ضعفًا.",
  },
];

export default function PosterPage() {
  const [selected, setSelected] = useState<number | null>(null);
  const posterRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!posterRef.current) return;

    const dataUrl = await toPng(posterRef.current, {
      pixelRatio: 2,
    });

    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "health-poster.png";
    link.click();
  };

  return (
    <main style={{ padding: 40, background: "#f9fafb", minHeight: "100vh" }}>
      <h1 style={{ textAlign: "center", fontSize: 28, marginBottom: 30 }}>
        إنشاء بوستر توعوي صحي
      </h1>

      {/* المواضيع */}
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {topics.map((t, i) => (
          <div
            key={i}
            onClick={() => setSelected(i)}
            style={{
              border: "1px solid #ccc",
              padding: 20,
              marginBottom: 10,
              cursor: "pointer",
              background: selected === i ? "#e6f7f1" : "#fff",
            }}
          >
            <strong>{t.title}</strong>
            <div style={{ fontSize: 13, color: "#555" }}>
              اضغط لإنشاء رسالة توعوية
            </div>
          </div>
        ))}
      </div>

      {/* البوستر */}
      {selected !== null && (
        <>
          <div
            ref={posterRef}
            style={{
              width: 794,
              minHeight: 1123,
              background: "#fff",
              border: "4px solid #059669",
              margin: "40px auto",
              padding: 60,
              position: "relative",
            }}
          >
            <h2 style={{ textAlign: "center", fontSize: 36, marginBottom: 30 }}>
              {topics[selected].title}
            </h2>

            <p style={{ fontSize: 20, textAlign: "center" }}>
              {topics[selected].message}
            </p>

            <div
              style={{
                position: "absolute",
                bottom: 30,
                left: 0,
                right: 0,
                textAlign: "center",
                fontSize: 12,
                color: "#555",
              }}
            >
              دائرة صحة كركوك – قطاع كركوك الأول – وحدة تعزيز الصحة
            </div>
          </div>

          <div style={{ textAlign: "center" }}>
            <button
              onClick={handleDownload}
              style={{
                padding: "12px 24px",
                fontSize: 16,
                background: "#059669",
                color: "#fff",
                border: "none",
                cursor: "pointer",
              }}
            >
              تحميل البوستر كصورة PNG
            </button>
          </div>
        </>
      )}
    </main>
  );
}
