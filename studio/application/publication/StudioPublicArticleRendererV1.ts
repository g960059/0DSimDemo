import katex from "katex";

import type {
  StudioArticleAccordionContentBlockV2,
  StudioArticleBlockV2,
  StudioArticleExperimentBlockV2,
  StudioArticleQuizBlockV2,
} from "@/studio/contracts/v2/article";
import type {
  StudioPublishedArticleV1,
} from "@/studio/application/publication/StudioPublishedArticleV1";
import {
  renderStudioPublicArticleBootstrapV1,
} from "@/studio/application/publication/StudioPublicArticleBootstrapV1";
import {
  formatStudioPublicArticleDateV1,
  studioPublicArticlePresentationCopyV1,
} from "@/studio/application/publication/StudioPublicArticlePresentationV1";
import {
  articleBriefingPresentationV3,
} from "@/studio/application/authoring/StudioArticleBriefingPresentationV3";

export type StudioPublicArticleMetadataV1 = Readonly<{
  canonicalUrl: string;
  description: string;
  title: string;
}>;

export type StudioRenderedPublicArticleV1 = Readonly<{
  articleContentId: string;
  bodyHtml: string;
  documentHtml: string;
  json: string;
  markdown: string;
  metadata: StudioPublicArticleMetadataV1;
}>;

const SITE_NAME_V1 = "CircleHeart";

export function renderStudioPublishedArticleV1(input: Readonly<{
  article: StudioPublishedArticleV1;
  clientTemplate: string;
  canonicalOrigin: string;
}>): StudioRenderedPublicArticleV1 {
  const metadata = publicArticleMetadataV1(input.article, input.canonicalOrigin);
  const bodyHtml = renderPublicArticleBodyHtmlV1(input.article);
  return Object.freeze({
    articleContentId: input.article.articleContentId,
    bodyHtml,
    documentHtml: injectStudioPublicDocumentV1({
      bodyHtml: `${bodyHtml}\n${renderStudioPublicArticleBootstrapV1(input.article)}`,
      clientTemplate: input.clientTemplate,
      description: metadata.description,
      language: input.article.locale,
      title: metadata.title,
      canonicalUrl: metadata.canonicalUrl,
      additionalHeadHtml: publicArticleHeadHtmlV1(input.article, metadata),
    }),
    json: `${JSON.stringify(input.article, null, 2)}\n`,
    markdown: renderPublicArticleMarkdownV1(input.article),
    metadata,
  });
}

export function publicArticleMetadataV1(
  article: StudioPublishedArticleV1,
  canonicalOrigin: string,
): StudioPublicArticleMetadataV1 {
  const origin = new URL(canonicalOrigin);
  if (origin.pathname !== "/" || origin.search || origin.hash) {
    throw new Error("Canonical public origin must not contain a path, query, or hash");
  }
  const canonicalUrl = new URL(
    `/${article.locale}/articles/${encodeURIComponent(article.publicSlug)}`,
    origin,
  ).toString();
  const description = publicArticleDescriptionV1(article.blocks);
  return Object.freeze({
    canonicalUrl,
    description,
    title: `${article.title} | ${SITE_NAME_V1}`,
  });
}

export function publicArticleDescriptionV1(
  blocks: readonly StudioArticleBlockV2[],
): string {
  const text = firstMeaningfulTextV1(blocks) ?? SITE_NAME_V1;
  return truncateAtCodePointsV1(collapsedWhitespaceV1(text), 180);
}

