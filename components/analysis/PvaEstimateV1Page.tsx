import React from "react";
import {
  Activity,
  ArrowLeft,
  BookOpenText,
  CircleAlert,
  ExternalLink,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";

import {
  loadMainWireIntegratedModelNormalAdultPvaReferenceV1,
  MAIN_WIRE_INTEGRATED_MODEL_NORMAL_ADULT_PVA_REFERENCE_PROVENANCE_V1,
  type MainWireIntegratedModelPvaLimitationV1,
  type MainWireIntegratedModelPvaOutputV1,
  type MainWireIntegratedModelPvaReferenceV1,
} from "@/engine/myocardium/analysis/MainWireIntegratedModelPvaEstimateV1";
import { homeHref } from "@/homeLinks";
import { localeFromPathname, type Locale } from "@/localeRouting";

const RESEARCH_ARCHIVE_URL_V1 = `https://github.com/g960059/0DSimDemo/tree/${MAIN_WIRE_INTEGRATED_MODEL_NORMAL_ADULT_PVA_REFERENCE_PROVENANCE_V1.sourceResearchTag}`;

type ReferenceStateV1 =
  | Readonly<{ status: "idle" }>
  | Readonly<{
      status: "completed";
      reference: MainWireIntegratedModelPvaReferenceV1;
    }>;

export function PvaReferenceV1Page() {
  const { t } = useTranslation();
  const location = useLocation();
  const locale = localeFromPathname(location.pathname);
  const [state, setState] = React.useState<ReferenceStateV1>({
    status: "idle",
  });

  const showReference = React.useCallback(() => {
    setState({
      status: "completed",
      reference: loadMainWireIntegratedModelNormalAdultPvaReferenceV1(),
    });
  }, []);

  return (
    <div
      className="h-full overflow-y-auto bg-wb-app text-wb-text"
      data-testid="pva-reference-v1-page"
    >
      <main className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-7 sm:py-10">
        <Link
          to={homeHref(locale)}
          className="inline-flex min-h-9 items-center gap-2 rounded-lg px-2 text-xs font-semibold text-wb-muted transition-colors hover:bg-wb-hover hover:text-wb-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          {t("pvaEstimate.back")}
        </Link>

        <header className="mt-5 max-w-4xl">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-wb-accent">
            <Activity className="h-3.5 w-3.5" aria-hidden="true" />
            {t("pvaEstimate.eyebrow")}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
            {t("pvaEstimate.title")}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-wb-muted">
            {t("pvaEstimate.description")}
          </p>
        </header>

        <section className="mt-7 rounded-2xl border border-wb-line bg-wb-panel p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-base font-semibold">
                {t("pvaEstimate.referenceTitle")}
              </h2>
              <p className="mt-1 text-xs leading-6 text-wb-muted">
                {t("pvaEstimate.referenceDescription")}
              </p>
            </div>
            <button
              type="button"
              onClick={showReference}
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-wb-primary px-5 text-sm font-semibold text-white transition-[background-color,transform] hover:bg-wb-primary-hover active:scale-[0.98] disabled:cursor-wait disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
            >
              <BookOpenText className="h-4 w-4" aria-hidden="true" />
              {state.status === "completed"
                ? t("pvaEstimate.showAgain")
                : t("pvaEstimate.show")}
            </button>
          </div>
        </section>

        {state.status === "idle" && (
          <div className="mt-5 rounded-2xl border border-dashed border-wb-line px-5 py-10 text-center text-sm text-wb-muted">
            {t("pvaEstimate.idle")}
          </div>
        )}
        {state.status === "completed" && (
          <PvaReferenceResultV1 reference={state.reference} locale={locale} />
        )}

        <section className="mt-7 flex gap-3 rounded-2xl border border-wb-warning/35 bg-wb-warning-soft px-4 py-4 sm:px-5">
          <CircleAlert
            className="mt-0.5 h-5 w-5 shrink-0 text-wb-warning"
            aria-hidden="true"
          />
          <div>
            <h2 className="text-sm font-semibold">
              {t("pvaEstimate.boundaryTitle")}
            </h2>
            <p className="mt-1 max-w-4xl text-xs leading-6 text-wb-muted">
              {t("pvaEstimate.boundaryDescription")}
            </p>
            <p className="mt-1 max-w-4xl text-[11px] leading-5 text-wb-subtle">
              {t("pvaEstimate.provenance", {
                studyId:
                  MAIN_WIRE_INTEGRATED_MODEL_NORMAL_ADULT_PVA_REFERENCE_PROVENANCE_V1.sourceStudyId,
                tag: MAIN_WIRE_INTEGRATED_MODEL_NORMAL_ADULT_PVA_REFERENCE_PROVENANCE_V1.sourceResearchTag,
              })}
            </p>
            <a
              href={RESEARCH_ARCHIVE_URL_V1}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-wb-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wb-accent"
            >
              {t("pvaEstimate.researchArchive")}
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}

export function PvaReferenceResultV1({
  reference,
  locale,
}: Readonly<{
  reference: MainWireIntegratedModelPvaReferenceV1;
  locale: Locale;
}>) {
  const { t } = useTranslation();
  return (
    <section className="mt-7" data-testid="pva-reference-v1-result">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">
            {t("pvaEstimate.resultsTitle")}
          </h2>
          <p className="mt-1 text-xs leading-5 text-wb-subtle">
            {t("pvaEstimate.method", { methodId: reference.methodId })}
          </p>
        </div>
        <span
          className={
            reference.status === "limited"
              ? "rounded-full bg-wb-warning-soft px-3 py-1.5 text-xs font-semibold text-wb-warning ring-1 ring-wb-warning/30"
              : "rounded-full bg-wb-danger-soft px-3 py-1.5 text-xs font-semibold text-wb-danger ring-1 ring-wb-danger/30"
          }
        >
          {t(`pvaEstimate.status.${reference.status}`)}
        </span>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        {reference.outputs.map((output) => (
          <PvaVentricleCardV1
            key={output.ventricleId}
            output={output}
            locale={locale}
          />
        ))}
      </div>
    </section>
  );
}

function PvaVentricleCardV1({
  output,
  locale,
}: Readonly<{
  output: MainWireIntegratedModelPvaOutputV1;
  locale: Locale;
}>) {
  const { t } = useTranslation();
  if (output.status === "unavailable") {
    return (
      <article className="rounded-2xl border border-wb-line bg-wb-panel p-5">
        <h3 className="text-base font-semibold">{output.ventricleId}</h3>
        <p className="mt-3 text-sm text-wb-muted">
          {t("pvaEstimate.status.unavailable")}: {output.reason}
        </p>
      </article>
    );
  }

  return (
    <article
      className="overflow-hidden rounded-2xl border border-wb-line bg-wb-panel shadow-sm"
      data-testid={`pva-reference-v1-${output.ventricleId}`}
    >
      <header className="flex items-start justify-between gap-4 border-b border-wb-line px-5 py-4">
        <div>
          <p className="text-xs font-semibold text-wb-accent">
            {t("pvaEstimate.ventricle", { ventricle: output.ventricleId })}
          </p>
          <p className="mt-1 text-3xl font-semibold tracking-[-0.035em] tabular-nums">
            {formatNumberV1(output.pvaEstimateJ, locale, 3)}
            <span className="ml-1 text-sm font-medium text-wb-muted">J</span>
          </p>
        </div>
        <span className="rounded-full bg-wb-warning-soft px-2.5 py-1 text-[11px] font-semibold text-wb-warning">
          {t("pvaEstimate.status.limited")}
        </span>
      </header>

      <div className="p-5">
        <PvaRelationChartV1 output={output} locale={locale} />

        <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricV1
            label={t("pvaEstimate.metrics.externalWork")}
            value={`${formatNumberV1(output.externalWorkJ, locale, 3)} J`}
          />
          <MetricV1
            label={t("pvaEstimate.metrics.peEquivalent")}
            value={`${formatNumberV1(output.potentialEnergyEquivalentJ, locale, 3)} J`}
            detail={t("pvaEstimate.metrics.passiveSubtraction", {
              value: formatNumberV1(
                output.passiveReference
                  .positivePressureAreaBelowSystolicEndpointJ,
                locale,
                3,
              ),
            })}
          />
          <MetricV1
            label={t("pvaEstimate.metrics.emax")}
            value={`${formatNumberV1(output.systolicRelation.elastanceMmHgPerMl, locale, 3)}`}
            detail="mmHg/mL"
          />
          <MetricV1
            label={t("pvaEstimate.metrics.v0")}
            value={`${formatNumberV1(output.systolicRelation.volumeAxisInterceptMl, locale, 1)} mL`}
          />
        </dl>

        <div className="mt-5">
          <div className="flex items-center justify-between text-[11px] text-wb-subtle">
            <span>{t("pvaEstimate.metrics.externalWork")}</span>
            <span>{t("pvaEstimate.metrics.peEquivalent")}</span>
          </div>
          <div className="mt-1.5 flex h-2.5 overflow-hidden rounded-full bg-wb-soft">
            <span
              className="h-full bg-wb-accent"
              style={{ width: `${output.externalWorkFraction * 100}%` }}
            />
            <span className="h-full flex-1 bg-wb-warning" />
          </div>
        </div>

        <ul
          className="mt-5 space-y-2"
          aria-label={t("pvaEstimate.limitations")}
        >
          {output.limitations.map((limitation) => (
            <li
              key={limitation}
              className="flex items-start gap-2 text-xs leading-5 text-wb-muted"
            >
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-wb-warning" />
              {limitationTextV1(limitation, output, t)}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

function PvaRelationChartV1({
  output,
  locale,
}: Readonly<{
  output: Extract<MainWireIntegratedModelPvaOutputV1, { status: "limited" }>;
  locale: Locale;
}>) {
  const { t } = useTranslation();
  const relation = output.systolicRelation;
  const endpoint = output.systolicEndpoint;
  const span = endpoint.volumeMl - relation.volumeAxisInterceptMl;
  const xMinimum = Math.max(0, relation.volumeAxisInterceptMl - span * 0.08);
  const xMaximum = Math.max(
    endpoint.volumeMl + span * 0.08,
    output.passiveReference.zeroPressureVolumeMl,
  );
  const yMaximum = endpoint.fittedPressureMmHg * 1.14;
  const x = (volumeMl: number) =>
    38 + ((volumeMl - xMinimum) / (xMaximum - xMinimum)) * 350;
  const y = (pressureMmHg: number) => 150 - (pressureMmHg / yMaximum) * 122;
  const measuredStart = Math.max(
    relation.volumeAxisInterceptMl,
    relation.measuredVolumeRangeMl[0],
  );
  const measuredEnd = Math.min(
    endpoint.volumeMl,
    relation.measuredVolumeRangeMl[1],
  );
  const pressure = (volumeMl: number) =>
    relation.elastanceMmHgPerMl * (volumeMl - relation.volumeAxisInterceptMl);

  return (
    <figure>
      <svg
        viewBox="0 0 420 180"
        className="h-auto w-full rounded-xl bg-wb-soft/45"
        role="img"
        aria-label={t("pvaEstimate.geometryChartLabel", {
          ventricle: output.ventricleId,
        })}
      >
        <line
          x1="38"
          y1="150"
          x2="398"
          y2="150"
          className="stroke-wb-line-strong"
        />
        <line
          x1="38"
          y1="18"
          x2="38"
          y2="150"
          className="stroke-wb-line-strong"
        />
        <polygon
          points={`${x(relation.volumeAxisInterceptMl)},150 ${x(endpoint.volumeMl)},${y(endpoint.fittedPressureMmHg)} ${x(endpoint.volumeMl)},150`}
          className="fill-wb-warning/10"
        />
        <line
          x1={x(relation.volumeAxisInterceptMl)}
          y1={y(0)}
          x2={x(measuredStart)}
          y2={y(pressure(measuredStart))}
          className="stroke-wb-warning"
          strokeWidth="2.5"
          strokeDasharray="6 5"
        />
        <line
          x1={x(measuredStart)}
          y1={y(pressure(measuredStart))}
          x2={x(measuredEnd)}
          y2={y(pressure(measuredEnd))}
          className="stroke-wb-accent"
          strokeWidth="3"
        />
        <circle
          cx={x(endpoint.volumeMl)}
          cy={y(endpoint.fittedPressureMmHg)}
          r="4"
          className="fill-wb-accent"
        />
        <line
          x1={x(output.passiveReference.zeroPressureVolumeMl)}
          y1="139"
          x2={x(output.passiveReference.zeroPressureVolumeMl)}
          y2="155"
          className="stroke-wb-subtle"
          strokeDasharray="2 3"
        />
        <text x="10" y="24" className="fill-wb-subtle text-[9px]">
          P
        </text>
        <text x="392" y="168" className="fill-wb-subtle text-[9px]">
          V
        </text>
        <text
          x={x(relation.volumeAxisInterceptMl)}
          y="168"
          textAnchor="middle"
          className="fill-wb-subtle text-[8px]"
        >
          V0
        </text>
        <text
          x={x(endpoint.volumeMl)}
          y="168"
          textAnchor="middle"
          className="fill-wb-subtle text-[8px]"
        >
          Ves
        </text>
      </svg>
      <figcaption className="mt-2 text-[10px] leading-5 text-wb-subtle">
        <span className="block font-medium text-wb-muted">
          {t("pvaEstimate.chart.geometryNotice")}
        </span>
        <span className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-5 bg-wb-accent" />
            {t("pvaEstimate.chart.measured")}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0 w-5 border-t-2 border-dashed border-wb-warning" />
            {t("pvaEstimate.chart.extrapolated")}
          </span>
          <span>
            {t("pvaEstimate.chart.outside", {
              value: formatPercentV1(
                output.sensitivity.systolicAreaOutsideMeasuredRangeFraction,
                locale,
              ),
            })}
          </span>
        </span>
      </figcaption>
    </figure>
  );
}

function MetricV1({
  detail,
  label,
  value,
}: Readonly<{ detail?: string; label: string; value: string }>) {
  return (
    <div className="rounded-xl bg-wb-soft/55 px-3 py-3">
      <dt className="text-[10px] font-medium text-wb-subtle">{label}</dt>
      <dd className="mt-1 text-sm font-semibold tabular-nums text-wb-text">
        {value}
      </dd>
      {detail !== undefined && (
        <p className="mt-0.5 text-[9px] text-wb-subtle">{detail}</p>
      )}
    </div>
  );
}

function limitationTextV1(
  limitation: MainWireIntegratedModelPvaLimitationV1,
  output: Extract<MainWireIntegratedModelPvaOutputV1, { status: "limited" }>,
  t: ReturnType<typeof useTranslation>["t"],
): string {
  if (limitation === "systolic-relation-extrapolation") {
    return t(`pvaEstimate.limitation.${limitation}`, {
      value: Math.round(
        output.sensitivity.systolicAreaOutsideMeasuredRangeFraction * 100,
      ),
    });
  }
  if (limitation === "protocol-direction-sensitivity") {
    return t(`pvaEstimate.limitation.${limitation}`, {
      value: Math.round(
        Math.abs(output.sensitivity.releaseSlopeDifferenceFraction) * 100,
      ),
    });
  }
  if (limitation === "phase-resolution-sensitivity") {
    return t(`pvaEstimate.limitation.${limitation}`, {
      value: (
        output.sensitivity.phaseResolutionRelativeDifference * 100
      ).toFixed(1),
    });
  }
  return t(`pvaEstimate.limitation.${limitation}`);
}

function formatNumberV1(value: number, locale: Locale, digits: number): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

function formatPercentV1(value: number, locale: Locale): string {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value);
}
