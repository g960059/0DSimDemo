import React from "react";
import { ArrowUpRight, FlaskConical } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";

import { experimentSnapshotHref, newExperimentHref } from "@/homeLinks";
import { localeFromPathname } from "@/localeRouting";
import { readPublicCatalogV3 } from "@/components/site/PublicCatalogV3";

export function PublicExperimentDirectoryV3Page() {
  const { t } = useTranslation();
  const location = useLocation();
  const locale = localeFromPathname(location.pathname);
  const [state] = React.useState(() => {
    try {
      return {
        kind: "ready" as const,
        experiments: readPublicCatalogV3().experiments,
      };
    } catch (error) {
      return {
        kind: "error" as const,
        message: error instanceof Error ? error.message : String(error),
      };
    }
  });

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

        {state.kind === "error" ? (
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
          <ul className="mt-12 divide-y divide-wb-line/70 border-t border-wb-line/70">
            {state.experiments.map(({ record, snapshot }) => (
              <li key={record.experimentId}>
                <Link
                  to={experimentSnapshotHref({
                    locale,
                    snapshotId: snapshot.snapshotId,
                  })}
                  className="group -mx-3 flex min-h-24 items-center gap-5 rounded-xl px-3 py-5 transition-[background-color,transform] duration-150 hover:bg-wb-hover active:scale-[0.995] motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-base font-semibold tracking-tight text-wb-text">
                      {record.title}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-wb-subtle">
                      {t("home.simulationMeta", {
                        count: snapshot.content.scenarios.length,
                        date: new Intl.DateTimeFormat(locale, {
                          dateStyle: "medium",
                        }).format(new Date(record.updatedAt)),
                      })}
                    </span>
                  </span>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-wb-subtle transition-[color,transform] duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-wb-text motion-reduce:transform-none" aria-hidden="true" />
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
