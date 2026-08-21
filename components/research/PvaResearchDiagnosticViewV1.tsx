import React from "react";
import {
  Activity,
  ArrowLeft,
  ChevronDown,
  CircleAlert,
  Filter,
  TrendingUp,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useParams } from "react-router-dom";

import artifactJson from "@/artifacts/transient-preload/pva-geometry-domain-diagnostics-v2.json";
import correctedArtifactJson from "@/artifacts/transient-preload/pva-geometry-domain-diagnostics-v3.json";
import mainCandidateArtifactJson from "@/artifacts/transient-preload/method-specific-pva-main-candidate-v1.json";
import phaseWiseArtifactJson from "@/artifacts/transient-preload/phase-wise-emax-baseline-pva-research-v1.json";
import qualificationArtifactJson from "@/artifacts/transient-preload/phase-wise-pva-qualification-v2.json";
import { devDashboardHref } from "@/homeLinks";
import { isLocale, type Locale } from "@/localeRouting";
import { studioDevSurfacesEnabledV1 } from "@/studio/application/dev/StudioDevAccessV1";

import {
  filterPvaResearchRowsV1,
  bindPvaGeometryV3ToResearchDatasetV1,
  PVA_RESEARCH_CLASSIFICATIONS_V1,
  PVA_RESEARCH_METHOD_IDS_V1,
  projectPvaMainCandidateDisplayV1,
  projectPvaPhaseWiseEmaxDisplayV1,
  projectPvaQualificationDisplayV2,
  projectPvaResearchDatasetV1,
  summarizePvaResearchRowsV1,
  type PvaGeometryDomainArtifactInputV2,
  type PvaGeometryDomainArtifactInputV3,
  type PvaMainCandidateArtifactInputV1,
  type PvaMainCandidateDisplayV1,
  type PvaPhaseWiseEmaxArtifactInputV1,
  type PvaPhaseWiseEmaxDisplayV1,
  type PvaQualificationArtifactInputV2,
  type PvaQualificationDisplayV2,
  type PvaResearchClassificationV1,
  type PvaResearchDatasetV1,
  type PvaResearchDisplayRowV1,
  type PvaResearchFiltersV1,
  type PvaResearchMethodIdV1,
  type PvaResearchReferenceIdV1,
  type PvaResearchReferenceSummaryV1,
  type PvaResearchVentricleIdV1,
} from "./PvaResearchDiagnosticsV1";

const INITIAL_FILTERS_V1: PvaResearchFiltersV1 = Object.freeze({
  referenceId: "dynamic-maximum-volume",
  ventricleId: "all",
  systolicMethodId: "all",
  classification: "all",
});

const PAGE_SIZE_V1 = 24;

export const PVA_RESEARCH_DATASET_V1 = bindPvaGeometryV3ToResearchDatasetV1(
  correctedArtifactJson as unknown as PvaGeometryDomainArtifactInputV3,
  projectPvaResearchDatasetV1(
    artifactJson as unknown as PvaGeometryDomainArtifactInputV2,
  ),
);

export const PVA_PHASE_WISE_EMAX_DATASET_V1 = projectPvaPhaseWiseEmaxDisplayV1(
  phaseWiseArtifactJson as unknown as PvaPhaseWiseEmaxArtifactInputV1,
);

export const PVA_MAIN_CANDIDATE_DATASET_V1 = projectPvaMainCandidateDisplayV1(
  mainCandidateArtifactJson as unknown as PvaMainCandidateArtifactInputV1,
);

export const PVA_QUALIFICATION_DATASET_V2 = projectPvaQualificationDisplayV2(
  qualificationArtifactJson as unknown as PvaQualificationArtifactInputV2,
);