export function renderPublicArticleBodyHtmlV1(
  article: StudioPublishedArticleV1,
): string {
  const copy = studioPublicArticlePresentationCopyV1(article.locale);
  return [
    `<main class="public-static-shell article-document-shell" data-public-article-content-id="${escapeHtmlAttributeV1(article.articleContentId)}">`,
    `<article class="public-static-article article-document">`,
    `<header class="article-document-header">`,
    `<h1 class="article-title">${escapeHtmlTextV1(article.title)}</h1>`,
    `<p class="article-publication-date"><span>${copy.publishedLabel}</span> <time datetime="${escapeHtmlAttributeV1(article.publishedAt)}">${escapeHtmlTextV1(formatStudioPublicArticleDateV1(article.publishedAt, article.locale))}</time></p>`,
    `</header>`,
    `<div class="public-static-content">`,
    ...article.blocks.map((block) => renderBlockHtmlV1(block, article.locale)),
    `</div>`,
    `</article>`,
    `</main>`,
  ].join("\n");
}

export function renderPublicArticleMarkdownV1(
  article: StudioPublishedArticleV1,
): string {
  const frontmatter = [
    "---",
    `title: ${yamlStringV1(article.title)}`,
    `locale: ${yamlStringV1(article.locale)}`,
    `public_slug: ${yamlStringV1(article.publicSlug)}`,
    `published_at: ${yamlStringV1(article.publishedAt)}`,
    `updated_at: ${yamlStringV1(article.updatedAt)}`,
    `article_content_id: ${yamlStringV1(article.articleContentId)}`,
    "---",
    "",
    `# ${article.title}`,
    "",
  ];
  return `${[
    ...frontmatter,
    ...article.blocks.flatMap((block) =>
      renderBlockMarkdownV1(block, article.locale)),
  ].join("\n").trimEnd()}\n`;
}

export function injectStudioPublicDocumentV1(input: Readonly<{
  additionalHeadHtml?: string;
  bodyHtml: string;
  canonicalUrl: string;
  clientTemplate: string;
  description: string;
  language: "ja" | "en";
  title: string;
}>): string {
  if (!/<div\s+id=["']root["'][^>]*><\/div>/.test(input.clientTemplate)) {
    throw new Error("Client template is missing an empty #root element");
  }
  const head = [
    `<title>${escapeHtmlTextV1(input.title)}</title>`,
    `<meta name="description" content="${escapeHtmlAttributeV1(input.description)}" />`,
    `<link rel="canonical" href="${escapeHtmlAttributeV1(input.canonicalUrl)}" />`,
    input.additionalHeadHtml ?? "",
  ].filter(Boolean).join("\n    ");

  return input.clientTemplate
    .replace(/<html\s+lang=["'][^"']*["']/, `<html lang="${input.language}"`)
    .replace(/<title>[^<]*<\/title>/, head)
    .replace(
      /<div\s+id=["']root["'][^>]*><\/div>/,
      `<div id="public-static-root">${publicStaticSiteHeaderHtmlV1(input.language, input.canonicalUrl)}${input.bodyHtml}</div><div id="root" hidden></div>`,
    );
}

function publicArticleHeadHtmlV1(
  article: StudioPublishedArticleV1,
  metadata: StudioPublicArticleMetadataV1,
): string {
  const markdownUrl = `${metadata.canonicalUrl}.md`;
  const jsonUrl = new URL(
    `/api/v1/public/articles/${article.publicSlug}`,
    metadata.canonicalUrl,
  ).toString();
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    inLanguage: article.locale,
    mainEntityOfPage: metadata.canonicalUrl,
    publisher: {
      "@type": "Organization",
      name: SITE_NAME_V1,
      url: new URL(metadata.canonicalUrl).origin,
    },
  }).replaceAll("<", "\\u003c");
  return [
    `<meta property="og:type" content="article" />`,
    `<meta property="og:site_name" content="${SITE_NAME_V1}" />`,
    `<meta property="og:title" content="${escapeHtmlAttributeV1(article.title)}" />`,
    `<meta property="og:description" content="${escapeHtmlAttributeV1(metadata.description)}" />`,
    `<meta property="og:url" content="${escapeHtmlAttributeV1(metadata.canonicalUrl)}" />`,
    `<meta name="twitter:card" content="summary" />`,
    `<meta name="twitter:title" content="${escapeHtmlAttributeV1(article.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtmlAttributeV1(metadata.description)}" />`,
    `<meta property="article:published_time" content="${escapeHtmlAttributeV1(article.publishedAt)}" />`,
    `<meta property="article:modified_time" content="${escapeHtmlAttributeV1(article.updatedAt)}" />`,
    `<link rel="alternate" hreflang="${article.locale}" href="${escapeHtmlAttributeV1(metadata.canonicalUrl)}" />`,
    `<link rel="alternate" type="text/markdown" href="${escapeHtmlAttributeV1(markdownUrl)}" title="${escapeHtmlAttributeV1(article.title)}" />`,
    `<link rel="alternate" type="application/json" href="${escapeHtmlAttributeV1(jsonUrl)}" title="${escapeHtmlAttributeV1(article.title)}" />`,
    `<script type="application/ld+json">${jsonLd}</script>`,
  ].join("\n    ");
}

