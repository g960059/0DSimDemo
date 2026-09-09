import React from "react";
import { ArrowLeft, ArrowRight, ChevronDown, FileQuestion, List } from "lucide-react";
import { Link, Navigate, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { homeHref, modelDocumentationHref } from "@/homeLinks";
import { localeFromPathname, type Locale } from "@/localeRouting";
import { resolveSavedModelDocumentIndexV1 } from "@/studio/presentation/modelDocumentation/SavedModelDocumentCatalogV1";
import { resolveSavedModelDocumentV1, resolveSavedModelReadingV1 } from "@/studio/presentation/modelDocumentation/SavedModelDocumentLibraryV1";
import { MODEL_READING_ENTRIES_V1, MODEL_READING_MODELS_V1, compatibleReadingEntriesV1, currentModelReadingEntryV1,
  modelReadingPresetLabelV1, modelReadingStateLabelV1, type ModelReadingEntryV1 } from "@/studio/presentation/modelDocumentation/ModelReadingCatalogV1";
import { savedReadingHtmlV1, type DocumentContentsV1, type SavedModelReadingV1 } from "@/studio/presentation/modelDocumentation/SavedModelReadingV1";
import type { SavedModelDocumentV1 } from "@/studio/presentation/modelDocumentation/SavedModelDocumentV1";
import { SavedModelDocumentationV1 } from "./SavedModelDocumentationV1";

const focus = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent";
const t = (l: Locale, ja: string, en: string) => l === "ja" ? ja : en;
const href = (entry: ModelReadingEntryV1, locale: Locale, view: "guide" | "presets" = "guide") =>
  modelDocumentationHref({ locale, ...entry.identity, documentId: entry.documentId, view });

function Unavailable({ locale, record = false, recovery }: { locale: Locale; record?: boolean; recovery?: string }) {
  const Body = recovery ? "div" : "main", Heading = recovery ? "h2" : "h1";
  return <div className={`flex bg-wb-app px-5 py-12 text-wb-text ${recovery ? "" : "h-full overflow-y-auto"}`} data-testid="model-documentation-unavailable-v1">
    <Body className="m-auto w-full max-w-xl text-center">
      <FileQuestion className="mx-auto h-8 w-8 text-wb-subtle" aria-hidden="true" />
      <Heading className="mt-5 text-xl font-semibold">{t(locale, record ? "この検証記録を表示できません" : "数理モデル文書を表示できません", record ? "Assessment record unavailable" : "Model documentation unavailable")}</Heading>
      <p className="mt-3 text-sm leading-7 text-wb-muted">{t(locale, "指定されたモデル・表示と解析の定義（Surface）・保存文書に対応する記録がありません。別の版や症例の内容では代用しません。", "No matching model, Surface and saved record is available. Another version or case is never substituted.")}</p>
      <Link to={recovery ?? homeHref(locale)} className={`mt-6 inline-flex min-h-11 items-center gap-2 rounded text-sm text-wb-accent ${focus}`}><ArrowLeft className="h-4 w-4" />{recovery ? t(locale, "このプリセットの検証記録へ", "Open this preset's assessment") : t(locale, "ホームへ戻る", "Back to home")}</Link>
    </Body>
  </div>;
}

class ReadingBoundary extends React.Component<React.PropsWithChildren<{ locale: Locale }>, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <Unavailable locale={this.props.locale} /> : this.props.children; }
}

function Contents({ entries, active, locale, compact = false }: { entries: DocumentContentsV1; active: string; locale: Locale; compact?: boolean }) {
  return <nav aria-label={t(locale, "このページの内容", "On this page")} className={compact ? "flex flex-wrap gap-x-5 gap-y-1" : "space-y-1"}>
    {!compact && <p className="mb-3 text-xs font-medium text-wb-subtle">{t(locale, "このページの内容", "On this page")}</p>}
    {entries.map(e => <a key={e.id} href={`#${e.id}`} aria-current={active === e.id ? "location" : undefined}
      className={`block rounded py-2 text-[13px] leading-5 ${!compact && e.level > 2 ? "pl-3" : ""} ${active === e.id ? "font-medium text-wb-accent" : "text-wb-muted hover:text-wb-text"} ${focus}`}>
      {e.title}
    </a>)}
  </nav>;
}