export function PvaResearchDiagnosticViewV1() {
  const { t } = useTranslation();
  const { locale: localeParam } = useParams();
  const locale: Locale = isLocale(localeParam) ? localeParam : "ja";
  const [filters, setFilters] =
    React.useState<PvaResearchFiltersV1>(INITIAL_FILTERS_V1);
  const [visibleCount, setVisibleCount] = React.useState(PAGE_SIZE_V1);
  const rows = React.useMemo(
    () => filterPvaResearchRowsV1(PVA_RESEARCH_DATASET_V1, filters),
    [filters],
  );
  const counts = React.useMemo(() => summarizePvaResearchRowsV1(rows), [rows]);

  React.useEffect(() => {
    setVisibleCount(PAGE_SIZE_V1);
  }, [
    filters.classification,
    filters.referenceId,
    filters.systolicMethodId,
    filters.ventricleId,
  ]);

  if (!studioDevSurfacesEnabledV1()) {
    return <Navigate to={devDashboardHref(locale)} replace />;
  }

  const visibleRows = rows.slice(0, visibleCount);

  return (
    <div
      className="h-full overflow-y-auto bg-wb-app text-wb-text"
      data-testid="pva-research-diagnostic-view-v1"
    >
      <main className="mx-auto w-full max-w-[1440px] px-4 py-7 sm:px-7 sm:py-10">
        <Link
          to={devDashboardHref(locale)}
          className="inline-flex min-h-9 items-center gap-2 rounded-lg px-2 text-xs font-semibold text-wb-muted transition-[color,background-color,transform] duration-150 hover:bg-wb-hover hover:text-wb-text active:scale-[0.98] motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          {t("pvaResearch.back")}
        </Link>

        <header className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-wb-accent">
              <Activity className="h-3.5 w-3.5" aria-hidden="true" />
              {t("pvaResearch.eyebrow")}
            </p>
            <h1 className="mt-2 max-w-4xl text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
              {t("pvaResearch.title")}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-wb-muted">
              {t("pvaResearch.description")}
            </p>
          </div>
          <dl className="grid shrink-0 grid-cols-2 gap-x-8 gap-y-2 rounded-xl bg-wb-panel px-4 py-3 text-xs ring-1 ring-wb-line/70">
            <div>
              <dt className="text-wb-subtle">
                {t("pvaResearch.pressureBasis")}
              </dt>
              <dd className="mt-1 font-semibold">
                {t(
                  `pvaResearch.pressure.${PVA_RESEARCH_DATASET_V1.pressureBasis}`,
                )}
              </dd>
            </div>
            <div>
              <dt className="text-wb-subtle">{t("pvaResearch.rows")}</dt>
              <dd className="mt-1 font-semibold tabular-nums">
                {PVA_RESEARCH_DATASET_V1.attemptedRowCount}
              </dd>
            </div>
          </dl>
        </header>

        <section
          className="mt-7 flex gap-3 rounded-2xl border border-wb-warning/35 bg-wb-warning-soft px-4 py-4 sm:px-5"
          aria-labelledby="pva-research-boundary-title"
        >
          <CircleAlert
            className="mt-0.5 h-5 w-5 shrink-0 text-wb-warning"
            aria-hidden="true"
          />
          <div>
            <h2
              id="pva-research-boundary-title"
              className="text-sm font-semibold"
            >
              {t("pvaResearch.boundaryTitle")}
            </h2>
            <p className="mt-1 max-w-4xl text-xs leading-6 text-wb-muted">
              {t("pvaResearch.boundaryDescription", {
                attempted: PVA_RESEARCH_DATASET_V1.attemptedRowCount,
                supported: PVA_RESEARCH_DATASET_V1.domainSupportedRowCount,
              })}
            </p>
          </div>
        </section>

        <OnDemandPvaQualificationSectionV2
          qualification={PVA_QUALIFICATION_DATASET_V2}
          locale={locale}
        />

        <MainIntegrationCandidateSectionV1
          candidate={PVA_MAIN_CANDIDATE_DATASET_V1}
          locale={locale}
        />

        <PhaseWiseBaselinePvaSectionV1 locale={locale} />

        <section className="mt-7" aria-labelledby="pva-reference-heading">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2
                id="pva-reference-heading"
                className="text-base font-semibold"
              >
                {t("pvaResearch.referencesTitle")}
              </h2>
              <p className="mt-1 text-xs leading-5 text-wb-subtle">
                {t("pvaResearch.referencesDescription")}
              </p>
            </div>
            <p className="hidden text-[11px] text-wb-subtle sm:block">
              {t("pvaResearch.selectReference")}
            </p>
          </div>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            {PVA_RESEARCH_DATASET_V1.referenceSummaries.map((summary) => (
              <ReferenceSummaryCardV1
                key={summary.referenceId}
                dataset={PVA_RESEARCH_DATASET_V1}
                summary={summary}
                selected={filters.referenceId === summary.referenceId}
                onSelect={() =>
                  setFilters((current) => ({
                    ...current,
                    referenceId: summary.referenceId,
                  }))
                }
              />
            ))}
          </div>
        </section>

        <section
          className="mt-7 overflow-hidden rounded-2xl bg-wb-panel shadow-sm ring-1 ring-wb-line/70"
          aria-labelledby="pva-diagnostics-heading"
        >
          <header className="border-b border-wb-line/70 px-4 py-4 sm:px-5">
            <h2 id="pva-diagnostics-heading" className="text-sm font-semibold">
              {t("pvaResearch.diagnosticsTitle")}
            </h2>
          </header>
          <dl className="grid sm:grid-cols-3">
            <SummaryMetricV1
              label={t("pvaResearch.metrics.closedBeats")}
              value={`${PVA_RESEARCH_DATASET_V1.exactlyClosedBeatWorkCount} / ${PVA_RESEARCH_DATASET_V1.uniqueBeatWorkCount}`}
              detail={t("pvaResearch.metrics.closedBeatsDetail")}
            />
            <SummaryMetricV1
              label={t("pvaResearch.metrics.closureMedian")}
              value={formatPercentV1(
                PVA_RESEARCH_DATASET_V1.closureFraction.median,
                locale,
              )}
              detail={t("pvaResearch.metrics.closureMedianDetail", {
                count:
                  PVA_RESEARCH_DATASET_V1.closureFraction.aboveFivePercentCount,
              })}
            />
            <SummaryMetricV1
              label={t("pvaResearch.metrics.extrapolationMedian")}
              value={formatPercentV1(
                PVA_RESEARCH_DATASET_V1.systolicExtrapolationFraction.median,
                locale,
              )}
              detail={t("pvaResearch.metrics.extrapolationMedianDetail", {
                count:
                  PVA_RESEARCH_DATASET_V1.systolicExtrapolationFraction
                    .aboveThreeQuartersCount,
              })}
            />
          </dl>
        </section>

        <section className="mt-8" aria-labelledby="pva-row-heading">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-wb-subtle">
                <Filter className="h-3.5 w-3.5" aria-hidden="true" />
                {t("pvaResearch.filtersTitle")}
              </p>
              <h2 id="pva-row-heading" className="mt-1 text-lg font-semibold">
                {t("pvaResearch.rowsTitle")}
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <FilterSelectV1
                label={t("pvaResearch.filters.ventricle")}
                value={filters.ventricleId}
                onChange={(value) =>
                  setFilters((current) => ({
                    ...current,
                    ventricleId: value as PvaResearchVentricleIdV1 | "all",
                  }))
                }
                options={[
                  ["all", t("pvaResearch.filters.allVentricles")],
                  ["LV", "LV"],
                  ["RV", "RV"],
                ]}
              />
              <FilterSelectV1
                label={t("pvaResearch.filters.method")}
                value={filters.systolicMethodId}
                onChange={(value) =>
                  setFilters((current) => ({
                    ...current,
                    systolicMethodId: value as PvaResearchMethodIdV1 | "all",
                  }))
                }
                options={[
                  ["all", t("pvaResearch.filters.allMethods")],
                  ...PVA_RESEARCH_METHOD_IDS_V1.map(
                    (methodId) =>
                      [methodId, t(`pvaResearch.method.${methodId}`)] as const,
                  ),
                ]}
              />
              <FilterSelectV1
                label={t("pvaResearch.filters.classification")}
                value={filters.classification}
                onChange={(value) =>
                  setFilters((current) => ({
                    ...current,
                    classification: value as
                      PvaResearchClassificationV1 | "all",
                  }))
                }
                options={[
                  ["all", t("pvaResearch.filters.allClassifications")],
                  ...PVA_RESEARCH_CLASSIFICATIONS_V1.map(
                    (classification) =>
                      [
                        classification,
                        t(`pvaResearch.classification.${classification}`),
                      ] as const,
                  ),
                ]}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-wb-panel px-4 py-3 ring-1 ring-wb-line/70">
            <p
              className="text-xs font-semibold tabular-nums"
              aria-live="polite"
            >
              {t("pvaResearch.filteredRows", { count: rows.length })}
            </p>
            {PVA_RESEARCH_CLASSIFICATIONS_V1.map((classification) => (
              <span
                key={classification}
                className="flex items-center gap-1.5 text-[11px] text-wb-subtle"
              >
                <span
                  className={`h-2 w-2 rounded-full ${classificationDotClassV1(classification)}`}
                  aria-hidden="true"
                />
                {t(`pvaResearch.classification.${classification}`)}
                <span className="tabular-nums">{counts[classification]}</span>
              </span>
            ))}
          </div>

          {visibleRows.length === 0 ? (
            <div className="mt-4 rounded-2xl bg-wb-panel px-5 py-12 text-center text-sm text-wb-muted ring-1 ring-wb-line/70">
              {t("pvaResearch.empty")}
            </div>
          ) : (
            <ol className="mt-4 overflow-hidden rounded-2xl bg-wb-panel shadow-sm ring-1 ring-wb-line/70">
              {visibleRows.map((row) => (
                <ResearchRowV1 key={row.rowId} locale={locale} row={row} />
              ))}
            </ol>
          )}

          {visibleCount < rows.length && (
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                className="inline-flex min-h-10 items-center justify-center rounded-lg bg-wb-panel px-4 text-sm font-semibold text-wb-text ring-1 ring-wb-line transition-[background-color,transform] duration-150 hover:bg-wb-hover active:scale-[0.98] motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
                onClick={() => setVisibleCount((count) => count + PAGE_SIZE_V1)}
              >
                {t("pvaResearch.showMore", {
                  count: Math.min(PAGE_SIZE_V1, rows.length - visibleCount),
                })}
              </button>
            </div>
          )}
        </section>

        <footer className="mt-10 border-t border-wb-line/70 pt-5 text-[11px] leading-5 text-wb-subtle">
          <p>{t("pvaResearch.footer")}</p>
          <p className="mt-1 font-mono text-[10px]">
            {PVA_RESEARCH_DATASET_V1.studyId}
          </p>
        </footer>
      </main>
    </div>
  );
}