function renderBlockHtmlV1(
  block: StudioArticleBlockV2 | StudioArticleAccordionContentBlockV2,
  locale: "ja" | "en",
): string {
  const anchor = `block-${block.blockId}`;
  if (block.kind === "heading") {
    const level = block.level === 2 ? "h2" : "h3";
    const className = block.level === 2 ? "article-heading-2" : "article-heading-3";
    return `<${level} class="${className}" id="${escapeHtmlAttributeV1(anchor)}">${escapeHtmlTextV1(block.text)}</${level}>`;
  }
  if (block.kind === "paragraph") {
    return `<p class="article-paragraph" id="${escapeHtmlAttributeV1(anchor)}">${escapeHtmlTextV1(block.text)}</p>`;
  }
  if (block.kind === "equation") {
    const equation = block.expression.length === 0
      ? ""
      : katex.renderToString(block.expression, {
          displayMode: true,
          output: "htmlAndMathml",
          strict: false,
          throwOnError: false,
          trust: false,
        });
    return `<figure class="public-static-equation" id="${escapeHtmlAttributeV1(anchor)}"><div>${equation}</div><figcaption class="sr-only">TeX: ${escapeHtmlTextV1(block.expression)}</figcaption></figure>`;
  }
  if (block.kind === "image") {
    if (block.url.length === 0) return "";
    const caption = block.caption.length === 0
      ? ""
      : `<figcaption>${escapeHtmlTextV1(block.caption)}</figcaption>`;
    return `<figure class="public-static-image" id="${escapeHtmlAttributeV1(anchor)}"><img src="${escapeHtmlAttributeV1(block.url)}" alt="${escapeHtmlAttributeV1(block.altText)}" loading="lazy" decoding="async" referrerpolicy="no-referrer" />${caption}</figure>`;
  }
  if (block.kind === "divider") {
    return `<hr id="${escapeHtmlAttributeV1(anchor)}" />`;
  }
  if (block.kind === "link") {
    if (block.href.length === 0 || block.label.length === 0) return "";
    const external = !block.href.startsWith("/");
    const description = block.description.length === 0
      ? ""
      : `<span>${escapeHtmlTextV1(block.description)}</span>`;
    const host = publicArticleLinkHostLabelV1(block.href);
    return `<a class="article-link-card public-static-link" id="${escapeHtmlAttributeV1(anchor)}" href="${escapeHtmlAttributeV1(block.href)}"${external ? " target=\"_blank\" rel=\"noreferrer\"" : ""}><span class="article-link-card-leading" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M9 17H7A5 5 0 0 1 7 7h2"></path><path d="M15 7h2a5 5 0 1 1 0 10h-2"></path><path d="M8 12h8"></path></svg></span><span class="public-static-link-copy"><strong>${escapeHtmlTextV1(block.label)}</strong>${description}<span class="public-static-link-host">${escapeHtmlTextV1(host)}</span></span></a>`;
  }
  if (block.kind === "quiz") return renderQuizHtmlV1(block, anchor, locale);
  if (block.kind === "accordion") {
    return `<details class="article-accordion public-static-accordion" id="${escapeHtmlAttributeV1(anchor)}"><summary class="article-accordion-summary"><span class="article-accordion-toggle" aria-hidden="true">›</span>${escapeHtmlTextV1(block.title)}</summary><div>${block.blocks.map((nested) => renderBlockHtmlV1(nested, locale)).join("\n")}</div></details>`;
  }
  return renderExperimentHtmlV1(block, anchor, locale);
}

