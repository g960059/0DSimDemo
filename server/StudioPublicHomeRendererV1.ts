import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { HomePageV1 } from "@/components/home/HomePageV1";
import enTranslation from "@/locales/en/translation.json";
import jaTranslation from "@/locales/ja/translation.json";
import {
  renderStudioPublicHomeBootstrapV1,
  type StudioPublicHomeBootstrapV1,
  validateStudioPublicHomeBootstrapV1,
} from "@/studio/application/publication/StudioPublicHomeBootstrapV1";
import { injectStudioPublicDocumentV1 } from "@/studio/application/publication/StudioPublicArticleRendererV1";

const SITE_NAME_V1 = "CircleHeart";

export type StudioRenderedPublicHomeV1 = Readonly<{
  bodyHtml: string;
  documentHtml: string;
  canonicalUrl: string;
  description: string;
  title: string;
}>;

export function renderStudioPublicHomeV1(
  input: Readonly<{
    bootstrap: StudioPublicHomeBootstrapV1;
    canonicalOrigin: string;
    clientTemplate: string;
  }>,
): StudioRenderedPublicHomeV1 {
  const bootstrap = validateStudioPublicHomeBootstrapV1(input.bootstrap);
  const canonicalUrl = canonicalHomeUrlV1(
    input.canonicalOrigin,
    bootstrap.locale,
  );
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

function publicHomeBodyHtmlV1(bootstrap: StudioPublicHomeBootstrapV1): string {
  return renderToStaticMarkup(
    createElement(HomePageV1, {
      locale: bootstrap.locale,
      data: bootstrap,
      limit: 9,
      staticRender: true,
    }),
  );
}

function publicHomeHeadHtmlV1(
  input: Readonly<{
    canonicalOrigin: string;
    canonicalUrl: string;
    description: string;
    locale: "ja" | "en";
    title: string;
  }>,
): string {
  const jaUrl = canonicalHomeUrlV1(input.canonicalOrigin, "ja");
  const enUrl = canonicalHomeUrlV1(input.canonicalOrigin, "en");
  const defaultUrl = new URL("/", input.canonicalOrigin).toString();
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
    `<link rel="alternate" hreflang="x-default" href="${escapeHtmlAttributeV1(defaultUrl)}" />`,
    `<script type="application/ld+json">${jsonLd}</script>`,
  ].join("\n    ");
}

function canonicalHomeUrlV1(
  canonicalOrigin: string,
  locale: "ja" | "en",
): string {
  const origin = new URL(canonicalOrigin);
  if (origin.pathname !== "/" || origin.search || origin.hash) {
    throw new Error(
      "Canonical public origin must not contain a path, query, or hash",
    );
  }
  return new URL(`/${locale}`, origin).toString();
}

function homeCopyV1(locale: "ja" | "en") {
  return locale === "ja" ? jaTranslation.home : enTranslation.home;
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
