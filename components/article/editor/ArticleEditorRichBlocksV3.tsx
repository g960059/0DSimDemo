import React from "react";
import {
  Link2,
  ListChecks,
  Loader2,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  ArticleEquationPresentationV3,
  ArticleImagePresentationV3,
  ArticleLinkPresentationV3,
} from "@/components/article/ArticleRichBlockV3";
import { portableArticleEditorIdV3 } from "@/components/article/editor/ArticleEditorIdentityV3";
import { articleEditorInputIsComposingV3 } from "@/components/article/editor/ArticleEditorPolicy";
import { articleEditorErrorMessageV3 } from "@/components/article/editor/ArticleEditorUtilitiesV3";
import type {
  StudioArticleEquationBlockV2,
  StudioArticleImageBlockV2,
  StudioArticleLinkBlockV2,
  StudioArticleQuizBlockV2,
} from "@/studio/contracts/v2/article";

export function ArticleEquationBlockEditorV3({
  block,
  focus,
  onChange,
  onFocusHandled,
}: Readonly<{
  block: StudioArticleEquationBlockV2;
  focus: boolean;
  onChange: (block: StudioArticleEquationBlockV2) => void;
  onFocusHandled: () => void;
}>) {
  const { t } = useTranslation();
  const inputRef = React.useRef<HTMLTextAreaElement | null>(null);
  React.useEffect(() => {
    if (!focus) return;
    inputRef.current?.focus();
    onFocusHandled();
  }, [focus, onFocusHandled]);
  return (
    <div
      className="my-3 rounded-xl bg-wb-soft/55 px-4 py-3.5 focus-within:bg-wb-soft"
      data-article-block-kind="equation"
    >
      <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-wb-subtle">
        {t("articleEditor.equation.label")}
        <textarea
          ref={inputRef}
          rows={2}
          value={block.expression}
          onChange={(event) => onChange({
            ...block,
            expression: event.currentTarget.value,
          })}
          placeholder={t("articleEditor.equation.placeholder")}
          spellCheck={false}
          className="mt-2 block min-h-14 w-full resize-y bg-transparent font-mono text-sm font-normal normal-case leading-6 tracking-normal text-wb-text outline-none placeholder:text-wb-subtle"
        />
      </label>
      {block.expression.length === 0 ? (
        <p className="border-t border-wb-line/60 pt-3 text-center text-xs text-wb-subtle">
          {t("articleEditor.equation.previewHint")}
        </p>
      ) : (
        <ArticleEquationPresentationV3
          block={block}
          className="border-t border-wb-line/60 pt-4"
        />
      )}
    </div>
  );
}

function articleImageEditorUrlAllowedV3(value: string): boolean {
  if (value.length === 0) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:"
      || (url.protocol === "http:"
        && (url.hostname === "localhost" || url.hostname === "127.0.0.1"));
  } catch {
    return false;
  }
}

