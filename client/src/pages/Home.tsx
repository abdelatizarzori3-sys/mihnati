/**
 * مِهنتي — غرفة القرار: صفحة أداة RTL بطابع تحريري وتقني.
 * المبدأ: وضوح تجاري، كحلي حِبري، بنفسجي قرار، وأوراق عروض عاجية متداخلة.
 */
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import OfferLibrary from "@/components/OfferLibrary";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowUpLeft,
  BadgeCheck,
  Check,
  ChevronLeft,
  Copy,
  Download,
  FileText,
  Flame,
  Layers3,
  LibraryBig,
  Loader2,
  LogOut,
  Menu,
  MoveLeft,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Send,
  Sparkles,
  Tag,
  Target,
  Timer,
  Trash2,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";
import { toast } from "sonner";

type OfferModel = "sprint" | "project" | "retainer";

type OfferData = {
  title: string;
  promise: string;
  includes: string[];
  timeline: string;
  price: string;
  priceNote: string;
  outreach: string;
};

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

const audiences = [
  "متاجر إلكترونية ناشئة",
  "شركات خدمات محلية",
  "صناع محتوى وخبراء",
  "شركات SaaS صغيرة",
  "مطاعم ومقاهٍ مستقلة",
  "فرق تسويق داخلية",
];

const initialOffer: OfferData = {
  title: "باقة هوية المتجر الواضحة",
  promise: "نحوّل حضور متجرك من مبعثر إلى علامة يثق بها العميل من النظرة الأولى.",
  includes: ["جلسة تحديد اتجاه العلامة", "لوحة هوية مرئية مركزة", "حزمة منشورات إطلاق", "دليل تطبيق مختصر"],
  timeline: "7 أيام عمل",
  price: "1,850 ر.س",
  priceNote: "سعر مشروع ثابت · دفعتان",
  outreach:
    "مرحبًا، لاحظت أن حضور متجركم يمكن أن يبدو أكثر اتساقًا عند نقطة الشراء. أقدّم باقة مركزة تُرتّب الهوية البصرية وحزمة الإطلاق خلال 7 أيام. هل أرسل لكم نموذج النتائج؟",
};

const modelContent: Record<OfferModel, { label: string; timeline: string; multiplier: number; tag: string }> = {
  sprint: { label: "سباق مركّز", timeline: "3 أيام عمل", multiplier: 0.72, tag: "للنتيجة السريعة" },
  project: { label: "مشروع مُحزّم", timeline: "7 أيام عمل", multiplier: 1, tag: "الأكثر توازنًا" },
  retainer: { label: "اشتراك شهري", timeline: "30 يومًا", multiplier: 1.65, tag: "لدخل متكرر" },
};

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function buildOffer(skill: string, audience: string, outcome: string, model: OfferModel): OfferData {
  const cleanSkill = skill.trim() || "خبرتك الرقمية";
  const cleanAudience = audience || "العملاء المناسبين";
  const cleanOutcome = outcome.trim() || "تحسين حضورهم وتحويل اهتمامهم إلى طلبات أوضح";
  const config = modelContent[model];
  const basePrice = cleanSkill.length > 18 ? 2400 : 1850;
  const proposedPrice = Math.round((basePrice * config.multiplier) / 50) * 50;
  const offerTitle = model === "retainer" ? `نظام ${cleanSkill} الشهري` : `باقة ${cleanSkill} المركّزة`;

  return {
    title: offerTitle,
    promise: `أساعد ${cleanAudience} على ${cleanOutcome} عبر خدمة ${cleanSkill} بنطاق واضح وتسليم قابل للقياس.`,
    includes:
      model === "retainer"
        ? ["خطة شهرية ذات أولوية", "تنفيذ أسبوعي متفق عليه", "مراجعة أداء مختصرة", "مسار طلبات واضح"]
        : ["جلسة فهم سريعة", `تنفيذ ${cleanSkill} ضمن نطاق محدد`, "مراجعة واحدة محسوبة", "تسليم مرتب وجاهز للاستخدام"],
    timeline: config.timeline,
    price: `${proposedPrice.toLocaleString("en-US")} ر.س`,
    priceNote: model === "retainer" ? "اشتراك شهري · تجدد مرن" : "سعر مشروع ثابت · دفعتان",
    outreach: `مرحبًا، رأيت أن ${cleanAudience} يمكنهم ${cleanOutcome} بصورة أوضح. أقدّم ${offerTitle}؛ خدمة محددة تشمل نتيجة قابلة للتنفيذ خلال ${config.timeline}. هل أرسل لكم ملخص الباقة؟`,
  };
}

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