function PresetList({ entry, locale, contents }: { entry: ModelReadingEntryV1; locale: Locale; contents: DocumentContentsV1 }) {
  const hash = useLocation().hash;
  const chapter = hash.slice(1);
  return <nav aria-label={t(locale, "このモデルのプリセット", "Presets for this model")} className="space-y-1">
    <p className="mb-3 text-xs font-medium text-wb-subtle">{modelReadingPresetLabelV1(entry, locale)}</p>
    {compatibleReadingEntriesV1(entry).map(e => <Link key={e.documentId}
      to={href(e, locale, "presets") + (contents.some(c => c.id === chapter) ? hash : "")}
      aria-current={e.documentId === entry.documentId ? "page" : undefined}
      className={`block rounded-lg border-l-2 px-3 py-3 text-sm leading-6 ${e.documentId === entry.documentId ? "border-wb-accent bg-wb-panel font-medium text-wb-text" : "border-transparent text-wb-muted hover:bg-wb-panel"} ${focus}`}>
      {e.presetLabel[locale]}
    </Link>)}
    {entry.state === "research" && <p className="px-3 pt-3 text-xs leading-6 text-wb-subtle">{t(locale, "研究モデルの保存資料です。Standard 72のプリセットとは別に扱います。比較baselineの数値は症例の評価内に記録しています。", "Saved research-model material, separate from Standard 72 presets. Comparator baseline values are retained in the case assessment.")}</p>}
  </nav>;
}