export function ArticleImageBlockEditorV3({
  block,
  focus,
  onChange,
  onFocusHandled,
  onUpload,
}: Readonly<{
  block: StudioArticleImageBlockV2;
  focus: boolean;
  onChange: (block: StudioArticleImageBlockV2) => void;
  onFocusHandled: () => void;
  onUpload?: ((file: File) => Promise<string>) | undefined;
}>) {
  const { t } = useTranslation();
  const fileRef = React.useRef<HTMLInputElement | null>(null);
  const urlRef = React.useRef<HTMLInputElement | null>(null);
  const [urlDraft, setUrlDraft] = React.useState(block.url);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  React.useEffect(() => setUrlDraft(block.url), [block.url]);
  React.useEffect(() => {
    if (!focus) return;
    urlRef.current?.focus();
    onFocusHandled();
  }, [focus, onFocusHandled]);

  const commitUrl = () => {
    const next = urlDraft.trim();
    if (!articleImageEditorUrlAllowedV3(next)) {
      setError(t("articleEditor.image.invalidUrl"));
      return;
    }
    setError(null);
    if (next !== block.url) onChange({ ...block, url: next });
  };

  const upload = async (file: File) => {
    if (onUpload === undefined) return;
    setUploading(true);
    setError(null);
    try {
      const url = await onUpload(file);
      setUrlDraft(url);
      onChange({ ...block, url });
    } catch (cause) {
      setError(articleEditorErrorMessageV3(cause));
    } finally {
      setUploading(false);
      if (fileRef.current !== null) fileRef.current.value = "";
    }
  };

  return (
    <div className="my-4" data-article-block-kind="image">
      {block.url.length > 0 && (
        <ArticleImagePresentationV3 block={block} className="my-4" />
      )}
      <div className="rounded-xl bg-wb-soft/55 px-4 py-3.5 focus-within:bg-wb-soft">
        <div className="flex flex-wrap items-center gap-2">
          {onUpload !== undefined && (
            <>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
                className="sr-only"
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0];
                  if (file !== undefined) void upload(file);
                }}
              />
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
                className="inline-flex min-h-8 items-center gap-1.5 rounded-lg bg-wb-panel px-3 text-xs font-semibold text-wb-text shadow-sm ring-1 ring-wb-line/70 hover:bg-wb-hover disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
              >
                {uploading
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <Upload className="h-3.5 w-3.5" />}
                {uploading
                  ? t("articleEditor.image.uploading")
                  : t("articleEditor.image.upload")}
              </button>
            </>
          )}
          <label className="min-w-52 flex-1">
            <span className="sr-only">{t("articleEditor.image.url")}</span>
            <input
              ref={urlRef}
              type="url"
              value={urlDraft}
              onChange={(event) => {
                setUrlDraft(event.currentTarget.value);
                setError(null);
              }}
              onBlur={commitUrl}
              onKeyDown={(event) => {
                if (articleEditorInputIsComposingV3(event.nativeEvent)) return;
                if (event.key === "Enter") {
                  event.preventDefault();
                  commitUrl();
                }
              }}
              placeholder={t("articleEditor.image.urlPlaceholder")}
              className="min-h-8 w-full rounded-lg bg-wb-panel px-3 text-xs text-wb-text outline-none ring-1 ring-wb-line/70 placeholder:text-wb-subtle focus:ring-2 focus:ring-wb-accent"
            />
          </label>
        </div>
        {error !== null && (
          <p className="mt-2 text-xs text-wb-danger" role="alert">{error}</p>
        )}
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <label className="text-[11px] font-medium text-wb-muted">
            {t("articleEditor.image.altText")}
            <input
              type="text"
              value={block.altText}
              onChange={(event) => onChange({
                ...block,
                altText: event.currentTarget.value,
              })}
              placeholder={t("articleEditor.image.altPlaceholder")}
              className="mt-1 block min-h-8 w-full rounded-lg bg-wb-panel px-3 text-xs text-wb-text outline-none ring-1 ring-wb-line/70 placeholder:text-wb-subtle focus:ring-2 focus:ring-wb-accent"
            />
          </label>
          <label className="text-[11px] font-medium text-wb-muted">
            {t("articleEditor.image.caption")}
            <input
              type="text"
              value={block.caption}
              onChange={(event) => onChange({
                ...block,
                caption: event.currentTarget.value,
              })}
              placeholder={t("articleEditor.image.captionPlaceholder")}
              className="mt-1 block min-h-8 w-full rounded-lg bg-wb-panel px-3 text-xs text-wb-text outline-none ring-1 ring-wb-line/70 placeholder:text-wb-subtle focus:ring-2 focus:ring-wb-accent"
            />
          </label>
        </div>
      </div>
    </div>
  );
}

