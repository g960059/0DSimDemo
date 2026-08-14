import enTranslation from "@/locales/en/translation.json";
import jaTranslation from "@/locales/ja/translation.json";
import {
  renderStudioPublicHomeBootstrapV1,
  type StudioPublicHomeBootstrapV1,
  validateStudioPublicHomeBootstrapV1,
} from "@/studio/application/publication/StudioPublicHomeBootstrapV1";
import {
  injectStudioPublicDocumentV1,
} from "@/studio/application/publication/StudioPublicArticleRendererV1";

const SITE_NAME_V1 = "CircleHeart";
const HOME_VISIBLE_ITEM_LIMIT_V1 = 6;

export type StudioRenderedPublicHomeV1 = Readonly<{
  bodyHtml: string;
  documentHtml: string;
  canonicalUrl: string;
  description: string;
  title: string;
}>;

export function renderStudioPublicHomeV1(input: Readonly<{
  bootstrap: StudioPublicHomeBootstrapV1;
  canonicalOrigin: string;
  clientTemplate: string;
}>): StudioRenderedPublicHomeV1 {
  const bootstrap = validateStudioPublicHomeBootstrapV1(input.bootstrap);
  const canonicalUrl = canonicalHomeUrlV1(input.canonicalOrigin, bootstrap.locale);
  const copy = homeCopyV1(bootstrap.locale);
  const title = `${SITE_NAME_V1} | ${copy.headline}`;
  const bodyHtml = publicHomeBodyHtmlV1(bootstrap);
  return Object.freeze({
    bodyHtml,
    canonicalUrl,
    description: copy.lead,
    title,
    documentHtml: injectStudioPublicDocumentV1({
      additionalHeadHtml: publicHomeHeadHtmlV1({
        canonicalOrigin: input.canonicalOrigin,
        canonicalUrl,
        description: copy.lead,
        locale: bootstrap.locale,
        title,
      }),
      bodyHtml: `${bodyHtml}\n${renderStudioPublicHomeBootstrapV1(bootstrap)}`,
      canonicalUrl,
      clientTemplate: input.clientTemplate,
      description: copy.lead,
      language: bootstrap.locale,
      title,
    }),
  });
}

function publicHomeBodyHtmlV1(
  bootstrap: StudioPublicHomeBootstrapV1,
): string {
  const { locale } = bootstrap;
  const copy = homeCopyV1(locale);
  const articles = bootstrap.articles.slice(0, HOME_VISIBLE_ITEM_LIMIT_V1);
  const experiments = bootstrap.experiments.slice(0, HOME_VISIBLE_ITEM_LIMIT_V1);
  return [
    `<main class="public-static-shell public-static-home" data-public-static-scroll-host="true">`,
    `<div class="public-static-home-inner">`,
    `<section class="public-static-home-hero">`,
    `<h1>${escapeHtmlTextV1(copy.headline)}</h1>`,
    `<p>${escapeHtmlTextV1(copy.lead)}</p>`,
    `<a class="public-static-home-primary" href="/${locale}/experiments/new">${flaskIconHtmlV1()}<span>${escapeHtmlTextV1(copy.startExperiment)}</span></a>`,
    `</section>`,
    publicHomeSectionHtmlV1({
      cards: articles.length === 0
        ? publicHomeEmptyHtmlV1({
            icon: bookIconHtmlV1(),
            message: copy.noArticles,
          })
        : `<ul class="public-static-home-grid">${articles.map((article) => {
            const date = formatDateV1(article.publishedAt, locale);
            const excerpt = article.excerpt === null
              ? copy.articleFallback
              : article.excerpt;
            return `<li><a class="public-static-home-card" href="/${locale}/articles/${encodeURIComponent(article.publicSlug)}"><strong>${escapeHtmlTextV1(article.title)}</strong><span>${escapeHtmlTextV1(excerpt)}</span><time datetime="${escapeHtmlAttributeV1(article.publishedAt)}">${escapeHtmlTextV1(date)}</time></a></li>`;
          }).join("")}</ul>`,
      href: bootstrap.articles.length > HOME_VISIBLE_ITEM_LIMIT_V1
        ? `/${locale}/articles`
        : null,
      icon: bookIconHtmlV1(),
      title: copy.sectionArticles,
      viewAll: copy.viewAll,
    }),
    publicHomeSectionHtmlV1({
      cards: experiments.length === 0
        ? publicHomeEmptyHtmlV1({
            actionHref: `/${locale}/experiments/new`,
            actionLabel: copy.startFirstSimulation,
            icon: flaskIconHtmlV1(),
            message: copy.noSimulations,
          })
        : `<ul class="public-static-home-grid">${experiments.map((experiment) => {
            const date = formatDateV1(experiment.publishedAt, locale);
            const meta = simulationMetaV1(locale, experiment.scenarioCount, date);
            return `<li><a class="public-static-home-card public-static-home-card-compact" href="/${locale}/snapshots/${encodeURIComponent(experiment.snapshotId)}"><strong>${escapeHtmlTextV1(experiment.title)}</strong><span>${escapeHtmlTextV1(meta)}</span></a></li>`;
          }).join("")}</ul>`,
      href: bootstrap.experiments.length > HOME_VISIBLE_ITEM_LIMIT_V1
        ? `/${locale}/experiments`
        : null,
      icon: flaskIconHtmlV1(),
      title: copy.sectionSimulations,
      viewAll: copy.viewAll,
    }),
    `</div>`,
    `<footer class="public-static-home-footer"><div class="public-static-home-footer-inner"><div><strong>${SITE_NAME_V1}</strong><span>${escapeHtmlTextV1(copy.headline)}</span></div><nav aria-label="${escapeHtmlAttributeV1(copy.footerNavigation)}"><a href="/${locale}/experiments">${escapeHtmlTextV1(copy.sectionSimulations)}</a><a href="/${locale}/articles">${escapeHtmlTextV1(copy.sectionArticles)}</a><a href="/${locale}/docs/authoring-cli">AI Authoring CLI</a></nav></div></footer>`,
    `</main>`,
  ].join("");
}