function OnDemandPvaQualificationSectionV2({
  qualification,
  locale,
}: Readonly<{
  qualification: PvaQualificationDisplayV2;
  locale: Locale;
}>) {
  const { t } = useTranslation();
  return (
    <section
      className="mt-7 overflow-hidden rounded-2xl bg-wb-panel shadow-sm ring-1 ring-wb-accent/35"
      data-testid="pva-on-demand-output-v2"
      aria-labelledby="pva-on-demand-output-title"
    >
      <header className="flex flex-col gap-3 border-b border-wb-line/70 bg-wb-accent/[0.035] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-wb-accent">
            <Activity className="h-3.5 w-3.5" aria-hidden="true" />
            {t("pvaResearch.qualification.eyebrow")}
          </p>
          <h2
            id="pva-on-demand-output-title"
            className="mt-1 text-base font-semibold"
          >
            {t("pvaResearch.qualification.title")}
          </h2>
          <p className="mt-1 max-w-4xl text-xs leading-5 text-wb-muted">
            {t("pvaResearch.qualification.description")}
          </p>
        </div>
        <span className="w-fit rounded-full bg-wb-accent/10 px-2.5 py-1 text-[10px] font-semibold text-wb-accent">
          {t("pvaResearch.qualification.completed")}
        </span>
      </header>

      <div className="grid gap-4 p-4 sm:p-5 xl:grid-cols-2">
        {qualification.rows.map((row) => (
          <article
            key={row.ventricleId}
            className="overflow-hidden rounded-xl bg-wb-app/45 ring-1 ring-wb-line/70"
            data-testid={`pva-on-demand-output-${row.ventricleId}`}
          >
            <header className="flex items-start justify-between gap-4 border-b border-wb-line/60 px-4 py-3.5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">
                    {row.ventricleId}
                  </span>
                  <span className="rounded-full bg-wb-warning-soft px-2 py-0.5 text-[9px] font-semibold text-wb-warning">
                    {t(`pvaResearch.qualification.status.${row.status}`)}
                  </span>
                </div>
                <p className="mt-1 text-[10px] text-wb-subtle">
                  {t("pvaResearch.qualification.phase", {
                    phase: formatNumberV1(row.phase01, locale, 4),
                    index: row.phaseIndex,
                  })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-wb-subtle">
                  {t("pvaResearch.qualification.outputValue")}
                </p>
                <p className="mt-1 text-2xl font-semibold tracking-[-0.035em] tabular-nums">
                  {formatEnergyV1(row.mainOutputValueJ, locale)}
                </p>
              </div>
            </header>

            <div className="px-4 py-3.5">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
                <CompactMetricV1
                  label={t("pvaResearch.qualification.externalWork")}
                  value={formatEnergyV1(row.externalWorkJ, locale)}
                />
                <CompactMetricV1
                  label={t("pvaResearch.qualification.potentialEnergy")}
                  value={formatEnergyV1(row.potentialEnergyEquivalentJ, locale)}
                />
                <CompactMetricV1
                  label={t("pvaResearch.qualification.conversionRatio")}
                  value={formatPercentV1(row.mechanicalConversionRatio, locale)}
                />
                <CompactMetricV1
                  label={t("pvaResearch.qualification.baselineSensitivity")}
                  value={formatPercentV1(
                    row.baselineExclusionRelativeDifference,
                    locale,
                  )}
                />
                <CompactMetricV1
                  label={t("pvaResearch.qualification.phaseSensitivity")}
                  value={formatPercentV1(
                    row.phaseResolutionRelativeDifference,
                    locale,
                  )}
                />
                <CompactMetricV1
                  label={t("pvaResearch.qualification.stateDispersion")}
                  value={formatNumberV1(
                    row.selectedPhaseStateDispersionIndex,
                    locale,
                    3,
                  )}
                />
              </dl>

              <div className="mt-4 border-t border-wb-line/60 pt-3">
                <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-wb-subtle">
                  {t("pvaResearch.qualification.limitationsTitle")}
                </p>
                <ul className="mt-2 space-y-1.5 text-[11px] leading-5 text-wb-muted">
                  {row.limitations.map((limitation) => (
                    <li key={limitation} className="flex gap-2">
                      <span className="text-wb-warning" aria-hidden="true">
                        •
                      </span>
                      <span>
                        {t(
                          `pvaResearch.qualification.limitation.${limitation}`,
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </article>
        ))}
      </div>

      <footer className="flex flex-col gap-1 border-t border-wb-line/70 px-4 py-3 text-[10px] leading-5 text-wb-subtle sm:px-5">
        <span>{t("pvaResearch.qualification.executionMode")}</span>
        <span>{t("pvaResearch.qualification.claimBoundary")}</span>
      </footer>
    </section>
  );
}

function MainIntegrationCandidateSectionV1({
  candidate,
  locale,
}: Readonly<{
  candidate: PvaMainCandidateDisplayV1;
  locale: Locale;
}>) {
  const { t } = useTranslation();
  return (
    <section
      className="mt-7 overflow-hidden rounded-2xl bg-wb-panel shadow-sm ring-1 ring-wb-line/70"
      data-testid="pva-main-integration-candidate-v1"
      aria-labelledby="pva-main-candidate-title"
    >
      <header className="flex flex-col gap-3 border-b border-wb-line/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-wb-accent">
            <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
            {t("pvaResearch.mainCandidate.eyebrow")}
          </p>
          <h2
            id="pva-main-candidate-title"
            className="mt-1 text-base font-semibold"
          >
            {t("pvaResearch.mainCandidate.title")}
          </h2>
        </div>
        <span className="w-fit rounded-full bg-wb-warning-soft px-2.5 py-1 text-[10px] font-semibold text-wb-warning">
          {t(`pvaResearch.mainCandidate.status.${candidate.status}`)}
        </span>
      </header>
      <div className="grid gap-5 px-4 py-4 sm:px-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)]">
        <div>
          <p className="text-xs leading-6 text-wb-muted">
            {t("pvaResearch.mainCandidate.description")}
          </p>
          <p className="mt-3 rounded-lg bg-wb-app/55 px-3 py-2 text-[11px] leading-5 text-wb-subtle ring-1 ring-wb-line/60">
            {t("pvaResearch.mainCandidate.methodSelected")}
            <span className="ml-1 font-medium text-wb-text">
              {candidate.methodLabel}
            </span>
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {candidate.rows.map((row) => (
              <div
                key={row.ventricleId}
                className="rounded-xl bg-wb-app/45 px-3 py-3 ring-1 ring-wb-line/60"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold">
                    {row.ventricleId}
                  </span>
                  <span className="text-[10px] text-wb-subtle">
                    {t(
                      `pvaResearch.mainCandidate.evidence.${row.evidenceStatus}`,
                    )}
                  </span>
                </div>
                <p className="mt-2 text-xl font-semibold tracking-[-0.03em] tabular-nums">
                  {row.researchEstimateJ === null
                    ? t("pvaResearch.notAvailable")
                    : formatEnergyV1(row.researchEstimateJ, locale)}
                </p>
                <p className="mt-1 text-[10px] text-wb-subtle">
                  {row.mainOutputValueJ === null
                    ? t("pvaResearch.mainCandidate.notReady")
                    : t("pvaResearch.mainCandidate.readyValue")}
                </p>
                <dl className="mt-2 grid grid-cols-2 gap-2 border-t border-wb-line/60 pt-2 text-[10px] text-wb-subtle">
                  <div>
                    <dt>{t("pvaResearch.mainCandidate.extrapolatedArea")}</dt>
                    <dd className="mt-0.5 font-medium text-wb-text tabular-nums">
                      {formatPercentV1(row.extrapolationFraction, locale)}
                    </dd>
                  </div>
                  <div>
                    <dt>
                      {t("pvaResearch.mainCandidate.directionSensitivity")}
                    </dt>
                    <dd className="mt-0.5 font-medium text-wb-text tabular-nums">
                      {formatSignedPercentV1(
                        row.directionSensitivityFraction,
                        locale,
                      )}
                    </dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-wb-warning/25 bg-wb-warning-soft/35 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-wb-warning">
            {t("pvaResearch.mainCandidate.remainingTitle")}
          </p>
          <ul className="mt-2 space-y-2 text-xs leading-5 text-wb-muted">
            {candidate.blockers.length === 0 ? (
              <li className="flex gap-2 text-wb-text">
                <span aria-hidden="true">✓</span>
                <span>{t("pvaResearch.mainCandidate.noBlockers")}</span>
              </li>
            ) : null}
            {candidate.blockers.map((blocker) => (
              <li key={blocker} className="flex gap-2">
                <span aria-hidden="true">•</span>
                <span>{t(`pvaResearch.mainCandidate.blocker.${blocker}`)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 border-t border-wb-warning/20 pt-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-wb-subtle">
            {t("pvaResearch.mainCandidate.limitationsTitle")}
          </p>
          <ul className="mt-2 space-y-2 text-xs leading-5 text-wb-muted">
            {candidate.limitations.map((limitation) => (
              <li key={limitation} className="flex gap-2">
                <span aria-hidden="true">•</span>
                <span>
                  {t(`pvaResearch.mainCandidate.limitation.${limitation}`)}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 border-t border-wb-warning/20 pt-3 text-[10px] leading-5 text-wb-subtle">
            {t("pvaResearch.mainCandidate.targetSurface")}
          </p>
        </div>
      </div>
    </section>
  );
}

function PhaseWiseBaselinePvaSectionV1({
  locale,
}: Readonly<{ locale: Locale }>) {
  const { t } = useTranslation();
  return (
    <section className="mt-7" aria-labelledby="pva-emax-heading">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-wb-accent/10 text-wb-accent">
          <TrendingUp className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-wb-accent">
            {t("pvaResearch.emax.eyebrow")}
          </p>
          <h2 id="pva-emax-heading" className="mt-1 text-lg font-semibold">
            {t("pvaResearch.emax.title")}
          </h2>
          <p className="mt-1 max-w-4xl text-xs leading-5 text-wb-subtle">
            {t("pvaResearch.emax.description")}
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        {PVA_PHASE_WISE_EMAX_DATASET_V1.rows.map((row) => (
          <PhaseWiseBaselinePvaCardV1
            key={row.ventricleId}
            locale={locale}
            row={row}
          />
        ))}
      </div>
    </section>
  );
}

function PhaseWiseBaselinePvaCardV1({
  locale,
  row,
}: Readonly<{
  locale: Locale;
  row: PvaPhaseWiseEmaxDisplayV1["rows"][number];
}>) {
  const { t } = useTranslation();
  const total = row.pressureVolumeAreaJ;
  const componentTotal =
    row.periodicExternalWorkJ + (row.potentialEnergyJ ?? 0);
  const externalShare =
    componentTotal > 0 ? row.periodicExternalWorkJ / componentTotal : 0;
  const potentialShare = 1 - externalShare;
  return (
    <article
      className="overflow-hidden rounded-2xl bg-wb-panel shadow-sm ring-1 ring-wb-line/70"
      data-testid={`pva-emax-card-${row.ventricleId}`}
    >
      <header className="flex items-start justify-between gap-4 border-b border-wb-line/70 px-4 py-4 sm:px-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold">{row.ventricleId}</span>
            <span className="rounded-full bg-wb-warning-soft px-2 py-1 text-[10px] font-semibold text-wb-warning">
              {t(`pvaResearch.emax.status.${row.status}`)}
            </span>
          </div>
          <p className="mt-2 text-[11px] text-wb-subtle">
            {t("pvaResearch.emax.phase", {
              phase: formatNumberV1(row.selectedPhase01, locale, 4),
              index: row.selectedPhaseIndex,
            })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-wb-subtle">
            {t("pvaResearch.emax.baselinePva")}
          </p>
          <p className="mt-1 text-2xl font-semibold tracking-[-0.035em] tabular-nums">
            {total === null
              ? t("pvaResearch.notAvailable")
              : formatEnergyV1(total, locale)}
          </p>
        </div>
      </header>

      <div className="grid gap-5 px-4 py-4 sm:px-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(180px,0.8fr)]">
        <div>
          <div className="flex items-center justify-between gap-4">
            <p className="text-[11px] font-semibold text-wb-muted">
              {t("pvaResearch.emax.phaseScan")}
            </p>
            <div className="flex items-center gap-3 text-[10px] text-wb-subtle">
              <span className="flex items-center gap-1">
                <span className="h-0.5 w-3 bg-wb-accent" />
                {t("pvaResearch.direction.occlusion")}
              </span>
              <span className="flex items-center gap-1">
                <span className="h-0.5 w-3 bg-wb-warning" />
                {t("pvaResearch.direction.release")}
              </span>
            </div>
          </div>
          <PhaseSlopeChartV1 row={row} />
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
            <CompactMetricV1
              label={t("pvaResearch.emax.elastance")}
              value={`${formatNumberV1(row.elastanceMmHgPerMl, locale, 4)} mmHg/mL`}
            />
            <CompactMetricV1
              label="V0"
              value={`${formatNumberV1(row.volumeAxisInterceptMl, locale, 3)} mL`}
            />
            <CompactMetricV1
              label="R²"
              value={
                row.rSquared === null
                  ? t("pvaResearch.notAvailable")
                  : formatNumberV1(row.rSquared, locale, 5)
              }
            />
            <CompactMetricV1
              label={t("pvaResearch.emax.releaseDifference")}
              value={formatPercentV1(
                row.releaseSlopeDifferenceFraction,
                locale,
              )}
            />
          </dl>
        </div>

        <div className="rounded-xl bg-wb-app/55 p-3 ring-1 ring-wb-line/60">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-wb-subtle">
            {t("pvaResearch.emax.components")}
          </p>
          <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-wb-hover">
            <span
              className="bg-wb-accent"
              style={{ width: `${100 * externalShare}%` }}
            />
            <span
              className="bg-wb-warning"
              style={{ width: `${100 * potentialShare}%` }}
            />
          </div>
          <dl className="mt-3 grid gap-2 text-xs">
            <ValuePairV1
              label={t("pvaResearch.emax.externalWork")}
              value={formatEnergyV1(row.periodicExternalWorkJ, locale)}
            />
            <ValuePairV1
              label={t("pvaResearch.emax.potentialEnergy")}
              value={
                row.potentialEnergyJ === null
                  ? t("pvaResearch.notAvailable")
                  : formatEnergyV1(row.potentialEnergyJ, locale)
              }
            />
            <ValuePairV1
              label={t("pvaResearch.emax.extrapolation")}
              value={formatPercentV1(row.extrapolationFraction, locale)}
            />
            <ValuePairV1
              label={t("pvaResearch.emax.observedStrip")}
              value={
                row.observedDomainAreaStripJ === null
                  ? t("pvaResearch.notAvailable")
                  : formatEnergyV1(row.observedDomainAreaStripJ, locale)
              }
            />
          </dl>
        </div>
      </div>

      <footer className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-wb-line/70 px-4 py-3 text-[10px] text-wb-subtle sm:px-5">
        <span>
          {t("pvaResearch.emax.loo")}: {row.leaveOneOutStable ? "✓" : "—"} [
          {row.leaveOneOutPhaseRange.join("–")}]
        </span>
        <span>
          {t("pvaResearch.emax.releasePeak")}: {row.releasePeakPhaseIndex}
        </span>
        <span>
          {row.supportedIntersectionEstablished
            ? t("pvaResearch.emax.supportedIntersection")
            : t("pvaResearch.emax.noSupportedIntersection")}
        </span>
      </footer>
    </article>
  );
}

function PhaseSlopeChartV1({
  row,
}: Readonly<{ row: PvaPhaseWiseEmaxDisplayV1["rows"][number] }>) {
  const width = 420;
  const height = 112;
  const padding = 8;
  const values = [...row.occlusionSlopeByPhase, ...row.releaseSlopeByPhase];
  const minimum = Math.min(0, ...values);
  const maximum = Math.max(...values);
  const span = maximum - minimum || 1;
  const x = (index: number) => padding + (index / 63) * (width - 2 * padding);
  const y = (value: number) =>
    height - padding - ((value - minimum) / span) * (height - 2 * padding);
  const path = (series: readonly number[]) =>
    series
      .map(
        (value, index) =>
          `${index === 0 ? "M" : "L"}${x(index).toFixed(2)},${y(value).toFixed(2)}`,
      )
      .join(" ");
  const selectedX = x(row.selectedPhaseIndex);
  return (
    <svg
      className="mt-2 h-28 w-full overflow-visible"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`${row.ventricleId} phase-wise elastance`}
    >
      <line
        x1={padding}
        x2={width - padding}
        y1={y(0)}
        y2={y(0)}
        className="stroke-wb-line"
        strokeWidth="1"
      />
      <line
        x1={selectedX}
        x2={selectedX}
        y1={padding}
        y2={height - padding}
        className="stroke-wb-accent/35"
        strokeDasharray="3 3"
        strokeWidth="1"
      />
      <path
        d={path(row.occlusionSlopeByPhase)}
        fill="none"
        className="stroke-wb-accent"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.25"
      />
      <path
        d={path(row.releaseSlopeByPhase)}
        fill="none"
        className="stroke-wb-warning"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.75"
      />
      <circle
        cx={selectedX}
        cy={y(row.elastanceMmHgPerMl)}
        r="3.5"
        className="fill-wb-panel stroke-wb-accent"
        strokeWidth="2"
      />
    </svg>
  );
}

function CompactMetricV1({
  label,
  value,
}: Readonly<{ label: string; value: string }>) {
  return (
    <div>
      <dt className="text-[9px] font-semibold uppercase tracking-[0.08em] text-wb-subtle">
        {label}
      </dt>
      <dd className="mt-1 text-[11px] font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

function ValuePairV1({
  label,
  value,
}: Readonly<{ label: string; value: string }>) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-wb-subtle">{label}</dt>
      <dd className="font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

function ReferenceSummaryCardV1({
  dataset,
  onSelect,
  selected,
  summary,
}: Readonly<{
  dataset: PvaResearchDatasetV1;
  onSelect: () => void;
  selected: boolean;
  summary: PvaResearchReferenceSummaryV1;
}>) {
  const { t } = useTranslation();
  return (
    <article
      className={`rounded-2xl bg-wb-panel p-4 text-left shadow-sm ring-1 sm:p-5 ${
        selected ? "ring-2 ring-wb-accent" : "ring-wb-line/70"
      }`}
    >
      <button
        type="button"
        aria-pressed={selected}
        onClick={onSelect}
        className="flex w-full items-start justify-between gap-4 rounded-lg text-left transition-transform duration-150 active:scale-[0.99] motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
      >
        <span>
          <span className="block text-sm font-semibold">
            {t(`pvaResearch.reference.${summary.referenceId}`)}
          </span>
          <span className="mt-1 block text-xs leading-5 text-wb-subtle">
            {t(`pvaResearch.referenceDescription.${summary.referenceId}`)}
          </span>
        </span>
        {selected && (
          <span className="shrink-0 rounded-full bg-wb-accent/10 px-2 py-1 text-[10px] font-semibold text-wb-accent">
            {t("pvaResearch.selected")}
          </span>
        )}
      </button>
      <ClassificationBarV1 dataset={dataset} summary={summary} />
      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-wb-line/70 pt-3 text-xs">
        <div>
          <dt className="text-wb-subtle">{t("pvaResearch.areaStrips")}</dt>
          <dd className="mt-1 font-semibold tabular-nums">
            {summary.observedDomainAreaStripRowCount}
          </dd>
        </div>
        <div>
          <dt className="text-wb-subtle">{t("pvaResearch.intersections")}</dt>
          <dd className="mt-1 font-semibold tabular-nums">
            {summary.supportedIntersectionRowCount}
          </dd>
        </div>
      </dl>
    </article>
  );
}

function ClassificationBarV1({
  dataset,
  summary,
}: Readonly<{
  dataset: PvaResearchDatasetV1;
  summary: PvaResearchReferenceSummaryV1;
}>) {
  const { t } = useTranslation();
  return (
    <div className="mt-4">
      <div
        className="flex h-2.5 overflow-hidden rounded-full bg-wb-hover"
        role="img"
        aria-label={PVA_RESEARCH_CLASSIFICATIONS_V1.map(
          (classification) =>
            `${t(`pvaResearch.classification.${classification}`)}: ${summary.counts[classification]}`,
        ).join(", ")}
      >
        {PVA_RESEARCH_CLASSIFICATIONS_V1.map((classification) => (
          <span
            key={classification}
            className={classificationDotClassV1(classification)}
            style={{
              width: `${(100 * summary.counts[classification]) / dataset.attemptedRowCount}%`,
            }}
          />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
        {PVA_RESEARCH_CLASSIFICATIONS_V1.map((classification) => (
          <span
            key={classification}
            className="flex items-center gap-1 text-[10px] text-wb-subtle"
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${classificationDotClassV1(classification)}`}
              aria-hidden="true"
            />
            {t(`pvaResearch.classificationShort.${classification}`)}
            <span className="tabular-nums">
              {summary.counts[classification]}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

function SummaryMetricV1({
  detail,
  label,
  value,
}: Readonly<{
  detail: string;
  label: string;
  value: string;
}>) {
  return (
    <div className="border-b border-wb-line/70 px-4 py-5 last:border-b-0 sm:border-b-0 sm:border-r sm:px-5 sm:last:border-r-0">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-wb-subtle">
        {label}
      </dt>
      <dd className="mt-2 text-2xl font-semibold tracking-[-0.03em] tabular-nums">
        {value}
      </dd>
      <p className="mt-2 text-xs leading-5 text-wb-muted">{detail}</p>
    </div>
  );
}

function FilterSelectV1({
  label,
  onChange,
  options,
  value,
}: Readonly<{
  label: string;
  onChange: (value: string) => void;
  options: readonly (readonly [string, string])[];
  value: string;
}>) {
  return (
    <label className="grid gap-1.5 text-[11px] font-semibold text-wb-muted">
      {label}
      <span className="relative block">
        <select
          className="h-10 w-full appearance-none rounded-lg bg-wb-panel pl-3 pr-8 text-xs font-medium text-wb-text ring-1 ring-wb-line transition-shadow focus:outline-none focus:ring-2 focus:ring-wb-accent"
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
        >
          {options.map(([optionValue, optionLabel]) => (
            <option key={optionValue} value={optionValue}>
              {optionLabel}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-wb-subtle"
          aria-hidden="true"
        />
      </span>
    </label>
  );
}

function ResearchRowV1({
  locale,
  row,
}: Readonly<{
  locale: Locale;
  row: PvaResearchDisplayRowV1;
}>) {
  const { t } = useTranslation();
  return (
    <li className="border-b border-wb-line/70 px-4 py-4 last:border-b-0 sm:px-5">
      <article>
        <div className="grid gap-4 xl:grid-cols-[minmax(240px,1.25fr)_repeat(4,minmax(130px,0.7fr))] xl:items-start">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <ClassificationBadgeV1
                classification={row.reference.classification}
              />
              <span className="text-[11px] font-semibold text-wb-subtle">
                {row.ventricleId} ·{" "}
                {t("pvaResearch.beat", { count: row.beatOrdinal })}
              </span>
            </div>
            <h3 className="mt-2 text-sm font-semibold tracking-tight">
              {t(`pvaResearch.method.${row.systolicMethodId}`)}
            </h3>
            <p className="mt-1 text-[11px] text-wb-subtle">
              {t(`pvaResearch.direction.${row.directionId}`)}
              {row.reference.endpointDomainStatus !== null && (
                <>
                  {" "}
                  ·{" "}
                  {t(
                    `pvaResearch.domain.${row.reference.endpointDomainStatus}`,
                  )}
                </>
              )}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:contents">
            <RowMetricV1
              label={t("pvaResearch.rowMetrics.openPath")}
              value={formatEnergyV1(row.acceptedOpenPathJ, locale)}
            />
            <RowMetricV1
              label={t("pvaResearch.rowMetrics.syntheticClosure")}
              value={
                row.syntheticClosureFraction === null
                  ? t("pvaResearch.notAvailable")
                  : formatPercentV1(row.syntheticClosureFraction, locale)
              }
            />
            <RowMetricV1
              label={t("pvaResearch.rowMetrics.extrapolation")}
              value={
                row.systolicLineOutsideMeasuredRangeFraction === null
                  ? t("pvaResearch.notAvailable")
                  : formatPercentV1(
                      row.systolicLineOutsideMeasuredRangeFraction,
                      locale,
                    )
              }
            />
            <RowMetricV1
              label={t("pvaResearch.rowMetrics.areaStrip")}
              value={
                row.reference.observedDomainAreaJ === null
                  ? t("pvaResearch.notAvailable")
                  : formatEnergyV1(row.reference.observedDomainAreaJ, locale)
              }
            />
          </div>
        </div>
        {row.reference.reasons.length > 0 && (
          <details className="group mt-3">
            <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-md py-1 text-[11px] font-semibold text-wb-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent">
              <ChevronDown
                className="h-3 w-3 transition-transform duration-150 group-open:rotate-180 motion-reduce:transition-none"
                aria-hidden="true"
              />
              {t("pvaResearch.why")}
            </summary>
            <ul className="mt-2 grid gap-1 border-l-2 border-wb-line pl-3 text-[11px] leading-5 text-wb-subtle">
              {row.reference.reasons.map((reasonId) => (
                <li key={reasonId}>{t(`pvaResearch.reason.${reasonId}`)}</li>
              ))}
            </ul>
          </details>
        )}
      </article>
    </li>
  );
}

function ClassificationBadgeV1({
  classification,
}: Readonly<{
  classification: PvaResearchClassificationV1;
}>) {
  const { t } = useTranslation();
  return (
    <span
      className={`rounded-full px-2 py-1 text-[10px] font-semibold ${classificationBadgeClassV1(
        classification,
      )}`}
    >
      {t(`pvaResearch.classification.${classification}`)}
    </span>
  );
}

function RowMetricV1({
  label,
  value,
}: Readonly<{
  label: string;
  value: string;
}>) {
  return (
    <dl className="min-w-0">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.08em] text-wb-subtle">
        {label}
      </dt>
      <dd
        className="mt-1 truncate text-xs font-semibold tabular-nums"
        title={value}
      >
        {value}
      </dd>
    </dl>
  );
}

function classificationDotClassV1(
  classification: PvaResearchClassificationV1,
): string {
  switch (classification) {
    case "domain-supported-pva":
      return "bg-wb-success";
    case "transient-pva-like-area":
      return "bg-wb-accent";
    case "out-of-domain":
      return "bg-wb-warning";
    case "relation-inadmissible":
      return "bg-wb-danger";
    case "method-unavailable":
      return "bg-wb-subtle";
  }
}

function classificationBadgeClassV1(
  classification: PvaResearchClassificationV1,
): string {
  switch (classification) {
    case "domain-supported-pva":
      return "bg-wb-success/10 text-wb-success";
    case "transient-pva-like-area":
      return "bg-wb-accent/10 text-wb-accent";
    case "out-of-domain":
      return "bg-wb-warning-soft text-wb-warning";
    case "relation-inadmissible":
      return "bg-wb-danger/10 text-wb-danger";
    case "method-unavailable":
      return "bg-wb-hover text-wb-subtle";
  }
}

function formatEnergyV1(value: number, locale: Locale): string {
  const absolute = Math.abs(value);
  const formatted =
    absolute !== 0 && absolute < 0.001
      ? value.toExponential(2)
      : new Intl.NumberFormat(locale, {
          maximumFractionDigits: absolute < 0.1 ? 4 : 3,
        }).format(value);
  return `${formatted} J`;
}

function formatPercentV1(value: number, locale: Locale): string {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    maximumSignificantDigits: 4,
  }).format(value);
}

function formatSignedPercentV1(value: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === "ja" ? "ja-JP" : "en-US", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
    signDisplay: "always",
  }).format(value);
}

function formatNumberV1(
  value: number,
  locale: Locale,
  maximumFractionDigits: number,
): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits }).format(value);
}

export default PvaResearchDiagnosticViewV1;