function publicArticleLinkHostLabelV1(href: string): string {
  if (href.startsWith("/")) return "CircleHeart";
  try {
    return new URL(href).hostname.replace(/^www\./, "");
  } catch {
    return href;
  }
}

function renderQuizHtmlV1(
  block: StudioArticleQuizBlockV2,
  anchor: string,
  locale: "ja" | "en",
): string {
  const choices = block.choices.map((choice) =>
    `<li>${escapeHtmlTextV1(choice.label)}</li>`).join("");
  const answer = block.explanation.length === 0
    ? ""
    : `<p>${escapeHtmlTextV1(block.explanation)}</p>`;
  const quizLabel = locale === "ja" ? "確認問題" : "Quiz";
  const answerLabel = locale === "ja" ? "答えと解説" : "Answer and explanation";
  const correctChoice = block.choices.find(({ choiceId }) =>
    choiceId === block.correctChoiceId);
  const correctLabel = locale === "ja" ? "正解" : "Correct answer";
  const correct = correctChoice === undefined
    ? ""
    : `<p><strong>${correctLabel}:</strong> ${escapeHtmlTextV1(correctChoice.label)}</p>`;
  return `<section class="public-static-quiz" id="${escapeHtmlAttributeV1(anchor)}"><p class="public-static-label">${quizLabel}</p><h3>${escapeHtmlTextV1(block.question)}</h3><ol>${choices}</ol><details><summary>${answerLabel}</summary>${correct}${answer}</details></section>`;
}

function renderExperimentHtmlV1(
  block: StudioArticleExperimentBlockV2,
  anchor: string,
  locale: "ja" | "en",
): string {
  const { briefing } = block.placement;
  const presentation = articleBriefingPresentationV3(briefing);
  const title = block.placement.titleOverride ?? briefing.defaultTitle;
  const graphPrefix = locale === "ja" ? "グラフ" : "Graph";
  const labels = [
    ...briefing.graphs.map((graph, index) =>
      graph.overrides?.label ?? `${graphPrefix} ${index + 1}`),
    ...briefing.outputs.map((output) => output.label),
    ...briefing.controls.map((control) => control.label),
  ];
  const caption = block.placement.caption === null
    ? ""
    : `<p>${escapeHtmlTextV1(block.placement.caption)}</p>`;
  const summary = labels.length === 0
    ? ""
    : `<ul>${labels.map((label) => `<li>${escapeHtmlTextV1(label)}</li>`).join("")}</ul>`;
  const label = locale === "ja" ? "インタラクティブ・シミュレーション" : "Interactive simulation";
  const counts = locale === "ja"
    ? `シナリオ ${briefing.scenarioScope.visibleScenarioIds.length}件・グラフ ${briefing.graphs.length}件・出力 ${briefing.outputs.length}件・操作 ${briefing.controls.length}件`
    : `${briefing.scenarioScope.visibleScenarioIds.length} scenario(s), ${briefing.graphs.length} graph(s), ${briefing.outputs.length} output(s), ${briefing.controls.length} control(s)`;
  const jsNote = locale === "ja"
    ? "シミュレーションを操作するにはJavaScriptを有効にしてください。"
    : "Enable JavaScript to explore this simulation.";
  if (presentation !== "inflow") {
    const semanticSummary = [
      label,
      block.placement.caption,
      counts,
      ...labels,
    ].filter((part): part is string => part !== null && part.length > 0).join(". ");
    return `<section class="article-reader-peek-surface public-static-experiment public-static-experiment-${presentation}" id="placement-${escapeHtmlAttributeV1(block.placement.placementId)}" data-block-anchor="${escapeHtmlAttributeV1(anchor)}" data-reader-presentation="${presentation}"><span class="article-link-card-leading" aria-hidden="true">∿</span><span class="public-static-experiment-anchor-copy"><h2>${escapeHtmlTextV1(title)}</h2><p class="public-static-js-note">${jsNote}</p></span><span class="public-static-experiment-chevron" aria-hidden="true">›</span><span class="sr-only">${escapeHtmlTextV1(semanticSummary)}</span></section>`;
  }
  return `<section class="public-static-experiment public-static-experiment-${presentation}" id="placement-${escapeHtmlAttributeV1(block.placement.placementId)}" data-block-anchor="${escapeHtmlAttributeV1(anchor)}" data-reader-presentation="${presentation}"><p class="public-static-label">${label}</p><h2>${escapeHtmlTextV1(title)}</h2>${caption}<p>${counts}</p>${summary}<p class="public-static-js-note">${jsNote}</p></section>`;
}