export function ArticleLinkBlockEditorV3({
  block,
  focus,
  onChange,
  onFocusHandled,
}: Readonly<{
  block: StudioArticleLinkBlockV2;
  focus: boolean;
  onChange: (block: StudioArticleLinkBlockV2) => void;
  onFocusHandled: () => void;
}>) {
  const { t } = useTranslation();
  const labelRef = React.useRef<HTMLInputElement | null>(null);
  const [hrefDraft, setHrefDraft] = React.useState(block.href);
  const [hrefError, setHrefError] = React.useState<string | null>(null);
  React.useEffect(() => {
    setHrefDraft(block.href);
  }, [block.href]);
  React.useEffect(() => {
    if (!focus) return;
    labelRef.current?.focus();
    onFocusHandled();
  }, [focus, onFocusHandled]);
  const commitHref = () => {
    const href = hrefDraft.trim();
    if (!articleLinkEditorHrefAllowedV3(href)) {
      setHrefError(t("articleEditor.link.invalidUrl"));
      return;
    }
    setHrefError(null);
    setHrefDraft(href);
    if (href !== block.href) onChange({ ...block, href });
  };
  return (
    <div className="my-4" data-article-block-kind="link">
      <ArticleLinkPresentationV3 block={block} className="my-3" />
      <div className="rounded-xl bg-wb-soft/55 px-4 py-3.5 focus-within:bg-wb-soft">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-wb-subtle">
          <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
          {t("articleEditor.link.label")}
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <label className="text-[11px] font-medium text-wb-muted">
            {t("articleEditor.link.text")}
            <input
              ref={labelRef}
              type="text"
              value={block.label}
              onChange={(event) => onChange({ ...block, label: event.currentTarget.value })}
              placeholder={t("articleEditor.link.textPlaceholder")}
              className="mt-1 block min-h-9 w-full rounded-lg bg-wb-panel px-3 text-xs text-wb-text outline-none ring-1 ring-wb-line/70 placeholder:text-wb-subtle focus:ring-2 focus:ring-wb-accent"
            />
          </label>
          <label className="text-[11px] font-medium text-wb-muted">
            {t("articleEditor.link.url")}
            <input
              type="text"
              value={hrefDraft}
              onChange={(event) => {
                const href = event.currentTarget.value;
                setHrefDraft(href);
                setHrefError(null);
                if (articleLinkEditorHrefAllowedV3(href)) {
                  onChange({ ...block, href });
                }
              }}
              onBlur={commitHref}
              onKeyDown={(event) => {
                if (articleEditorInputIsComposingV3(event.nativeEvent)) return;
                if (event.key === "Enter") {
                  event.preventDefault();
                  commitHref();
                }
              }}
              placeholder={t("articleEditor.link.urlPlaceholder")}
              className="mt-1 block min-h-9 w-full rounded-lg bg-wb-panel px-3 font-mono text-xs text-wb-text outline-none ring-1 ring-wb-line/70 placeholder:text-wb-subtle focus:ring-2 focus:ring-wb-accent"
            />
          </label>
        </div>
        {hrefError !== null && (
          <p className="mt-2 text-xs text-wb-danger" role="alert">{hrefError}</p>
        )}
        <label className="mt-2 block text-[11px] font-medium text-wb-muted">
          {t("articleEditor.link.description")}
          <input
            type="text"
            value={block.description}
            onChange={(event) => onChange({
              ...block,
              description: event.currentTarget.value,
            })}
            placeholder={t("articleEditor.link.descriptionPlaceholder")}
            className="mt-1 block min-h-9 w-full rounded-lg bg-wb-panel px-3 text-xs text-wb-text outline-none ring-1 ring-wb-line/70 placeholder:text-wb-subtle focus:ring-2 focus:ring-wb-accent"
          />
        </label>
      </div>
    </div>
  );
}

function articleLinkEditorHrefAllowedV3(value: string): boolean {
  if (value.length === 0) return true;
  if (
    value.startsWith("/")
    && !value.startsWith("//")
    && !/[\\\u0000-\u001f\u007f]/.test(value)
  ) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:"
      || (url.protocol === "http:"
        && (url.hostname === "localhost" || url.hostname === "127.0.0.1"));
  } catch {
    return false;
  }
}

