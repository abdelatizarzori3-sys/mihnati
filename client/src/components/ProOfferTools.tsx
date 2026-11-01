import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { FileDown, LayoutTemplate, Loader2, LockKeyhole, Printer, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export type ProOfferContent = {
  clientName: string;
  sector: string;
  tags: string[];
  skill: string;
  audience: string;
  outcome: string;
  model: "sprint" | "project" | "retainer";
  title: string;
  promise: string;
  deliverables: string[];
  timeline: string;
  price: string;
  priceNote: string;
  outreach: string;
  clarityScore: number;
};

type ProOfferToolsProps = {
  offer: ProOfferContent;
  onApplyTemplate: (template: ProOfferContent) => void;
};

function parseTemplate(dataJson: string): ProOfferContent | null {
  try {
    const value = JSON.parse(dataJson) as Partial<ProOfferContent>;
    if (
      !value ||
      typeof value !== "object" ||
      typeof value.title !== "string" ||
      typeof value.skill !== "string" ||
      !Array.isArray(value.deliverables) ||
      !Array.isArray(value.tags)
    ) {
      return null;
    }
    return value as ProOfferContent;
  } catch {
    return null;
  }
}

function proStatusCopy(state: string | undefined): string {
  switch (state) {
    case "past_due":
      return "تعذر تأكيد استمرار اشتراكك. حدّث وسيلة الدفع بعد تفعيل مزود الاشتراك.";
    case "cancelled":
      return "اشتراكك ملغى؛ تبقى أدوات Pro مغلقة إلى أن يؤكد الخادم اشتراكًا نشطًا.";
    case "expired":
      return "انتهت صلاحية اشتراكك، لذا أُغلقت أدوات Pro تلقائيًا.";
    default:
      return "إعداد شراء الاشتراك داخل التطبيق ما زال مطلوبًا. لن تُفتح الميزة قبل تأكيد اشتراك خادمي.";
  }
}

export default function ProOfferTools({ offer, onApplyTemplate }: ProOfferToolsProps) {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const [templateName, setTemplateName] = useState("");
  const proStatus = trpc.pro.status.useQuery(undefined, { enabled: isAuthenticated });
  const hasPro = Boolean(proStatus.data?.isEntitled);
  const templatesQuery = trpc.offerTemplates.list.useQuery(undefined, { enabled: hasPro });
  const createTemplate = trpc.offerTemplates.create.useMutation({
    onSuccess: async () => {
      setTemplateName("");
      await utils.offerTemplates.list.invalidate();
      toast.success("حُفظ القالب في حسابك", { description: "يمكنك إعادة استعماله في عروضك القادمة." });
    },
    onError: () => toast.error("تعذر حفظ القالب. تأكد من وجود اشتراك محترف نشط ثم أعد المحاولة."),
  });
  const deleteTemplate = trpc.offerTemplates.delete.useMutation({
    onSuccess: async () => {
      await utils.offerTemplates.list.invalidate();
      toast.success("حُذف القالب من حسابك");
    },
    onError: () => toast.error("تعذر حذف القالب الآن."),
  });
  const printDocument = trpc.reports.printDocument.useMutation({
    onError: () => toast.error("تعذر تجهيز التقرير. تتطلب الطباعة اشتراكًا محترفًا نشطًا ومؤكدًا من الخادم."),
  });

  function saveTemplate() {
    const name = templateName.trim();
    if (name.length < 2) {
      toast.error("اكتب اسمًا واضحًا للقالب قبل الحفظ.");
      return;
    }
    createTemplate.mutate({ name, offer });
  }

  function printCurrentOffer() {
    // فتح النافذة أثناء نقرة المستخدم يجنّب حجب النافذة المنبثقة، لكن HTML لا يصلها
    // إلا بعد أن يجيز الخادم الاستحقاق ويعيد تقريرًا مهروب النصوص.
    const printWindow = window.open("", "mihnati-offer-report", "popup,width=900,height=900");
    if (!printWindow) {
      toast.error("سمح متصفحك بحظر نافذة التقرير. اسمح بالنوافذ المنبثقة ثم أعد المحاولة.");
      return;
    }
    printWindow.opener = null;
    printDocument.mutate(offer, {
      onSuccess: ({ html }) => {
        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();
        window.setTimeout(() => {
          printWindow.focus();
          printWindow.print();
        }, 120);
        toast.success("التقرير جاهز للطباعة", { description: "اختر «حفظ كـ PDF» من نافذة الطباعة في متصفحك." });
      },
      onError: () => printWindow.close(),
    });
  }

  return (
    <section className="pro-offer-tools" aria-live="polite">
      <div className="pro-offer-heading">
        <div className="pro-offer-icon"><Sparkles className="h-4 w-4" /></div>
        <div><span>مِهنتي محترف</span><h4>قوالبك الشخصية وتقرير قابل للطباعة</h4></div>
      </div>

      {!isAuthenticated ? (
        <div className="pro-offer-locked"><LockKeyhole className="h-4 w-4" /><p>سجّل دخولك أولًا للتحقق من اشتراكك قبل استخدام القوالب أو تصدير PDF.</p><button onClick={startLogin}>تسجيل الدخول</button></div>
      ) : proStatus.isLoading ? (
        <div className="pro-offer-loading"><Loader2 className="h-4 w-4 animate-spin" />جارٍ التحقق من الاستحقاق عبر الخادم…</div>
      ) : hasPro ? (
        <div className="pro-offer-active">
          <div className="template-save-row"><label><span>اسم القالب</span><input value={templateName} maxLength={80} onChange={(event) => setTemplateName(event.target.value)} placeholder="مثال: متجر تجزئة — إطلاق سريع" /></label><button onClick={saveTemplate} disabled={createTemplate.isPending}><LayoutTemplate className="h-4 w-4" />حفظ القالب</button></div>
          <div className="pro-template-list">
            {templatesQuery.isLoading ? <div className="pro-offer-loading"><Loader2 className="h-4 w-4 animate-spin" />جارٍ تحميل القوالب…</div> : templatesQuery.isError ? <p className="pro-inline-error">تعذر تحميل القوالب الآن. لم تُعرض أي نسخة مخزنة محليًا بدلًا من بيانات حسابك.</p> : templatesQuery.data?.length ? templatesQuery.data.map((template) => {
              const content = parseTemplate(template.dataJson);
              return <article className="pro-template-card" key={template.id}><div><strong>{template.name}</strong><span>{content?.title || "قالب غير قابل للقراءة"}</span></div><div><button disabled={!content} onClick={() => content && onApplyTemplate(content)}>استخدمه</button><button className="pro-template-delete" disabled={deleteTemplate.isPending} onClick={() => deleteTemplate.mutate({ id: template.id })} aria-label={`حذف قالب ${template.name}`}><Trash2 className="h-4 w-4" /></button></div></article>;
            }) : <p className="pro-empty-templates">احفظ العرض الحالي كقالب لتبدأ مكتبتك الشخصية.</p>}
          </div>
          <button onClick={printCurrentOffer} disabled={printDocument.isPending} className="pro-print-button">{printDocument.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}طباعة التقرير أو حفظ PDF <FileDown className="h-4 w-4" /></button>
        </div>
      ) : (
        <div className="pro-offer-locked"><LockKeyhole className="h-4 w-4" /><div><p>{proStatusCopy(proStatus.data?.state)}</p><small>لا يعتمد الإغلاق على الجهاز أو رابط العودة أو التخزين المحلي.</small></div><button disabled title="يتطلب إعداد مزود الدفع والقناة">إعداد الشراء مطلوب</button></div>
      )}
    </section>
  );
}