function renderBlockMarkdownV1(
  block: StudioArticleBlockV2 | StudioArticleAccordionContentBlockV2,
  locale: "ja" | "en",
): readonly string[] {
  if (block.kind === "heading") {
    return [`${block.level === 2 ? "##" : "###"} ${block.text}`, ""];
  }
  if (block.kind === "paragraph") return [block.text, ""];
  if (block.kind === "equation") return ["$$", block.expression, "$$", ""];
  if (block.kind === "image") {
    if (block.url.length === 0) return [];
    return [
      `![${block.altText}](${block.url})`,
      ...(block.caption.length > 0 ? [block.caption] : []),
      "",
    ];
  }
  if (block.kind === "divider") return ["---", ""];
  if (block.kind === "link") {
    if (block.href.length === 0 || block.label.length === 0) return [];
    return [
      `[${block.label}](${block.href})`,
      ...(block.description.length > 0 ? [block.description] : []),
      "",
    ];
  }
  if (block.kind === "quiz") {
    const quizLabel = locale === "ja" ? "確認問題" : "Quiz";
    const answerLabel = locale === "ja" ? "答えと解説" : "Answer and explanation";
    const correctLabel = locale === "ja" ? "正解" : "Correct answer";
    const correctChoice = block.choices.find(({ choiceId }) =>
      choiceId === block.correctChoiceId);
    return [
      `### ${quizLabel}: ${block.question}`,
      "",
      ...block.choices.map((choice) => `- ${choice.label}`),
      "",
      "<details>",
      `<summary>${answerLabel}</summary>`,
      "",
      ...(correctChoice === undefined
        ? []
        : [`**${correctLabel}:** ${correctChoice.label}`, ""]),
      block.explanation,
      "",
      "</details>",
      "",
    ];
  }
  if (block.kind === "accordion") {
    return [
      "<details>",
      `<summary>${block.title}</summary>`,
      "",
      ...block.blocks.flatMap((nested) => renderBlockMarkdownV1(nested, locale)),
      "</details>",
      "",
    ];
  }
  const title = block.placement.titleOverride
    ?? block.placement.briefing.defaultTitle;
  const briefing = block.placement.briefing;
  const label = locale === "ja"
    ? `インタラクティブ・シミュレーション: ${title}`
    : `Interactive simulation: ${title}`;
  return [
    `## ${label}`,
    "",
    ...(block.placement.caption === null ? [] : [block.placement.caption, ""]),
    `- Scenarios: ${briefing.scenarioScope.visibleScenarioIds.length}`,
    `- Graphs: ${briefing.graphs.length}`,
    `- Outputs: ${briefing.outputs.length}`,
    `- Controls: ${briefing.controls.length}`,
    ...briefing.outputs.map((output) => `- Output: ${output.label}`),
    ...briefing.controls.map((control) => `- Control: ${control.label}`),
    "",
  ];
}