function ReadingContent({ saved, reading, entry, locale, view }: {
  saved: SavedModelDocumentV1; reading: SavedModelReadingV1 | null; entry: ModelReadingEntryV1; locale: Locale; view: "guide" | "presets";
}) {
  const navigate = useNavigate(), location = useLocation();
  const [search] = useSearchParams();
  const recordId = search.get("record");
  const root = React.useRef<HTMLDivElement>(null);
  const [active, setActive] = React.useState("");
  React.useEffect(() => {
    const previous = document.title;
    document.title = `${view === "guide" ? t(locale, "しくみ・数式", "Mechanisms & equations") : entry.presetLabel[locale]} — ${entry.modelLabel[locale]} | CircleHeart`;
    return () => { document.title = previous; };
  }, [entry, locale, view]);
  const [recordError, html] = React.useMemo(() => {
    try { return [false, reading ? savedReadingHtmlV1(reading, locale, view, recordId) : null] as const; }
    catch { return [true, null] as const; }
  }, [reading, locale, view, recordId]);
  const contents = reading ? reading.views[locale][view === "guide" ? "guide" : "preset"].contents : [];
  const find = React.useCallback((id: string) => Array.from(root.current?.querySelectorAll<HTMLElement>("[id]") ?? []).find(e => e.id === id), []);
  const jump = React.useCallback((hash: string, focusTarget: boolean) => {
    let id: string;
    try { id = decodeURIComponent(hash.replace(/^#/, "")); } catch { return; }
    const target = find(id);
    if (!target) return;
    for (let p = target.parentElement; p && p !== root.current; p = p.parentElement) if (p instanceof HTMLDetailsElement) p.open = true;
    target.scrollIntoView({ block: "start" });
    if (focusTarget) { target.setAttribute("tabindex", "-1"); target.focus({ preventScroll: true }); }
    setActive(id);
  }, [find]);
  React.useLayoutEffect(() => {
    if (location.hash) jump(location.hash, false);
    else root.current?.scrollTo({ top: 0 });
  }, [entry.documentId, locale, view, location.hash, recordError, jump]);
  React.useEffect(() => {
    const node = root.current;
    if (!node) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const offset = parseFloat(node.style.getPropertyValue("--reader-anchor-offset")) || 100;
      const top = node.getBoundingClientRect().top + offset;
      let current = contents[0]?.id ?? "";
      for (const c of contents) {
        const target = find(c.id);
        if (target && target.getBoundingClientRect().top <= top) current = c.id;
      }
      setActive(current);
    };
    const scroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    node.addEventListener("scroll", scroll, { passive: true }); update();
    return () => { node.removeEventListener("scroll", scroll); if (frame) cancelAnimationFrame(frame); };
  }, [contents, find]);
  React.useEffect(() => {
    const node = root.current;
    const header = node?.querySelector<HTMLElement>("[data-reader-header]");
    if (!node || !header) return;
    const chapters = node.querySelector<HTMLElement>("[data-reader-chapters]");
    const measure = () => {
      const height = header.getBoundingClientRect().height;
      node.style.setProperty("--reader-header-height", `${height}px`);
      node.style.setProperty("--reader-anchor-offset", `${height + (chapters?.getBoundingClientRect().height ?? 0) + 20}px`);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(header); if (chapters) observer.observe(chapters); measure();
    const dismiss = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      node.querySelectorAll<HTMLDetailsElement>("details[data-reader-menu][open]").forEach(d => {
        d.open = false; d.querySelector<HTMLElement>("summary")?.focus();
      });
    };
    const outside = (event: PointerEvent) => {
      if (!(event.target instanceof Node)) return;
      node.querySelectorAll<HTMLDetailsElement>("details[data-reader-menu][open]").forEach(d => {
        if (!d.contains(event.target as Node)) d.open = false;
      });
    };
    node.addEventListener("keydown", dismiss);
    document.addEventListener("pointerdown", outside);
    return () => { observer.disconnect(); node.removeEventListener("keydown", dismiss); document.removeEventListener("pointerdown", outside); };
  }, [view, entry.documentId, recordError]);
  const anchorClick = (event: React.MouseEvent) => {
    const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href^="#"]') : null;
    if (!link || link.dataset.documentAction || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const hash = link.getAttribute("href")!;
    let id: string; try { id = decodeURIComponent(hash.slice(1)); } catch { return; }
    if (!find(id)) return;
    event.preventDefault();
    root.current?.querySelectorAll<HTMLDetailsElement>("details[data-reader-menu]").forEach(d => { d.open = false; });
    navigate({ pathname: location.pathname, search: location.search, hash }); jump(hash, true);
  };
  return <div ref={root} data-reader-scroll className="model-reference-reader h-full overflow-y-auto bg-wb-app text-wb-text" onClick={anchorClick}>
      <div className="relative z-30 mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-3 sm:px-8">
        <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm">
          <Link className={`rounded text-wb-muted hover:text-wb-text ${focus}`} to={homeHref(locale)}>{t(locale, "ホーム", "Home")}</Link><span className="text-wb-subtle" aria-hidden="true">/</span>
          <span className="font-medium">{entry.modelLabel[locale]}</span>
          <span className="rounded border border-wb-line px-2 py-0.5 text-[11px] text-wb-subtle">{modelReadingStateLabelV1(entry.state, locale)}</span>
        </div>
        <details data-reader-menu className="relative shrink-0">
          <summary className={`flex min-h-10 cursor-pointer list-none items-center gap-1 rounded text-xs text-wb-muted ${focus}`}>{t(locale, "他のモデル", "Other models")}<ChevronDown className="h-3 w-3" aria-hidden="true" /></summary>
          <nav aria-label={t(locale, "モデルの選択", "Choose model")} className="absolute right-0 top-full z-30 w-64 rounded-lg border border-wb-line bg-wb-panel p-2 shadow-xl">
            {MODEL_READING_MODELS_V1.map(e => <Link key={e.documentId} to={href(e, locale)} aria-current={e.identity.modelId === entry.identity.modelId && e.identity.surfaceReleaseId === entry.identity.surfaceReleaseId ? "page" : undefined}
              className={`flex items-center justify-between gap-2 rounded px-3 py-3 text-sm hover:bg-wb-app ${focus}`}>
              <span>{e.modelLabel[locale]}</span><span className="text-xs text-wb-subtle">{modelReadingStateLabelV1(e.state, locale)}</span>
            </Link>)}
          </nav>
        </details>
      </div>
    <header data-reader-header className="sticky top-0 z-20 border-b border-wb-line bg-wb-app">
      {reading && <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 sm:px-8">
      <nav aria-label={t(locale, "文書の種類", "Reference type")} className="flex min-w-0 gap-5 sm:gap-7">
        {(["guide", "presets"] as const).map(v => <Link key={v} to={href(entry, locale, v)} aria-current={v === view ? "page" : undefined}
          className={`border-b-2 py-3 text-[13px] sm:text-sm ${v === view ? "border-wb-accent font-medium text-wb-text" : "border-transparent text-wb-muted hover:text-wb-text"} ${focus}`}>
          <span className="hidden sm:inline">{v === "guide" ? t(locale, "しくみ・数式", "Mechanisms & equations") : modelReadingPresetLabelV1(entry, locale)}</span>
          <span className="sm:hidden">{v === "guide" ? t(locale, "しくみ・数式", "Mechanisms") : locale === "ja" ? modelReadingPresetLabelV1(entry, locale) : "Presets"}</span>
        </Link>)}
      </nav>
      {!recordError && <details data-reader-menu data-reader-mobile-contents className="shrink-0 lg:hidden">
        <summary aria-label={t(locale, "このページの内容", "On this page")} className={`flex min-h-11 cursor-pointer list-none items-center gap-1 rounded text-xs text-wb-muted ${focus}`}>
          <List className="h-4 w-4" aria-hidden="true" /><span>{t(locale, "目次", "Contents")}</span>
        </summary>
        <div className="absolute left-5 right-5 top-full z-30 max-h-[60vh] overflow-y-auto rounded-lg border border-wb-line bg-wb-panel p-4 shadow-xl">
          <Contents entries={contents} active={active} locale={locale} />
        </div>
      </details>}
      </div>}
    </header>
    {!reading ? <div className="mx-auto max-w-5xl p-5">
      <p className="mb-5 text-sm leading-7 text-wb-muted">{t(locale, "保存時の構成で読む過去版です。モデルの説明とbaselineの評価を一つの文書に保持しています。", "Historical document preserved in its original combined model-and-baseline layout.")}</p>
      <SavedModelDocumentationV1 document={saved} locale={locale} />
    </div> : <div className={`mx-auto grid max-w-7xl items-start gap-8 px-5 py-8 sm:px-8 lg:gap-12 ${view === "guide" ? "lg:grid-cols-[minmax(0,1fr)_14rem]" : "lg:grid-cols-[13rem_minmax(0,1fr)]"}`}>
      {view === "presets" && <aside className="hidden lg:sticky lg:top-32 lg:block"><PresetList entry={entry} locale={locale} contents={contents} /></aside>}
      <main className="min-w-0">
        <div className="mb-6 space-y-3 lg:hidden">
          {view === "presets" && <details data-reader-menu className="rounded-lg border border-wb-line px-4">
            <summary className={`flex min-h-11 cursor-pointer list-none items-center justify-between text-sm ${focus}`}>{t(locale, "このモデルのプリセット", "Presets for this model")}<ChevronDown className="h-4 w-4" /></summary>
            <div className="pb-3"><PresetList entry={entry} locale={locale} contents={contents} /></div>
          </details>}
        </div>
        <div className="mb-8">
          {view === "presets" && <p className="mb-3 text-xs text-wb-subtle">{entry.modelLabel[locale]} · {modelReadingPresetLabelV1(entry, locale)}</p>}
          <h1 className="text-3xl font-semibold leading-tight tracking-tight">{view === "guide" ? t(locale, `${entry.modelLabel.ja}のしくみ`, `${entry.modelLabel.en}: mechanisms`) : entry.presetLabel[locale]}</h1>
          <p className="mt-4 text-sm leading-7 text-wb-muted">{view === "guide"
            ? t(locale, "循環の接続、心筋の構成則、圧・流量の計算と解析方法。", "Circuit connections, myocardial laws, pressure/flow computation and analysis methods.")
            : entry.summary[locale]}</p>
          {view === "guide" ? <Link to={href(entry, locale, "presets")} className={`mt-4 inline-flex min-h-10 items-center gap-2 rounded text-sm text-wb-accent ${focus}`}>
            {t(locale, `${modelReadingPresetLabelV1(entry, locale)}の設定と検証`, "Preset settings and assessment")}<ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link> : <p className="mt-3 text-xs leading-6 text-wb-subtle">{t(locale, "登録・保存時の設定と検証記録です。操作中の症例の現在値ではありません。", "Saved settings and assessment, not the current values of an edited workbench scenario.")}</p>}
          <p className="mt-3 text-xs leading-6 text-wb-muted sm:hidden">{t(locale, "横長の数式・表は左右にスクロールできます。", "Swipe horizontally to read wide equations and tables.")}</p>
        </div>
        {recordError ? <Unavailable locale={locale} record recovery={href(entry, locale, "presets") + "#baseline"} /> : <>
        {view === "presets" && <div data-reader-chapters className="sticky z-10 mb-5 hidden border-b border-wb-line bg-wb-app py-2 lg:block" style={{ top: "var(--reader-header-height, 48px)" }}><Contents entries={contents} active={active} locale={locale} compact /></div>}
        <SavedModelDocumentationV1 document={saved} locale={locale} readingHtml={html!}
          onRecordChange={record => { const next = new URLSearchParams(search); next.set("record", record);
            navigate({ pathname: location.pathname, search: `?${next}`, hash: "#baseline" }, { preventScrollReset: true }); }} />
        </>}
      </main>
      {view === "guide" && !recordError && <aside className="hidden max-h-[calc(100vh-9rem)] overflow-y-auto lg:sticky lg:top-32 lg:block"><Contents entries={contents} active={active} locale={locale} /></aside>}
    </div>}
  </div>;
}

export function ModelDocumentationPage() {
  const location = useLocation(), { modelId } = useParams<{ modelId: string }>(), [search] = useSearchParams();
  const locale = localeFromPathname(location.pathname);
  const surface = search.get("surface"), documentId = search.get("document");
  const identity = resolveSavedModelDocumentIndexV1(modelId, surface, documentId);
  const entry = MODEL_READING_ENTRIES_V1.find(e => e.documentId === identity?.documentId);
  const view = search.get("view") === "presets" ? "presets" : "guide";
  const Document = React.useMemo(() => React.lazy(async () => {
    const saved = await resolveSavedModelDocumentV1(modelId, surface, documentId);
    if (!saved) throw new Error("Unavailable document");
    const reading = await resolveSavedModelReadingV1(saved);
    return { default: (props: { entry: ModelReadingEntryV1; locale: Locale; view: "guide" | "presets" }) => <ReadingContent {...props} saved={saved} reading={reading} /> };
  }), [modelId, surface, documentId]);
  if (!modelId) {
    const current = currentModelReadingEntryV1();
    return current ? <Navigate to={href(current, locale)} replace /> : <Unavailable locale={locale} />;
  }
  if (!entry) return <Unavailable locale={locale} />;
  return <ReadingBoundary locale={locale} key={entry.documentId}>
    <React.Suspense fallback={<p className="p-8 text-sm text-wb-muted" role="status">{t(locale, "文書を読み込んでいます…", "Loading documentation…")}</p>}>
      <Document entry={entry} locale={locale} view={view} />
    </React.Suspense>
  </ReadingBoundary>;
}

export default ModelDocumentationPage;