export default function Home() {
  const { user, loading: authLoading, isAuthenticated, logout } = useAuth();
  const utils = trpc.useUtils();
  const savedOffersQuery = trpc.offers.list.useQuery(undefined, { enabled: isAuthenticated });
  const createOffer = trpc.offers.create.useMutation({
    onSuccess: async () => {
      await utils.offers.list.invalidate();
      toast.success("حُفظ العرض في حسابك", { description: "يمكنك العودة إليه من مكتبتك في أي وقت." });
    },
    onError: () => toast.error("تعذر حفظ العرض الآن. حاول مرة أخرى."),
  });
  const deleteOffer = trpc.offers.delete.useMutation({
    onSuccess: async () => {
      await utils.offers.list.invalidate();
      toast.success("حُذف العرض من مكتبتك");
    },
    onError: () => toast.error("تعذر حذف العرض الآن. حاول مرة أخرى."),
  });
  const updateOffer = trpc.offers.update.useMutation({
    onSuccess: async () => {
      await utils.offers.list.invalidate();
      toast.success("تم تحديث العرض والوسوم", { description: "انعكست التغييرات في مكتبتك السحابية." });
    },
    onError: () => toast.error("تعذر تحديث العرض الآن. تحقق من الحقول ثم أعد المحاولة."),
  });

  const [skill, setSkill] = useState("تصميم الهوية البصرية");
  const [audience, setAudience] = useState(audiences[0]);
  const [outcome, setOutcome] = useState("الظهور بشكل احترافي وتحويل الزوار إلى مشترين");
  const [model, setModel] = useState<OfferModel>("project");
  const [offer, setOffer] = useState<OfferData>(initialOffer);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [clientName, setClientName] = useState("");
  const [sector, setSector] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [librarySearch, setLibrarySearch] = useState("");
  const [activeTag, setActiveTag] = useState("");
  const [editingOffer, setEditingOffer] = useState<EditingOffer | null>(null);
  const offerScore = Math.min(100, 63 + (skill.trim().length > 4 ? 12 : 0) + (outcome.trim().length > 14 ? 13 : 0) + (model === "retainer" ? 5 : 0));
  const savedOffers = savedOffersQuery.data ?? [];
  const availableTags = savedOffers.reduce((tags, savedOffer) => {
    parseStringList(savedOffer.tagsJson).forEach((tag) => {
      if (!tags.includes(tag)) tags.push(tag);
    });
    return tags;
  }, [] as string[]);
  const normalizedSearch = librarySearch.trim().toLocaleLowerCase("ar");
  const visibleOffers = savedOffers.filter((savedOffer) => {
    const tags = parseStringList(savedOffer.tagsJson);
    const searchable = [savedOffer.title, savedOffer.promise, savedOffer.clientName, savedOffer.sector, ...tags].join(" ").toLocaleLowerCase("ar");
    return (!normalizedSearch || searchable.includes(normalizedSearch)) && (!activeTag || tags.includes(activeTag));
  });

  function generateOffer() {
    const nextOffer = buildOffer(skill, audience, outcome, model);
    setOffer(nextOffer);
    setHasGenerated(true);
    toast.success("تم بناء عرضك", { description: "عدّل الحقول وأعد التوليد متى أردت." });
  }

  async function copyText(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`تم نسخ ${label}`);
    } catch {
      toast.error("تعذر النسخ تلقائيًا. انسخ النص يدويًا.");
    }
  }

  function downloadOffer() {
    const content = `# ${offer.title}\n\n## الوعد\n${offer.promise}\n\n## ما يشمله العرض\n${offer.includes.map((item) => `- ${item}`).join("\n")}\n\n## المدة\n${offer.timeline}\n\n## الاستثمار\n${offer.price} — ${offer.priceNote}\n\n## رسالة التواصل\n${offer.outreach}\n`;
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = "mihnati-offer.md";
    link.click();
    URL.revokeObjectURL(href);
    toast.success("تم تجهيز ملف العرض للتنزيل");
  }

  function saveOffer() {
    if (!isAuthenticated) {
      toast.info("سجّل دخولك لحفظ عروضك سحابيًا");
      startLogin();
      return;
    }

    createOffer.mutate({
      clientName: clientName.trim(),
      sector: sector.trim(),
      tags: parseTags(tagsText),
      skill,
      audience,
      outcome,
      model,
      title: offer.title,
      promise: offer.promise,
      deliverables: offer.includes,
      timeline: offer.timeline,
      price: offer.price,
      priceNote: offer.priceNote,
      outreach: offer.outreach,
      clarityScore: offerScore,
    });
  }

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

  function updateEditingOffer(field: keyof EditingOffer, value: string | number) {
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
    }, { onSuccess: () => setEditingOffer(null) });
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[#11162C] text-[#F5F1EA]" dir="rtl">
      <header className="relative z-30 border-b border-white/10 bg-[#11162C]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-4 sm:px-8 lg:px-12">
          <button className="brand-lockup" onClick={() => scrollToSection("top")} aria-label="العودة إلى بداية الصفحة">
            <img src="/manus-storage/mihnati-logo-mark_d0ba8924.png" alt="رمز مِهنتي" className="h-10 w-10 object-contain" />
            <span className="font-display text-2xl font-extrabold tracking-tight">مِهنتي</span>
          </button>

          <nav className="hidden items-center gap-7 text-sm font-medium text-slate-300 lg:flex" aria-label="التنقل الرئيسي">
            <button onClick={() => scrollToSection("tool")} className="nav-link">صانع العروض</button>
            <button onClick={() => scrollToSection("library")} className="nav-link">مكتبتي</button>
            <button onClick={() => scrollToSection("method")} className="nav-link">كيف يعمل</button>
            <button onClick={() => scrollToSection("business")} className="nav-link">نموذج الربح</button>
          </nav>

          <div className="hidden items-center gap-3 sm:flex">
            {authLoading ? <Loader2 className="h-4 w-4 animate-spin text-slate-400" /> : isAuthenticated ? <><button onClick={() => scrollToSection("library")} className="account-pill"><UserRound className="h-3.5 w-3.5" />{user?.name || "حسابي"}</button><button onClick={() => logout()} className="logout-button" title="تسجيل الخروج"><LogOut className="h-4 w-4" /></button></> : <button onClick={() => startLogin()} className="button-primary text-sm">تسجيل الدخول للحفظ <ArrowLeft className="h-4 w-4" /></button>}
          </div>
          <button onClick={() => setIsMenuOpen((open) => !open)} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white lg:hidden" aria-label="فتح القائمة">
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {isMenuOpen && <div className="border-t border-white/10 bg-[#161C36] px-5 py-4 lg:hidden"><div className="mx-auto flex max-w-[1440px] flex-col gap-2"><button onClick={() => scrollToSection("tool")} className="mobile-nav-link">صانع العروض</button><button onClick={() => scrollToSection("library")} className="mobile-nav-link">مكتبتي</button><button onClick={() => scrollToSection("method")} className="mobile-nav-link">كيف يعمل</button><button onClick={() => scrollToSection("business")} className="mobile-nav-link">نموذج الربح</button>{isAuthenticated ? <button onClick={() => logout()} className="mobile-nav-link text-[#8EF3CA]">تسجيل الخروج</button> : <button onClick={() => startLogin()} className="mobile-nav-link text-[#8EF3CA]">تسجيل الدخول للحفظ</button>}</div></div>}
      </header>

      <main id="top" className="relative">
        <div className="decision-thread" aria-hidden="true">
          <span className="decision-node node-one">01</span>
          <span className="decision-node node-two">02</span>
          <span className="decision-node node-three">03</span>
        </div>
        <section className="relative isolate mx-auto grid min-h-[600px] max-w-[1440px] items-center gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[.92fr_1.08fr] lg:px-12 lg:py-20">
          <div className="relative z-10 order-2 lg:order-1">
            <div className="eyebrow"><Sparkles className="h-3.5 w-3.5" />من مهارة إلى باقة قابلة للبيع</div>
            <h1 className="mt-6 max-w-3xl font-display text-5xl font-extrabold leading-[1.12] tracking-tight text-white sm:text-6xl lg:text-7xl">
              لا تَبِع وقتك.<br />
              <span className="text-[#9B90FF]">ابنِ عرضًا</span> يختاره العميل.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">مِهنتي يصنع من خبرتك عرض خدمة محددًا: نتيجة، نطاق، مدة، سعر، ورسالة تواصل. كل ما تحتاجه لبدء محادثة بيع أكثر وضوحًا.</p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <button onClick={() => scrollToSection("tool")} className="button-primary button-lg">صمّم عرضي الآن <ArrowLeft className="h-5 w-5" /></button>
              <button onClick={() => scrollToSection("method")} className="button-quiet"><span className="play-dot"><ChevronLeft className="h-4 w-4" /></span> كيف نحوله إلى دخل؟</button>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 border-t border-white/10 pt-6 text-sm text-slate-400">
              <span className="flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-[#8EF3CA]" />سعر ثابت ونطاق واضح</span>
              <span className="flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-[#8EF3CA]" />مناسب للسوق العربي</span>
            </div>
          </div>

          <div className="relative order-1 lg:order-2">
            <div className="hero-wash" />
            <img src="/manus-storage/mihnati-hero-studio_4c280d4a.jpg" alt="أوراق عروض مضيئة في استوديو كحلي" className="hero-image" />
            <div className="hero-decision-step"><span>01</span><i />تعريف القيمة</div>
            <div className="absolute bottom-7 right-3 z-10 rounded-2xl border border-white/15 bg-[#12182f]/90 p-4 shadow-2xl backdrop-blur-md sm:right-8">
              <div className="mb-2 flex items-center justify-between gap-10 text-xs text-slate-400"><span>وضوح العرض</span><strong className="text-[#8EF3CA]">92%</strong></div>
              <div className="h-1.5 w-36 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[92%] rounded-full bg-[#8EF3CA]" /></div>
            </div>
            <div className="absolute left-1 top-10 z-10 rotate-[-5deg] rounded-xl border border-[#8B7CFF]/45 bg-[#8B7CFF]/15 px-4 py-3 text-sm font-semibold text-white shadow-xl backdrop-blur-sm sm:left-8"><span className="ml-1 text-[#8EF3CA]">✓</span> عرض قابل للبيع</div>
          </div>
        </section>

        <section id="tool" className="relative bg-[#F3EFE7] py-12 text-[#17192C] sm:py-16">
          <div className="absolute inset-x-0 top-0 h-2 bg-[#8B7CFF]" />
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
            <div className="mb-9 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="eyebrow light"><Flame className="h-3.5 w-3.5" />غرفة بناء العرض</div>
                <div className="section-phase dark-phase"><span>02</span><i />قرار البناء</div>
                <h2 className="mt-3 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">هذا ليس مولّد أفكار.<br />إنه ورقة بيع أولى.</h2>
              </div>
              <p className="max-w-md text-sm leading-7 text-[#5A5B6A]">أدخل ما تعرفه وما يهم عميلك. ستخرج بوعد بسيط، باقة محددة، نقطة سعر ورسالة تبدأ بها الحوار.</p>
            </div>

            <div className="offer-room">
              <aside className="room-rail">
                <div>
                  <div className="mb-10 flex items-center gap-3"><img src="/manus-storage/mihnati-logo-mark_d0ba8924.png" alt="" className="h-8 w-8" /><span className="font-display text-xl font-bold text-white">مسار العرض</span></div>
                  <ol className="space-y-7">
                    {[["01", "المهارة", "ما الذي تنفذه جيدًا؟"], ["02", "العميل", "لمن يهم هذا؟"], ["03", "النتيجة", "لماذا سيدفع؟"], ["04", "النموذج", "كيف يُباع؟"]].map(([number, title, text], index) => (
                      <li key={number} className="rail-step"><span className={index === 3 ? "rail-number active" : "rail-number"}>{index < 3 ? <Check className="h-3.5 w-3.5" /> : number}</span><div><strong>{title}</strong><small>{text}</small></div></li>
                    ))}
                  </ol>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-300"><span className="mb-2 flex items-center gap-2 text-xs font-bold text-[#8EF3CA]"><Target className="h-3.5 w-3.5" />قاعدة مِهنتي</span>إذا لم تستطع وصف النتيجة في جملة، فالعرض لا يزال واسعًا.</div>
              </aside>

              <div className="room-form">
                <div className="mb-7 flex items-center justify-between"><div><p className="kicker">الخطوة 4 من 4</p><h3 className="font-display text-2xl font-bold">شكّل العرض</h3></div><button onClick={() => { setSkill("تصميم الهوية البصرية"); setAudience(audiences[0]); setOutcome("الظهور بشكل احترافي وتحويل الزوار إلى مشترين"); setModel("project"); setClientName(""); setSector(""); setTagsText(""); setOffer(initialOffer); setHasGenerated(false); }} className="reset-button"><RotateCcw className="h-3.5 w-3.5" />إعادة</button></div>
                <div className="space-y-5">
                  <label className="field-label">مهارتك أو خدمتك<textarea value={skill} onChange={(event) => setSkill(event.target.value)} rows={2} className="field-input resize-none" placeholder="مثال: كتابة محتوى لينكدإن" /></label>
                  <label className="field-label">العميل الذي تريد خدمته<select value={audience} onChange={(event) => setAudience(event.target.value)} className="field-input">{audiences.map((item) => <option key={item}>{item}</option>)}</select></label>
                  <label className="field-label">النتيجة التي يريدها العميل<textarea value={outcome} onChange={(event) => setOutcome(event.target.value)} rows={2} className="field-input resize-none" placeholder="مثال: زيادة الطلبات عبر صفحة هبوط أوضح" /></label>
                  <fieldset><legend className="field-label mb-2">نموذج البيع</legend><div className="model-options">{(Object.keys(modelContent) as OfferModel[]).map((option) => <button type="button" key={option} onClick={() => setModel(option)} className={model === option ? "model-option selected" : "model-option"}><span><strong>{modelContent[option].label}</strong><small>{modelContent[option].tag}</small></span>{model === option && <Check className="h-4 w-4" />}</button>)}</div></fieldset>
                  <div className="save-context"><div className="save-context-title"><Tag className="h-3.5 w-3.5" />تصنيف عند الحفظ <span>اختياري</span></div><div className="save-context-grid"><label className="field-label">اسم العميل<input value={clientName} onChange={(event) => setClientName(event.target.value)} className="field-input" placeholder="مثال: متجر نواة" /></label><label className="field-label">القطاع<input value={sector} onChange={(event) => setSector(event.target.value)} className="field-input" placeholder="مثال: تجارة إلكترونية" /></label></div><label className="field-label mt-3">وسومك الخاصة<input value={tagsText} onChange={(event) => setTagsText(event.target.value)} className="field-input" placeholder="مثال: إطلاق، رمضان، عميل مهم" /></label><p>افصل الوسوم بفاصلة عربية أو إنجليزية لتظهر لاحقًا كمرشحات في مكتبتك.</p></div>
                  <button onClick={generateOffer} className="generate-button"><Sparkles className="h-4 w-4" />{hasGenerated ? "أعد بناء العرض" : "ابنِ عرضًا قابلًا للبيع"}<ArrowLeft className="mr-auto h-4 w-4" /></button>
                </div>
              </div>

              <section className="proposal-pane" aria-live="polite">
                <div className="proposal-topline"><span>مُخرَج مِهنتي</span><span className="ready-stamp"><BadgeCheck className="h-3.5 w-3.5" />جاهز للمراجعة</span></div>
                <article className={hasGenerated ? "proposal-sheet generated" : "proposal-sheet"}>
                  <div className="proposal-header"><div className="proposal-mark"><Layers3 className="h-4 w-4" /></div><span>عرض خدمة · نسخة 01</span></div>
                  <h3>{offer.title}</h3>
                  <p className="proposal-promise">{offer.promise}</p>
                  <div className="proposal-section"><span className="proposal-label">يشمل العرض</span><ul>{offer.includes.map((item) => <li key={item}><Check className="h-3.5 w-3.5" />{item}</li>)}</ul></div>
                  <div className="proposal-footer"><div><span>المدة</span><strong>{offer.timeline}</strong></div><div><span>الاستثمار</span><strong className="price-text">{offer.price}</strong><small>{offer.priceNote}</small></div></div>
                </article>
                <div className="score-card"><div><span>مؤشر وضوح العرض</span><strong>{offerScore}<small>/100</small></strong></div><div className="score-track"><span style={{ width: `${offerScore}%` }} /></div><p>{offerScore > 85 ? "النتيجة واضحة بما يكفي لتبدأ عرضها." : "أضف نتيجة أدق لتقوية العرض."}</p></div>
                <div className="proposal-actions"><button onClick={saveOffer} disabled={createOffer.isPending} className="action-button action-save">{createOffer.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}{isAuthenticated ? "حفظ سحابي" : "حفظ بحسابي"}</button><button onClick={downloadOffer} className="action-button"><Download className="h-4 w-4" />تنزيل</button><button onClick={() => copyText(`${offer.title}\n${offer.promise}`, "ملخص العرض")} className="action-button"><Copy className="h-4 w-4" />نسخ</button></div>
              </section>
            </div>
            <p className="mt-4 text-xs leading-6 text-[#75727C]">{isAuthenticated ? "تُحفظ عروضك في حسابك السحابي ولا تكون مرئية للمستخدمين الآخرين." : "سجّل دخولك لحفظ العرض في مكتبتك السحابية الخاصة."} اقتراحات السعر والمؤشرات تعليمية وليست ضمانًا للدخل أو للنتائج التجارية.</p>
          </div>
        </section>

        <OfferLibrary />

        <section id="method" className="relative bg-[#11162C] py-20 sm:py-28">
          <div className="mx-auto grid max-w-[1440px] gap-12 px-5 sm:px-8 lg:grid-cols-[.8fr_1.2fr] lg:items-center lg:px-12">
            <div className="relative min-h-[420px] overflow-hidden rounded-[2rem] border border-white/10 bg-[#18203d]">
              <img src="/manus-storage/mihnati-pathway_639ebc2f.jpg" alt="خط بنفسجي يربط المهارة بالعرض والاعتماد" className="absolute inset-0 h-full w-full object-cover opacity-80" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0E1327] via-[#0E1327]/80 to-transparent p-7 pt-24"><p className="text-sm leading-7 text-slate-300">كل باقة قوية تتبع خطًا واحدًا: خبرة محددة → نتيجة يريدها عميل محدد → نطاق يمكن تكراره.</p></div>
            </div>
            <div>
              <div className="eyebrow"><MoveLeft className="h-3.5 w-3.5" />من العرض إلى أول محادثة</div>
              <div className="section-phase"><span>03</span><i />قرار الإرسال</div>
              <h2 className="mt-5 max-w-2xl font-display text-4xl font-extrabold leading-tight sm:text-5xl">لا يحتاج العميل إلى قائمة مهارات. يحتاج إلى <span className="text-[#9B90FF]">قرار سهل.</span></h2>
              <div className="mt-10 border-t border-white/10">
                {[{ number: "01", icon: Target, title: "سمِّ النتيجة، لا الأداة", text: "بدل «أصمم صفحات»، بع «صفحة إطلاق توضح العرض وتلتقط الطلبات»." }, { number: "02", icon: WalletCards, title: "أغلق النطاق قبل السعر", text: "حدّد ما سيتسلمه العميل وعدد المراجعات والمدة؛ عندها يصبح السعر مفهومًا." }, { number: "03", icon: Send, title: "ابدأ برسالة قليلة الاحتكاك", text: "أرسل ملاحظة مرتبطة بفرصة ملموسة، واطلب الإذن لمشاركة الباقة بدل فرض عرض طويل." }].map((step) => <div key={step.number} className="method-row"><span className="method-number">{step.number}</span><step.icon className="h-5 w-5 text-[#8EF3CA]" /><div><h3>{step.title}</h3><p>{step.text}</p></div></div>)}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#E8E1D5] py-20 text-[#17192C] sm:py-28">
          <div className="mx-auto grid max-w-[1440px] gap-10 px-5 sm:px-8 lg:grid-cols-[1fr_.85fr] lg:items-center lg:px-12">
            <div>
              <div className="eyebrow light"><FileText className="h-3.5 w-3.5" />رسالة جاهزة لا تبدو آلية</div>
              <h2 className="mt-5 max-w-2xl font-display text-4xl font-extrabold leading-tight sm:text-5xl">أرسل افتتاحية محترمة، ثم دع العرض يتحدث.</h2>
              <p className="mt-5 max-w-xl text-base leading-8 text-[#5A5B6A]">تولّد مِهنتي رسالة قصيرة مرتبطة بقيمة الباقة، لا بمدح عام أو كلام تسويقي فارغ. انسخها ثم أضف لمستك الشخصية قبل الإرسال.</p>
              <div className="mt-8 flex flex-wrap gap-3"><button onClick={() => copyText(offer.outreach, "رسالة التواصل")} className="button-ink"><Copy className="h-4 w-4" />نسخ الرسالة</button><button onClick={() => scrollToSection("tool")} className="button-text">عدّل العرض <ArrowUpLeft className="h-4 w-4" /></button></div>
            </div>
            <div className="message-composition">
              <img src="/manus-storage/mihnati-proposal_fee5211e.jpg" alt="أوراق عرض خدمة مرتبة" className="message-image" />
              <div className="message-card"><div className="mb-4 flex items-center justify-between"><span className="text-xs font-bold text-[#8B7CFF]">رسالة بدء محادثة</span><button onClick={() => copyText(offer.outreach, "رسالة التواصل")} aria-label="نسخ الرسالة" className="rounded-md p-1.5 text-[#525365] hover:bg-[#F0ECF8]"><Copy className="h-4 w-4" /></button></div><p>{offer.outreach}</p><div className="mt-5 flex items-center gap-2 text-xs text-[#646577]"><span className="h-2 w-2 rounded-full bg-[#8EF3CA]" />مصممة من عرضك الحالي</div></div>
            </div>
          </div>
        </section>

        <section id="business" className="relative bg-[#11162C] py-20 sm:py-28">
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
            <div className="grid gap-10 lg:grid-cols-[1.1fr_.9fr] lg:items-end">
              <div><div className="eyebrow"><WalletCards className="h-3.5 w-3.5" />الأداة كمنتج قابل للبيع</div><div className="section-phase"><span>04</span><i />قرار النمو</div><h2 className="mt-5 max-w-3xl font-display text-4xl font-extrabold leading-tight sm:text-5xl">ابنِ جمهورًا بالنسخة المجانية، ثم بِع الوضوح المتكرر.</h2></div>
              <p className="max-w-md text-sm leading-7 text-slate-300">هذا هو نموذج الدخل المقترح للمنتج نفسه: قيمة فورية مجانية، ثم اشتراك لصناع الخدمات الذين يحتاجون إلى تكرار العروض وتخزينها وتخصيصها.</p>
            </div>
            <div className="maturity-legend" aria-label="مسار نضج المنتج"><span><b>01</b> يكتشف عرضه</span><i /><span className="active"><b>02</b> يكرّر الوضوح</span><i /><span><b>03</b> يوحّد الفريق</span></div>
            <div className="pricing-layout mt-12 grid gap-5 lg:grid-cols-3">
              {[{ tier: "اكتشاف", price: "مجاني", description: "لمن يختبر فكرة عرضه الأولى.", items: ["3 عروض شهريًا", "تصدير Markdown", "مؤشر الوضوح"], tint: "standard" }, { tier: "محترف", price: "49 ر.س", description: "للمستقل الذي يعرض ويعدّل باستمرار.", items: ["عروض غير محدودة", "قوالب حسب القطاع", "مكتبة عروض ورسائل"], tint: "featured" }, { tier: "فريق", price: "129 ر.س", description: "لفريق صغير يوحّد طريقة البيع.", items: ["3 مقاعد عمل", "قوالب موحدة", "ملاحظات داخلية"], tint: "standard" }].map((plan) => <article key={plan.tier} className={plan.tint === "featured" ? "pricing-card featured" : "pricing-card"}>{plan.tint === "featured" && <span className="pricing-ribbon">المسار المقترح</span>}<div className="flex items-start justify-between"><div><h3>{plan.tier}</h3><p>{plan.description}</p></div>{plan.tint === "featured" && <img src="/manus-storage/mihnati-price-orbit_a7c889b3.jpg" alt="دوائر تجريدية تمثل السعر والنطاق" className="h-14 w-14 rounded-full object-cover" />}</div><strong className="pricing-price">{plan.price}<small>{plan.price !== "مجاني" ? " / شهريًا" : ""}</small></strong><ul>{plan.items.map((item) => <li key={item}><Check className="h-4 w-4" />{item}</li>)}</ul><button onClick={() => scrollToSection("tool")} className={plan.tint === "featured" ? "pricing-button primary" : "pricing-button"}>جرّب صانع العروض <ArrowLeft className="h-4 w-4" /></button></article>)}
            </div>
          </div>
        </section>

        <section className="relative border-t border-white/10 bg-[#151B35] py-16">
          <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-5 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-12"><div><p className="font-display text-3xl font-extrabold">خبرتك تستحق أن تُقدَّم كقرار.</p><p className="mt-2 text-slate-400">ابدأ بعرض واحد واضح، ثم اختبره في محادثات حقيقية.</p></div><button onClick={() => scrollToSection("tool")} className="button-primary button-lg">ابنِ عرضي الآن <ArrowLeft className="h-5 w-5" /></button></div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-[#0D1122] py-7 text-sm text-slate-500"><div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-5 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-12"><div className="flex items-center gap-2"><img src="/manus-storage/mihnati-logo-mark_d0ba8924.png" alt="" className="h-6 w-6" /><span className="font-display font-bold text-slate-200">مِهنتي</span><span>— حوّل مهارتك إلى دخل.</span></div><span>{isAuthenticated ? `${savedOffersQuery.data?.length ?? 0} عروض محفوظة في حسابك` : "سجّل الدخول لحفظ عروضك سحابيًا"}</span></div></footer>
    </div>
  );
}