function firstMeaningfulTextV1(
  blocks: readonly (
    StudioArticleBlockV2 | StudioArticleAccordionContentBlockV2
  )[],
): string | null {
  for (const block of blocks) {
    if ((block.kind === "paragraph" || block.kind === "heading") && block.text.trim()) {
      return block.text;
    }
    if (block.kind === "accordion") {
      const nested = firstMeaningfulTextV1(block.blocks);
      if (nested !== null) return nested;
    }
    if (block.kind === "quiz" && block.question.trim()) return block.question;
    if (block.kind === "link") {
      if (block.description.trim()) return block.description;
      if (block.label.trim()) return block.label;
    }
    if (block.kind === "image") {
      if (block.caption.trim()) return block.caption;
      if (block.altText.trim()) return block.altText;
    }
    if (block.kind === "experiment") {
      if (block.placement.caption?.trim()) return block.placement.caption;
      if (block.placement.titleOverride?.trim()) {
        return block.placement.titleOverride;
      }
      if (block.placement.briefing.defaultTitle.trim()) {
        return block.placement.briefing.defaultTitle;
      }
    }
  }
  return null;
}

function collapsedWhitespaceV1(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function truncateAtCodePointsV1(value: string, maximum: number): string {
  const points = [...value];
  return points.length <= maximum
    ? value
    : `${points.slice(0, Math.max(0, maximum - 1)).join("")}…`;
}

function escapeHtmlTextV1(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeHtmlAttributeV1(value: string): string {
  return escapeHtmlTextV1(value)
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function yamlStringV1(value: string): string {
  return JSON.stringify(value);
}

function publicStaticSiteHeaderHtmlV1(
  locale: "ja" | "en",
  canonicalUrl: string,
): string {
  const canonical = new URL(canonicalUrl);
  const alternateLocale = locale === "ja" ? "en" : "ja";
  const alternatePath = canonical.pathname.replace(
    /^\/(?:ja|en)(?=\/|$)/,
    `/${alternateLocale}`,
  );
  const homeLabel = locale === "ja" ? "ホーム" : "Home";
  const simulationLabel = locale === "ja" ? "シミュレーションを始める" : "Start a simulation";
  const loginLabel = locale === "ja" ? "ログイン" : "Log in";
  return [
    `<header class="public-static-site-header">`,
    `<a class="public-static-brand" href="/${locale}" aria-label="${homeLabel}">${SITE_NAME_V1}</a>`,
    `<span class="public-static-site-header-spacer"></span>`,
    `<nav class="public-static-language" aria-label="${locale === "ja" ? "言語" : "Language"}">`,
    `<a${locale === "ja" ? " aria-current=\"true\"" : ""} href="${locale === "ja" ? canonical.pathname : alternatePath}">JA</a>`,
    `<a${locale === "en" ? " aria-current=\"true\"" : ""} href="${locale === "en" ? canonical.pathname : alternatePath}">EN</a>`,
    `</nav>`,
    `<span class="public-static-theme-icon" aria-hidden="true"><span class="public-static-theme-sun">${sunIconHtmlV1()}</span><span class="public-static-theme-moon">${moonIconHtmlV1()}</span></span>`,
    `<a class="public-static-primary-icon" href="/${locale}/experiments/new" aria-label="${simulationLabel}">${flaskIconHtmlV1()}</a>`,
    `<a class="public-static-quiet-icon" href="/${locale}/login" aria-label="${loginLabel}">${loginIconHtmlV1()}</a>`,
    `</header>`,
  ].join("");
}

function sunIconHtmlV1(): string {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41"></path></svg>`;
}

function moonIconHtmlV1(): string {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"></path></svg>`;
}

function flaskIconHtmlV1(): string {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.75 3h10.5A2 2 0 0 0 19 18l-5-9V3M7.5 15h9"></path></svg>`;
}

function loginIconHtmlV1(): string {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 17l5-5-5-5M15 12H3M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path></svg>`;
}
