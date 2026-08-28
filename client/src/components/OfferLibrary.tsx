import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BadgeCheck, LibraryBig, Loader2, Pencil, RotateCcw, Search, Sparkles, Tag, Timer, Trash2, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type OfferModel = "sprint" | "project" | "retainer";

type EditingOffer = {
  id: number;
  clientName: string;
  sector: string;
  tagsText: string;
  skill: string;
  audience: string;
  outcome: string;
  model: OfferModel;
  title: string;
  promise: string;
  deliverablesText: string;
  timeline: string;
  price: string;
  priceNote: string;
  outreach: string;
  clarityScore: number;
};

function parseStringList(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function parseTags(value: string) {
  return value
    .split(/[،,]/)
    .map((tag) => tag.trim())
    .filter((tag, index, tags) => Boolean(tag) && tags.indexOf(tag) === index)
    .slice(0, 16);
}

const modelLabels: Record<OfferModel, string> = {
  sprint: "سباق مركّز",
  project: "مشروع مُحزّم",
  retainer: "اشتراك شهري",
};

export default function OfferLibrary() {
  const { user, loading, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const offersQuery = trpc.offers.list.useQuery(undefined, { enabled: isAuthenticated });
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState("");
  const [editingOffer, setEditingOffer] = useState<EditingOffer | null>(null);

  const updateOffer = trpc.offers.update.useMutation({
    onSuccess: async () => {
      await utils.offers.list.invalidate();
      toast.success("تم تحديث العرض والوسوم", { description: "انعكست التغييرات في مكتبتك السحابية." });
      setEditingOffer(null);
    },
    onError: () => toast.error("تعذر تحديث العرض الآن. تحقق من الحقول ثم أعد المحاولة."),
  });
  const deleteOffer = trpc.offers.delete.useMutation({
    onSuccess: async () => {
      await utils.offers.list.invalidate();
      toast.success("حُذف العرض من مكتبتك");
    },
    onError: () => toast.error("تعذر حذف العرض الآن. حاول مرة أخرى."),
  });

  const savedOffers = offersQuery.data ?? [];
  const availableTags = savedOffers.reduce((tags, savedOffer) => {
    parseStringList(savedOffer.tagsJson).forEach((tag) => {
      if (!tags.includes(tag)) tags.push(tag);
    });
    return tags;
  }, [] as string[]);
  const normalizedSearch = search.trim().toLocaleLowerCase("ar");
  const visibleOffers = savedOffers.filter((savedOffer) => {
    const tags = parseStringList(savedOffer.tagsJson);
    const searchable = [savedOffer.title, savedOffer.promise, savedOffer.clientName, savedOffer.sector, ...tags].join(" ").toLocaleLowerCase("ar");
    return (!normalizedSearch || searchable.includes(normalizedSearch)) && (!activeTag || tags.includes(activeTag));
  });

  function openEditor(savedOffer: typeof savedOffers[number]) {
    setEditingOffer({
      id: savedOffer.id,
      clientName: savedOffer.clientName,
      sector: savedOffer.sector,
      tagsText: parseStringList(savedOffer.tagsJson).join("، "),
      skill: savedOffer.skill,
      audience: savedOffer.audience,
      outcome: savedOffer.outcome,
      model: savedOffer.model as OfferModel,
      title: savedOffer.title,
      promise: savedOffer.promise,
      deliverablesText: parseStringList(savedOffer.deliverablesJson).join("\n"),
      timeline: savedOffer.timeline,
      price: savedOffer.price,
      priceNote: savedOffer.priceNote,
      outreach: savedOffer.outreach,
      clarityScore: savedOffer.clarityScore,
    });
  }

  function changeEditingOffer(field: keyof EditingOffer, value: string | number) {
    setEditingOffer((current) => current ? { ...current, [field]: value } : current);
  }

  function saveEditedOffer() {
    if (!editingOffer) return;
    const deliverables = editingOffer.deliverablesText.split("\n").map((item) => item.trim()).filter(Boolean);
    if (!deliverables.length) {
      toast.error("أضف بندًا واحدًا على الأقل ضمن تسليمات العرض.");
      return;
    }
    updateOffer.mutate({
      id: editingOffer.id,
      clientName: editingOffer.clientName.trim(),
      sector: editingOffer.sector.trim(),
      tags: parseTags(editingOffer.tagsText),
      skill: editingOffer.skill.trim(),
      audience: editingOffer.audience.trim(),
      outcome: editingOffer.outcome.trim(),
      model: editingOffer.model,
      title: editingOffer.title.trim(),
      promise: editingOffer.promise.trim(),
      deliverables,
      timeline: editingOffer.timeline.trim(),
      price: editingOffer.price.trim(),
      priceNote: editingOffer.priceNote.trim(),
      outreach: editingOffer.outreach.trim(),
      clarityScore: editingOffer.clarityScore,
    });
  }

  return (
    <section id="library" className="relative bg-[#151B35] py-16 sm:py-20">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
        <div className="flex flex-col justify-between gap-5 border-b border-white/10 pb-7 sm:flex-row sm:items-end">
          <div>
            <div className="eyebrow"><LibraryBig className="h-3.5 w-3.5" />مكتبتك السحابية</div>
            <h2 className="mt-3 font-display text-3xl font-extrabold text-white sm:text-4xl">العروض التي بنيتها، مرتبة بطريقتك.</h2>
          </div>
          {isAuthenticated ? <span className="library-account"><BadgeCheck className="h-4 w-4" />{user?.name || "حسابك"} · محفوظة سحابيًا</span> : <button onClick={() => startLogin()} className="button-primary">سجّل الدخول للمكتبة <ArrowLeft className="h-4 w-4" /></button>}
        </div>

        {loading ? <div className="library-loading"><Loader2 className="h-5 w-5 animate-spin" />جارٍ تجهيز مكتبتك…</div> : !isAuthenticated ? <div className="library-empty"><div className="library-icon"><LibraryBig className="h-6 w-6" /></div><div><h3>أنشئ حسابك لتبقى عروضك معك</h3><p>بعد تسجيل الدخول، سيُحفظ كل عرض تختاره في مكتبة خاصة بحسابك ويمكنك الرجوع إليه من أي جهاز.</p></div><button onClick={() => startLogin()} className="library-cta">تسجيل الدخول <ArrowLeft className="h-4 w-4" /></button></div> : offersQuery.isLoading ? <div className="library-loading"><Loader2 className="h-5 w-5 animate-spin" />جارٍ تحميل مكتبتك…</div> : offersQuery.isError ? <div className="library-error">تعذر تحميل عروضك حاليًا. حدّث الصفحة أو أعد المحاولة بعد لحظات.</div> : savedOffers.length ? <><div className="library-toolbar"><label className="library-search"><Search className="h-4 w-4" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ابحث في العروض أو العملاء أو القطاعات…" /></label><div className="tag-filter-row"><button onClick={() => setActiveTag("")} className={activeTag ? "tag-filter" : "tag-filter active"}>الكل <b>{savedOffers.length}</b></button>{availableTags.map((tag) => <button key={tag} onClick={() => setActiveTag(activeTag === tag ? "" : tag)} className={activeTag === tag ? "tag-filter active" : "tag-filter"}><Tag className="h-3 w-3" />{tag}</button>)}</div></div>{visibleOffers.length ? <div className="library-grid">{visibleOffers.map((savedOffer) => <article key={savedOffer.id} className="saved-offer-card"><div className="saved-offer-top"><span className="cloud-stamp"><BadgeCheck className="h-3.5 w-3.5" />محفوظ</span><div className="card-actions"><button onClick={() => openEditor(savedOffer)} className="edit-offer" aria-label={`تعديل ${savedOffer.title}`}><Pencil className="h-4 w-4" /></button><button onClick={() => deleteOffer.mutate({ id: savedOffer.id })} disabled={deleteOffer.isPending} className="delete-offer" aria-label={`حذف ${savedOffer.title}`}><Trash2 className="h-4 w-4" /></button></div></div><h3>{savedOffer.title}</h3><p>{savedOffer.promise}</p>{(savedOffer.clientName || savedOffer.sector) && <div className="client-sector"><span>{savedOffer.clientName || "عميل غير مسمّى"}</span>{savedOffer.sector && <span>{savedOffer.sector}</span>}</div>}{parseStringList(savedOffer.tagsJson).length ? <div className="tag-list">{parseStringList(savedOffer.tagsJson).map((tag) => <button key={tag} onClick={() => setActiveTag(tag)} className="offer-tag"><Tag className="h-3 w-3" />{tag}</button>)}</div> : null}<div className="saved-offer-meta"><span><Timer className="h-3.5 w-3.5" />{savedOffer.timeline}</span><span>{savedOffer.price}</span></div><div className="saved-offer-bottom"><span>{new Date(savedOffer.updatedAt).toLocaleDateString("ar-SA", { day: "numeric", month: "short", year: "numeric" })}</span><span className="score-mini">وضوح {savedOffer.clarityScore}/100</span></div></article>)}</div> : <div className="library-empty compact"><div className="library-icon"><Search className="h-6 w-6" /></div><div><h3>لا توجد عروض مطابقة</h3><p>جرّب مسح البحث أو اختر «الكل» لإظهار جميع عروضك.</p></div><button onClick={() => { setSearch(""); setActiveTag(""); }} className="library-cta">إعادة التصفية <RotateCcw className="h-4 w-4" /></button></div>}</> : <div className="library-empty"><div className="library-icon"><Sparkles className="h-6 w-6" /></div><div><h3>مكتبتك جاهزة لأول عرض</h3><p>أضف العميل والقطاع والوسوم قبل الحفظ لتتمكن من إعادة تنظيم عروضك بسهولة لاحقًا.</p></div><button onClick={() => document.getElementById("tool")?.scrollIntoView({ behavior: "smooth", block: "start" })} className="library-cta">ابنِ عرضًا <ArrowLeft className="h-4 w-4" /></button></div>}
      </div>
      {editingOffer ? <Dialog open onOpenChange={(open) => !open && setEditingOffer(null)}><DialogContent dir="rtl" className="mihnati-dialog max-h-[88vh] max-w-3xl overflow-y-auto border-[#3b4471] bg-[#151B35] p-0 text-[#F5F1EA] sm:rounded-2xl"><DialogHeader className="border-b border-white/10 px-6 py-5 text-right"><div className="flex items-center gap-2 text-xs font-bold text-[#8EF3CA]"><Pencil className="h-3.5 w-3.5" />تعديل العرض المحفوظ</div><DialogTitle className="font-display text-2xl text-white">راجع العرض وصنّفه بطريقتك</DialogTitle><DialogDescription className="text-slate-400">عدّل المحتوى التجاري أو أضف اسم العميل والقطاع والوسوم الخاصة به، ثم احفظ التغيير في حسابك.</DialogDescription></DialogHeader><div className="edit-offer-form px-6 py-5"><div className="edit-grid"><label>عنوان العرض<input value={editingOffer.title} onChange={(event) => changeEditingOffer("title", event.target.value)} /></label><label>المهارة<input value={editingOffer.skill} onChange={(event) => changeEditingOffer("skill", event.target.value)} /></label><label>اسم العميل<input value={editingOffer.clientName} onChange={(event) => changeEditingOffer("clientName", event.target.value)} placeholder="مثال: متجر نواة" /></label><label>القطاع<input value={editingOffer.sector} onChange={(event) => changeEditingOffer("sector", event.target.value)} placeholder="مثال: تجارة إلكترونية" /></label><label className="wide">وسوم مخصصة<input value={editingOffer.tagsText} onChange={(event) => changeEditingOffer("tagsText", event.target.value)} placeholder="إطلاق، عميل مهم، موسمي" /></label><label className="wide">الوعد التجاري<textarea rows={3} value={editingOffer.promise} onChange={(event) => changeEditingOffer("promise", event.target.value)} /></label><label className="wide">النتيجة المطلوبة<textarea rows={2} value={editingOffer.outcome} onChange={(event) => changeEditingOffer("outcome", event.target.value)} /></label><label className="wide">يشمل العرض — بند في كل سطر<textarea rows={4} value={editingOffer.deliverablesText} onChange={(event) => changeEditingOffer("deliverablesText", event.target.value)} /></label><label>المدة<input value={editingOffer.timeline} onChange={(event) => changeEditingOffer("timeline", event.target.value)} /></label><label>السعر<input value={editingOffer.price} onChange={(event) => changeEditingOffer("price", event.target.value)} /></label><label>ملاحظة السعر<input value={editingOffer.priceNote} onChange={(event) => changeEditingOffer("priceNote", event.target.value)} /></label><label>نموذج البيع<select value={editingOffer.model} onChange={(event) => changeEditingOffer("model", event.target.value as OfferModel)}>{Object.entries(modelLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="wide">رسالة التواصل<textarea rows={3} value={editingOffer.outreach} onChange={(event) => changeEditingOffer("outreach", event.target.value)} /></label></div></div><DialogFooter className="border-t border-white/10 px-6 py-4 sm:justify-start"><button onClick={() => setEditingOffer(null)} className="dialog-cancel">إلغاء</button><button onClick={saveEditedOffer} disabled={updateOffer.isPending} className="dialog-save">{updateOffer.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />}حفظ التعديلات</button></DialogFooter></DialogContent></Dialog> : null}
    </section>
  );
}
