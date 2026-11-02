export type PrintableOffer = {
  clientName: string;
  sector: string;
  skill: string;
  audience: string;
  outcome: string;
  title: string;
  promise: string;
  deliverables: string[];
  timeline: string;
  price: string;
  priceNote: string;
  outreach: string;
  clarityScore: number;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/**
 * ينشئ وثيقة مستقلة للطباعة محليًا في المتصفح. كل نص صادر من المستخدم يهرب
 * قبل إدخاله في HTML، ولا تحتوي الوثيقة على روابط تخزين خاصة أو مفاتيح أو سكربتات.
 */
export function renderOfferPrintDocument(offer: PrintableOffer, generatedAt = new Date()): string {
  const reportDate = generatedAt.toISOString().slice(0, 10);
  const clientContext = [offer.clientName, offer.sector].filter(Boolean).map(escapeHtml).join(" · ") || "عرض خدمة مخصص";
  const deliverables = offer.deliverables.map(item => `<li>${escapeHtml(item)}</li>`).join("");

  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(offer.title)} — تقرير مِهنتي</title>
  <style>
    @page { size: A4; margin: 15mm; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #17192c; background: #fff; font-family: "IBM Plex Sans Arabic", Tahoma, Arial, sans-serif; line-height: 1.75; }
    .report { max-width: 180mm; margin: 0 auto; }
    .masthead { display: flex; justify-content: space-between; gap: 16px; border-bottom: 3px solid #8b7cff; padding-bottom: 18px; }
    .brand { color: #6a5cd4; font-size: 13px; font-weight: 800; letter-spacing: .06em; }
    .date { color: #6d6e78; font-size: 12px; text-align: left; }
    .context { margin: 27px 0 10px; color: #6a5cd4; font-size: 13px; font-weight: 800; }
    h1 { margin: 0; max-width: 150mm; font-size: 30px; line-height: 1.35; }
    .promise { margin: 16px 0 25px; color: #42434e; font-size: 16px; }
    .summary { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; overflow: hidden; border: 1px solid #ded8ed; border-radius: 12px; background: #ded8ed; }
    .summary div { min-height: 82px; background: #faf9ff; padding: 15px; }
    .label { display: block; color: #716b83; font-size: 11px; font-weight: 800; }
    .value { display: block; margin-top: 5px; color: #1e2030; font-size: 15px; font-weight: 700; }
    section { margin-top: 28px; }
    h2 { margin: 0 0 10px; color: #6a5cd4; font-size: 14px; font-weight: 800; }
    ul { margin: 0; padding-right: 22px; }
    li { margin: 7px 0; }
    .note { border-right: 4px solid #8ef3ca; background: #f1fbf6; padding: 14px 16px; color: #28483c; white-space: pre-wrap; }
    .foot { margin-top: 32px; border-top: 1px solid #dddde5; padding-top: 12px; color: #777987; font-size: 10px; }
    @media print { .report { max-width: none; } }
  </style>
</head>
<body>
  <main class="report">
    <header class="masthead"><div class="brand">مِهنتي · تقرير عرض خدمة</div><div class="date">تاريخ التقرير: ${reportDate} UTC</div></header>
    <p class="context">${clientContext}</p>
    <h1>${escapeHtml(offer.title)}</h1>
    <p class="promise">${escapeHtml(offer.promise)}</p>
    <div class="summary">
      <div><span class="label">الخدمة</span><span class="value">${escapeHtml(offer.skill)}</span></div>
      <div><span class="label">الجمهور</span><span class="value">${escapeHtml(offer.audience)}</span></div>
      <div><span class="label">المدة</span><span class="value">${escapeHtml(offer.timeline)}</span></div>
      <div><span class="label">الاستثمار</span><span class="value">${escapeHtml(offer.price)} <small>${escapeHtml(offer.priceNote)}</small></span></div>
    </div>
    <section><h2>النتيجة المطلوبة</h2><p>${escapeHtml(offer.outcome)}</p></section>
    <section><h2>ما يشمله العرض</h2><ul>${deliverables}</ul></section>
    <section><h2>رسالة بدء المحادثة</h2><p class="note">${escapeHtml(offer.outreach)}</p></section>
    <footer class="foot">مؤشر وضوح العرض: ${offer.clarityScore}/100 · الأسعار والمؤشرات تعليمية وليست ضمانًا للدخل أو النتائج التجارية.</footer>
  </main>
</body>
</html>`;
}
