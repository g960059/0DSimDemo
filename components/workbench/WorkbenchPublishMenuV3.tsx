import React from "react";
import { Copy, ExternalLink, Globe, LoaderCircle, LockKeyhole } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  WorkbenchAnchoredDialogV3,
  workbenchPopoverAnchorV3,
  type WorkbenchPopoverAnchorV3,
} from "./WorkbenchAnchoredDialogV3";

export type WorkbenchPublicationStageV3 = "saving" | "checking" | "publishing" | "unpublishing" | null;

export function WorkbenchPublishMenuV3({
  published, stale, comparisonKnown, dirty, disabled, stage, publishedAt, publicHref, error, loginHref,
  onPublish, onUnpublish,
}: Readonly<{
  published: boolean;
  stale: boolean;
  comparisonKnown: boolean;
  dirty: boolean;
  disabled: boolean;
  stage: WorkbenchPublicationStageV3;
  publishedAt: string | null;
  publicHref: string | null;
  error: string | null;
  loginHref: string | null;
  onPublish(): Promise<void>;
  onUnpublish(): Promise<void>;
}>) {
  const { t, i18n } = useTranslation();
  const [anchor, setAnchor] = React.useState<WorkbenchPopoverAnchorV3 | null>(null);
  const [confirmUnpublish, setConfirmUnpublish] = React.useState(false);
  const [copyState, setCopyState] = React.useState<"idle" | "copied" | "error">("idle");
  const busy = stage !== null;
  const key = "workbench.editor.publication";
  const close = () => { setAnchor(null); setConfirmUnpublish(false); setCopyState("idle"); };
  const status = t(published ? `${key}.${stale && (dirty || comparisonKnown) ? "staleStatus" : "published"}` : "workbench.editor.publish");
  const action = t(`${key}.${published ? dirty ? "saveAndUpdate" : "update" : dirty ? "saveAndPublish" : "publish"}`);
  const copyLink = async () => {
    if (!publicHref) return;
    try {
      await navigator.clipboard.writeText(new URL(publicHref, window.location.href).href);
      setCopyState("copied");
    } catch { setCopyState("error"); }
  };
  return <>
    <button
      type="button"
      className="workbench-publication-trigger workbench-header-action"
      data-testid="v3-publish-experiment"
      data-published={published}
      data-stale={stale}
      data-attention={stale && (dirty || comparisonKnown)}
      disabled={disabled && !busy}
      aria-label={busy ? t(`${key}.stage.${stage}`) : status}
      aria-haspopup="dialog"
      aria-expanded={anchor !== null}
      title={status}
      onClick={event => anchor ? close() : setAnchor(workbenchPopoverAnchorV3(event.currentTarget))}
    >
      {busy ? <LoaderCircle className="h-3 w-3 shrink-0 animate-spin" aria-hidden="true" />
        : published ? <span className="workbench-publication-dot" aria-hidden="true" /> : null}
      {busy ? t(`${key}.${stage === "unpublishing" ? "unpublishing" : "processing"}`)
        : t(published ? `${key}.published` : "workbench.editor.publish")}
    </button>
    <span className="sr-only" role="status">{busy ? t(`${key}.stage.${stage}`) : status}</span>
    {anchor && <WorkbenchAnchoredDialogV3
      anchor={anchor}
      title={t(`${key}.${confirmUnpublish ? "unpublishTitle" : "settings"}`)}
      closeLabel={t("common.close")}
      onClose={close}
      testId="workbench-publication-menu-v3"
      width={344}
      mobileBackdrop
    >
      <div className="workbench-publication-menu">
        <div className="flex items-center gap-2 text-sm font-semibold">
          {published ? <Globe className="h-4 w-4 text-wb-accent" aria-hidden="true" /> : <LockKeyhole className="h-4 w-4 text-wb-muted" aria-hidden="true" />}
          {t(`${key}.${published ? "published" : "private"}`)}
        </div>
        {publishedAt && published && <p className="text-xs text-wb-subtle">{t(`${key}.publishedAt`, { date: new Intl.DateTimeFormat(i18n.resolvedLanguage === "ja" ? "ja-JP" : "en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(publishedAt)) })}</p>}
        {error && <p className="workbench-publication-notice text-wb-danger" role="alert">{error}</p>}
        {busy ? <div className="flex items-center gap-2 py-4 text-sm text-wb-muted" role="status">
          <LoaderCircle className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
          {t(`${key}.stage.${stage}`)}
        </div> : confirmUnpublish ? <>
          <p className="text-xs leading-6 text-wb-muted">{t(`${key}.unpublishNotice`)}</p>
          <button type="button" className="workbench-publication-primary is-danger" onClick={async () => { await onUnpublish(); setConfirmUnpublish(false); }}>{t(`${key}.unpublish`)}</button>
          <button type="button" className="workbench-publication-secondary" onClick={() => setConfirmUnpublish(false)}>{t(`${key}.cancel`)}</button>
        </> : <>
          <p className="text-xs leading-6 text-wb-muted">{t(`${key}.${published ? "publicNotice" : "privateNotice"}`)}</p>
          {(dirty || stale) && <p className="workbench-publication-notice">{t(`${key}.${dirty ? "dirtyNotice" : comparisonKnown ? "staleNotice" : "updateNotice"}`)}</p>}
          {loginHref ? <a href={loginHref} className="workbench-publication-primary">{t("siteHeader.login")}</a>
            : (!published || dirty || stale) ? <button type="button" className="workbench-publication-primary" disabled={disabled} onClick={() => void onPublish()}>{action}</button>
            : <p className="text-xs text-wb-subtle">{t(`${key}.currentNotice`)}</p>}
          {published && publicHref && <>
            <div className="grid grid-cols-2 gap-2">
              <a href={publicHref} target="_blank" rel="noopener noreferrer" className="workbench-publication-secondary"><ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />{t(`${key}.view`)}</a>
              <button type="button" className="workbench-publication-secondary" onClick={() => void copyLink()}><Copy className="h-3.5 w-3.5" aria-hidden="true" />{t(`${key}.${copyState === "copied" ? "copied" : "copy"}`)}</button>
            </div>
            <span className="sr-only" role="status">{copyState === "copied" ? t(`${key}.copied`) : ""}</span>
            {copyState === "error" && <p className="text-xs text-wb-danger" role="alert">{t(`${key}.copyError`)}</p>}
            <button type="button" className="min-h-10 text-xs text-wb-danger disabled:opacity-40" disabled={disabled} onClick={() => setConfirmUnpublish(true)}>{t(`${key}.unpublish`)}</button>
          </>}
          {!published && <p className="text-[11px] leading-5 text-wb-subtle">{t(`${key}.fixedNotice`)}</p>}
        </>}
      </div>
    </WorkbenchAnchoredDialogV3>}
  </>;
}
