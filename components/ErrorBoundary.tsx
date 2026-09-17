import React from "react";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { homeHref } from "@/homeLinks";
import { localeFromPathname } from "@/localeRouting";

type ErrorBoundaryProps = Readonly<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
  resetKey?: string;
  onBack?: () => void;
}>;

export function isModuleLoadErrorV1(error: unknown): boolean {
  return error instanceof Error && /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|not a valid JavaScript MIME type for module script|Unable to preload CSS|Loading (?:CSS )?chunk .+ failed/i.test(error.message);
}

export function PageLoadFailureV1({ error, onBack }: Readonly<{
  error: Error;
  onBack?: () => void;
}>) {
  const { t } = useTranslation();
  const home = homeHref(localeFromPathname(typeof window === "undefined" ? "/ja" : window.location.pathname));
  return (
    <div className="flex h-full min-h-72 items-center justify-center overflow-y-auto bg-wb-app px-5 py-12 text-wb-text" data-testid="page-load-failure-v1">
      <section className="w-full max-w-md" role="alert">
        <h1 className="text-xl font-semibold tracking-tight">{t("pageFailure.title")}</h1>
        <p className="mt-3 text-sm leading-7 text-wb-muted">
          {t(isModuleLoadErrorV1(error) ? "pageFailure.moduleDescription" : "pageFailure.description")}
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-wb-primary px-4 text-sm font-semibold text-white hover:bg-wb-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            {t("pageFailure.reload")}
          </button>
          {onBack ? (
            <button type="button" onClick={onBack} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-sm text-wb-muted hover:bg-wb-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              {t("common.back")}
            </button>
          ) : (
            <a href={home} className="inline-flex min-h-10 items-center rounded-lg px-3 text-sm text-wb-muted hover:bg-wb-hover">
              {t("siteHeader.home")}
            </a>
          )}
        </div>
        <details className="mt-8 text-xs text-wb-subtle">
          <summary className="w-fit cursor-pointer">{t("pageFailure.details")}</summary>
          <pre className="mt-3 whitespace-pre-wrap break-words font-mono leading-5">{error.message}</pre>
        </details>
      </section>
    </div>
  );
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: unknown) {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  componentDidUpdate(previous: ErrorBoundaryProps) {
    if (previous.resetKey !== this.props.resetKey && this.state.error !== null) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error !== null) {
      return this.props.fallback ?? <PageLoadFailureV1 error={this.state.error} onBack={this.props.onBack} />;
    }
    return this.props.children;
  }
}
