import React from "react";
import katex from "katex";
import {
  Check,
  ChevronRight,
  CircleHelp,
  ExternalLink,
  Link2,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import type {
  StudioArticleAccordionBlockV2,
  StudioArticleAccordionContentBlockV2,
  StudioArticleDividerBlockV2,
  StudioArticleEquationBlockV2,
  StudioArticleImageBlockV2,
  StudioArticleLinkBlockV2,
  StudioArticleQuizBlockV2,
} from "@/studio/contracts/v2/article";

export function renderArticleEquationHtmlV3(expression: string): string {
  if (expression.length === 0) return "";
  return katex.renderToString(expression, {
    displayMode: true,
    output: "htmlAndMathml",
    strict: false,
    throwOnError: false,
    trust: false,
  });
}

export function ArticleEquationPresentationV3({
  block,
  className = "",
}: Readonly<{
  block: StudioArticleEquationBlockV2;
  className?: string;
}>) {
  const html = React.useMemo(
    () => renderArticleEquationHtmlV3(block.expression),
    [block.expression],
  );
  if (html.length === 0) return null;
  return (
    <div
      className={`article-equation-v3 overflow-x-auto py-3 text-center text-wb-text ${className}`}
      data-testid="article-equation-v3"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function ArticleImagePresentationV3({
  block,
  className = "",
}: Readonly<{
  block: StudioArticleImageBlockV2;
  className?: string;
}>) {
  if (block.url.length === 0) return null;
  return (
    <figure className={`my-8 ${className}`} data-testid="article-image-v3">
      <img
        src={block.url}
        alt={block.altText}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        className="mx-auto max-h-[72vh] w-auto max-w-full rounded-xl object-contain"
      />
      {block.caption.length > 0 && (
        <figcaption className="mx-auto mt-3 max-w-2xl text-center text-sm leading-6 text-wb-muted">
          {block.caption}
        </figcaption>
      )}
    </figure>
  );
}

export function ArticleDividerPresentationV3({
  block: _block,
  className = "",
}: Readonly<{
  block: StudioArticleDividerBlockV2;
  className?: string;
}>) {
  return (
    <hr
      className={`my-10 border-0 border-t border-wb-line/70 ${className}`}
      data-testid="article-divider-v3"
    />
  );
}

export function ArticleLinkPresentationV3({
  block,
  className = "",
}: Readonly<{
  block: StudioArticleLinkBlockV2;
  className?: string;
}>) {
  if (block.href.length === 0 || block.label.length === 0) return null;
  const external = !block.href.startsWith("/");
  const host = articleLinkHostLabelV3(block.href);
  return (
    <a
      href={block.href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className={`article-link-card group/link my-8 flex items-center gap-3.5 px-4 py-3.5 text-left transition-[border-color,background-color,box-shadow,transform] duration-150 active:scale-[0.995] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent ${className}`}
      data-testid="article-link-v3"
    >
      <span className="article-link-card-leading" aria-hidden="true">
        <Link2 className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold leading-6 text-wb-text">
          {block.label}
        </span>
        {block.description.length > 0 && (
          <span className="mt-1 block text-[13px] leading-5 text-wb-muted">
            {block.description}
          </span>
        )}
        <span className="mt-1.5 block truncate text-xs leading-5 text-wb-subtle">
          {host}
        </span>
      </span>
      {external ? (
        <ExternalLink
          className="h-4 w-4 shrink-0 text-wb-subtle transition-transform duration-150 group-hover/link:translate-x-0.5"
          aria-hidden="true"
        />
      ) : (
        <ChevronRight
          className="h-4 w-4 shrink-0 text-wb-subtle transition-transform duration-150 group-hover/link:translate-x-0.5"
          aria-hidden="true"
        />
      )}
    </a>
  );
}

export function ArticleQuizPresentationV3({
  block,
  className = "",
}: Readonly<{
  block: StudioArticleQuizBlockV2;
  className?: string;
}>) {
  const { t } = useTranslation();
  const groupId = React.useId();
  const [selectedChoiceId, setSelectedChoiceId] = React.useState<string | null>(null);
  const [submitted, setSubmitted] = React.useState(false);
  const correct = selectedChoiceId === block.correctChoiceId;
  return (
    <section
      className={`relative my-10 overflow-hidden rounded-xl border border-wb-line/60 bg-wb-soft/50 px-5 py-5 before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-wb-accent sm:px-6 sm:py-6 ${className}`}
      data-testid="article-quiz-v3"
    >
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-wb-accent">
        <CircleHelp className="h-4 w-4" aria-hidden="true" />
        {t("articleReader.quiz.label")}
      </div>
      <fieldset className="mt-3">
        <legend className="text-[17px] font-semibold leading-8 text-wb-text">
          {block.question}
        </legend>
        <div className="mt-4 divide-y divide-wb-line/65 overflow-hidden rounded-xl border border-wb-line/65 bg-wb-panel/65">
          {block.choices.map((choice) => {
            const selected = selectedChoiceId === choice.choiceId;
            const choiceCorrect = choice.choiceId === block.correctChoiceId;
            const resolvedClass = submitted && choiceCorrect
              ? "bg-wb-success/10 ring-1 ring-inset ring-wb-success/40"
              : submitted && selected && !choiceCorrect
                ? "bg-wb-danger/10 ring-1 ring-inset ring-wb-danger/35"
                : selected
                  ? "bg-wb-panel ring-1 ring-inset ring-wb-accent/55"
                  : "hover:bg-wb-hover";
            return (
              <label
                key={choice.choiceId}
                className={`flex min-h-12 cursor-pointer items-center gap-3 px-3.5 py-2.5 text-[15px] leading-6 transition-[background-color,box-shadow] duration-150 ${resolvedClass}`}
              >
                <input
                  type="radio"
                  name={groupId}
                  value={choice.choiceId}
                  checked={selected}
                  disabled={submitted}
                  onChange={() => setSelectedChoiceId(choice.choiceId)}
                  className="h-4 w-4 shrink-0 accent-[var(--wb-accent)]"
                />
                <span className="text-wb-text">{choice.label}</span>
                {submitted && choiceCorrect && (
                  <Check className="ml-auto h-4 w-4 shrink-0 text-wb-success" aria-hidden="true" />
                )}
              </label>
            );
          })}
        </div>
      </fieldset>
      {!submitted ? (
        <button
          type="button"
          disabled={selectedChoiceId === null}
          onClick={() => setSubmitted(true)}
          className="mt-4 inline-flex min-h-9 items-center justify-center rounded-lg bg-wb-primary px-4 text-xs font-semibold text-white transition-[background-color,transform] duration-150 hover:bg-wb-primary-hover active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
        >
          {t("articleReader.quiz.check")}
        </button>
      ) : (
        <div className="mt-4" aria-live="polite">
          <p className={`text-sm font-semibold ${correct ? "text-wb-success" : "text-wb-danger"}`}>
            {correct
              ? t("articleReader.quiz.correct")
              : t("articleReader.quiz.incorrect")}
          </p>
          {block.explanation.length > 0 && (
            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-wb-muted">
              {block.explanation}
            </p>
          )}
          <button
            type="button"
            onClick={() => {
              setSelectedChoiceId(null);
              setSubmitted(false);
            }}
            className="mt-3 text-xs font-semibold text-wb-muted transition-colors duration-150 hover:text-wb-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
          >
            {t("articleReader.quiz.retry")}
          </button>
        </div>
      )}
    </section>
  );
}

export function ArticleAccordionPresentationV3({
  block,
  className = "",
  defaultOpen = false,
}: Readonly<{
  block: StudioArticleAccordionBlockV2;
  className?: string;
  defaultOpen?: boolean;
}>) {
  return (
    <details
      className={`article-accordion group/accordion my-9 bg-transparent ${className}`}
      data-testid="article-accordion-v3"
      open={defaultOpen}
    >
      <summary className="article-accordion-summary flex min-h-14 cursor-pointer list-none items-center gap-3 px-1 py-3.5 text-base font-semibold leading-7 text-wb-text outline-none marker:hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-wb-accent [&::-webkit-details-marker]:hidden">
        <span className="article-accordion-toggle" aria-hidden="true">
          <ChevronRight className="h-3.5 w-3.5 transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] group-open/accordion:rotate-90" />
        </span>
        {block.title}
      </summary>
      <div className="pb-5 pl-11 pr-2 pt-1">
        {block.blocks.map((nested) => (
          <ArticleAccordionContentPresentationV3
            key={nested.blockId}
            block={nested}
          />
        ))}
      </div>
    </details>
  );
}

function articleLinkHostLabelV3(href: string): string {
  if (href.startsWith("/")) return "CircleHeart";
  try {
    return new URL(href).hostname.replace(/^www\./, "");
  } catch {
    return href;
  }
}

function ArticleAccordionContentPresentationV3({
  block,
}: Readonly<{ block: StudioArticleAccordionContentBlockV2 }>) {
  if (block.kind === "heading") {
    const Heading = block.level === 2 ? "h3" : "h4";
    return (
      <Heading className="mb-3 mt-6 text-base font-semibold leading-7 text-wb-text">
        {block.text}
      </Heading>
    );
  }
  if (block.kind === "paragraph") {
    return (
      <p className="my-4 whitespace-pre-wrap text-[15px] leading-7 text-wb-text sm:text-base sm:leading-8">
        {block.text}
      </p>
    );
  }
  if (block.kind === "equation") {
    return <ArticleEquationPresentationV3 block={block} className="my-5" />;
  }
  if (block.kind === "image") return <ArticleImagePresentationV3 block={block} />;
  if (block.kind === "divider") {
    return <ArticleDividerPresentationV3 block={block} className="my-6" />;
  }
  if (block.kind === "link") return <ArticleLinkPresentationV3 block={block} />;
  return <ArticleQuizPresentationV3 block={block} className="my-6" />;
}
