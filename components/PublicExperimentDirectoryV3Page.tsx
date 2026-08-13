import React from "react";
import { FlaskConical } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";

import { experimentSnapshotHref, newExperimentHref } from "@/homeLinks";
import { localeFromPathname } from "@/localeRouting";
import { readPublicCatalogAsyncV3 } from "@/components/site/PublicCatalogV3";

export function PublicExperimentDirectoryV3Page() {
  const { t } = useTranslation();
  const location = useLocation();
  const locale = localeFromPathname(location.pathname);
  const [state, setState] = React.useState<
    | Readonly<{ kind: "loading" }>
    | Readonly<{ kind: "ready"; experiments: Awaited<ReturnType<typeof readPublicCatalogAsyncV3>>["experiments"] }>
    | Readonly<{ kind: "error"; message: string }>
  >({ kind: "loading" });
  React.useEffect(() => {
    let current = true;
    void readPublicCatalogAsyncV3().then((catalog) => {
      if (current) setState({ kind: "ready", experiments: catalog.experiments });
    }).catch((error) => {
      if (current) {
        setState({
          kind: "error",
          message: error instanceof Error ? error.message : String(error),
        });
      }
    });
    return () => {
      current = false;
    };
  }, []);

  return (
    <div className="h-full overflow-y-auto bg-wb-app text-wb-text" data-testid="public-experiment-directory-v3">
      <main className="mx-auto w-full max-w-4xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
              {t("publicExperiments.title")}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-wb-muted">
              {t("publicExperiments.description")}
            </p>
          </div>
          <Link
            to={newExperimentHref(locale)}
            className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-wb-primary px-4 text-xs font-semibold text-white transition-[background-color,transform] duration-150 hover:bg-wb-primary-hover active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
          >
            <FlaskConical className="h-4 w-4" aria-hidden="true" />
            {t("siteHeader.startSimulation")}
          </Link>
        </div>

        {state.kind === "loading" ? (
          <p className="mt-10 text-sm text-wb-muted" role="status">
            {t("workbench.selector.loading")}
          </p>
        ) : state.kind === "error" ? (
          <p className="mt-10 rounded-xl bg-wb-danger-soft p-4 text-sm text-wb-danger" role="alert">
            {state.message}
          </p>
        ) : state.experiments.length === 0 ? (
          <section className="mt-14 py-10 text-center">
            <FlaskConical className="mx-auto h-7 w-7 text-wb-subtle" aria-hidden="true" />
            <h2 className="mt-3 text-sm font-semibold">
              {t("publicExperiments.emptyTitle")}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-xs leading-6 text-wb-muted">
              {t("publicExperiments.emptyDescription")}
            </p>
          </section>
        ) : (
          <ul className="mt-10 grid gap-3 sm:grid-cols-2 sm:gap-4">
            {state.experiments.map((experiment) => (
              <li key={experiment.record.experimentId}>
                <Link
                  to={experimentSnapshotHref({
                    locale,
                    snapshotId: experiment.snapshotId,
                  })}
                  className="group flex h-full min-w-0 flex-col rounded-2xl border border-wb-line bg-wb-panel p-5 transition-[background-color,border-color,box-shadow] duration-150 hover:border-wb-line-strong hover:bg-wb-hover/30 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
                >
                  <span className="line-clamp-3 break-words text-base font-bold leading-6 tracking-[-0.015em] text-wb-text">
                    {experiment.record.title}
                  </span>
                  <span className="mt-auto block pt-4 text-xs leading-5 text-wb-subtle">
                    {t("home.simulationMeta", {
                      count: experiment.scenarioCount,
                      date: new Intl.DateTimeFormat(locale, {
                        dateStyle: "medium",
                      }).format(new Date(experiment.record.updatedAt)),
                    })}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

export default PublicExperimentDirectoryV3Page;