function publicHomeSectionHtmlV1(input: Readonly<{
  cards: string;
  href: string | null;
  icon: string;
  title: string;
  viewAll: string;
}>): string {
  const viewAll = input.href === null
    ? ""
    : `<a class="public-static-home-view-all" href="${input.href}">${escapeHtmlTextV1(input.viewAll)}<span aria-hidden="true">→</span></a>`;
  return `<section class="public-static-home-section"><header><h2><span aria-hidden="true">${input.icon}</span>${escapeHtmlTextV1(input.title)}</h2>${viewAll}</header>${input.cards}</section>`;
}

function publicHomeEmptyHtmlV1(input: Readonly<{
  actionHref?: string;
  actionLabel?: string;
  icon: string;
  message: string;
}>): string {
  const action = input.actionHref === undefined || input.actionLabel === undefined
    ? ""
    : `<a href="${escapeHtmlAttributeV1(input.actionHref)}">${escapeHtmlTextV1(input.actionLabel)}<span aria-hidden="true">→</span></a>`;
  return `<div class="public-static-home-empty"><span aria-hidden="true">${input.icon}</span><p>${escapeHtmlTextV1(input.message)}</p>${action}</div>`;
}

function publicHomeHeadHtmlV1(input: Readonly<{
  canonicalOrigin: string;
  canonicalUrl: string;
  description: string;
  locale: "ja" | "en";
  title: string;
}>): string {
  const jaUrl = canonicalHomeUrlV1(input.canonicalOrigin, "ja");
  const enUrl = canonicalHomeUrlV1(input.canonicalOrigin, "en");
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${new URL(input.canonicalOrigin).origin}/#website`,
        name: SITE_NAME_V1,
        alternateName: "circleheart.dev",
        url: new URL(input.canonicalOrigin).origin,
        inLanguage: ["ja", "en"],
      },
      {
        "@type": "Organization",
        "@id": `${new URL(input.canonicalOrigin).origin}/#organization`,
        name: SITE_NAME_V1,
        description: input.description,
        url: new URL(input.canonicalOrigin).origin,
      },
    ],
  }).replaceAll("<", "\\u003c");
  return [
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${SITE_NAME_V1}" />`,
    `<meta property="og:title" content="${escapeHtmlAttributeV1(input.title)}" />`,
    `<meta property="og:description" content="${escapeHtmlAttributeV1(input.description)}" />`,
    `<meta property="og:url" content="${escapeHtmlAttributeV1(input.canonicalUrl)}" />`,
    `<meta property="og:locale" content="${input.locale === "ja" ? "ja_JP" : "en_US"}" />`,
    `<meta name="twitter:card" content="summary" />`,
    `<meta name="twitter:title" content="${escapeHtmlAttributeV1(input.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtmlAttributeV1(input.description)}" />`,
    `<link rel="alternate" hreflang="ja" href="${escapeHtmlAttributeV1(jaUrl)}" />`,
    `<link rel="alternate" hreflang="en" href="${escapeHtmlAttributeV1(enUrl)}" />`,
    `<link rel="alternate" hreflang="x-default" href="${escapeHtmlAttributeV1(jaUrl)}" />`,
    `<script type="application/ld+json">${jsonLd}</script>`,
  ].join("\n    ");
}

function canonicalHomeUrlV1(
  canonicalOrigin: string,
  locale: "ja" | "en",
): string {
  const origin = new URL(canonicalOrigin);
  if (origin.pathname !== "/" || origin.search || origin.hash) {
    throw new Error("Canonical public origin must not contain a path, query, or hash");
  }
  return new URL(`/${locale}`, origin).toString();
}

function homeCopyV1(locale: "ja" | "en") {
  return locale === "ja" ? jaTranslation.home : enTranslation.home;
}

function formatDateV1(value: string, locale: "ja" | "en"): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" })
    .format(new Date(value));
}

function simulationMetaV1(
  locale: "ja" | "en",
  count: number,
  date: string,
): string {
  return locale === "ja"
    ? `${count}シナリオ · ${date}更新`
    : `${count} scenarios · Updated ${date}`;
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

function bookIconHtmlV1(): string {
  return `<svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"></path></svg>`;
}

function flaskIconHtmlV1(): string {
  return `<svg viewBox="0 0 24 24"><path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.75 3h10.5A2 2 0 0 0 19 18l-5-9V3M7.5 15h9"></path></svg>`;
}