export function ArticleQuizBlockEditorV3({
  block,
  focus,
  onChange,
  onFocusHandled,
}: Readonly<{
  block: StudioArticleQuizBlockV2;
  focus: boolean;
  onChange: (block: StudioArticleQuizBlockV2) => void;
  onFocusHandled: () => void;
}>) {
  const { t } = useTranslation();
  const questionRef = React.useRef<HTMLTextAreaElement | null>(null);
  React.useEffect(() => {
    if (!focus) return;
    questionRef.current?.focus();
    onFocusHandled();
  }, [focus, onFocusHandled]);
  const updateChoice = (choiceId: string, label: string) => onChange({
    ...block,
    choices: Object.freeze(block.choices.map((choice) =>
      choice.choiceId === choiceId ? { ...choice, label } : choice)),
  });
  return (
    <div
      className="my-4 rounded-xl bg-wb-soft/55 px-4 py-4 focus-within:bg-wb-soft"
      data-article-block-kind="quiz"
    >
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-wb-subtle">
        <ListChecks className="h-3.5 w-3.5" aria-hidden="true" />
        {t("articleEditor.quiz.label")}
      </div>
      <label className="mt-3 block text-[11px] font-medium text-wb-muted">
        {t("articleEditor.quiz.question")}
        <textarea
          ref={questionRef}
          rows={2}
          value={block.question}
          onChange={(event) => onChange({ ...block, question: event.currentTarget.value })}
          placeholder={t("articleEditor.quiz.questionPlaceholder")}
          className="mt-1 block min-h-14 w-full resize-y rounded-lg bg-wb-panel px-3 py-2 text-sm leading-6 text-wb-text outline-none ring-1 ring-wb-line/70 placeholder:text-wb-subtle focus:ring-2 focus:ring-wb-accent"
        />
      </label>
      <div className="mt-3 space-y-2">
        {block.choices.map((choice, index) => (
          <div key={choice.choiceId} className="flex items-center gap-2">
            <input
              type="radio"
              name={`editor-correct-${block.blockId}`}
              checked={block.correctChoiceId === choice.choiceId}
              onChange={() => onChange({ ...block, correctChoiceId: choice.choiceId })}
              aria-label={t("articleEditor.quiz.correctChoice", { index: index + 1 })}
              className="h-4 w-4 shrink-0 accent-[var(--wb-accent)]"
            />
            <input
              type="text"
              value={choice.label}
              onChange={(event) => updateChoice(choice.choiceId, event.currentTarget.value)}
              placeholder={t("articleEditor.quiz.choicePlaceholder", { index: index + 1 })}
              className="min-h-9 min-w-0 flex-1 rounded-lg bg-wb-panel px-3 text-xs text-wb-text outline-none ring-1 ring-wb-line/70 placeholder:text-wb-subtle focus:ring-2 focus:ring-wb-accent"
            />
            <button
              type="button"
              disabled={block.choices.length <= 2}
              onClick={() => {
                const choices = block.choices.filter((candidate) =>
                  candidate.choiceId !== choice.choiceId);
                onChange({
                  ...block,
                  choices: Object.freeze(choices),
                  correctChoiceId: block.correctChoiceId === choice.choiceId
                    ? choices[0]?.choiceId ?? block.correctChoiceId
                    : block.correctChoiceId,
                });
              }}
              aria-label={t("articleEditor.quiz.removeChoice")}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-wb-subtle transition-[background-color,color,transform] duration-150 hover:bg-wb-hover hover:text-wb-danger active:scale-[0.96] disabled:pointer-events-none disabled:opacity-25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        disabled={block.choices.length >= 8}
        onClick={() => onChange({
          ...block,
          choices: Object.freeze([...block.choices, {
            choiceId: portableArticleEditorIdV3("choice"),
            label: "",
          }]),
        })}
        className="mt-2 inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-wb-muted transition-[background-color,color,transform] duration-150 hover:bg-wb-hover hover:text-wb-text active:scale-[0.97] disabled:pointer-events-none disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
      >
        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
        {t("articleEditor.quiz.addChoice")}
      </button>
      <label className="mt-3 block text-[11px] font-medium text-wb-muted">
        {t("articleEditor.quiz.explanation")}
        <textarea
          rows={3}
          value={block.explanation}
          onChange={(event) => onChange({ ...block, explanation: event.currentTarget.value })}
          placeholder={t("articleEditor.quiz.explanationPlaceholder")}
          className="mt-1 block min-h-16 w-full resize-y rounded-lg bg-wb-panel px-3 py-2 text-xs leading-6 text-wb-text outline-none ring-1 ring-wb-line/70 placeholder:text-wb-subtle focus:ring-2 focus:ring-wb-accent"
        />
      </label>
    </div>
  );
}
