import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CYCLE_DIAGNOSTICS_CLAIM_V1,
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CYCLE_WALL_IDS_V1,
  measureMainWireNormalAdultFiveWallCycleDiagnosticsV1,
  type MainWireNormalAdultFiveWallCycleDiagnosticsV1,
  type MainWireNormalAdultFiveWallCyclePhaseV1,
  type MainWireNormalAdultFiveWallCycleWallIdV1,
} from "@/engine/myocardium/diagnostics/MainWireNormalAdultFiveWallCycleDiagnosticsV1";
import type {
  MainWireNormalAdultFiveWallDiagnosticSampleV2,
} from "@/engine/myocardium/diagnostics/MainWireNormalAdultFiveWallDiagnosticSampleV2";
import type {
  MainWireFiveWallPeriodicClosureGroupReportV1,
  MainWireFiveWallPeriodicClosureGroupV1,
} from "@/engine/myocardium/experiments/MainWireFiveWallPeriodicClosureV1";
import type {
  MainWireNormalAdultFiveWallPeriodicResultV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_NOMINAL_JACOBIAN_SCALED_STEP_V1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import {
  NORMAL_ADULT_FIVE_WALL_PRIOR_V1,
} from "@/engine/myocardium/mechanics/normalAdultFiveWallPriorV1";

export const MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_REVIEW_V1_ID =
  "main-wire-normal-adult-five-wall-periodic-review-v1" as const;

export const MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_REVIEW_CLAIM_V1 =
  Object.freeze({
    source: "periodic-runner-retained-accepted-samples" as const,
    timeSeriesSmoothingApplied: false as const,
    timeSeriesResamplingOrInterpolationApplied: false as const,
    piecewiseLinearPlotSegmentsApplied: true as const,
    plottedSegments: "straight-between-consecutive-accepted-endpoints" as const,
    pvLoopPressure: "intracavitary-absolute-pressure" as const,
    transmuralPressureReservedForWallWorkAndConstitutiveDiagnostics: true as const,
    addsDynamicState: false as const,
    parameterSearchOrTuning: false as const,
    physiologyGateAdded: false as const,
    morphologyInterpretationRequiresPeriod1Convergence: true as const,
    timeStepRobustnessAssessedBySingleReview: false as const,
    currentModelCoreRuntimeAdoptionClaimed: false as const,
    pulmonaryVenousSignal:
      "aggregate-PVein-to-LA-edge-not-separate-vein-measurements" as const,
    mitralVti:
      "modeled-bulk-flow-divided-by-modeled-instantaneous-physical-EOA" as const,
    relaxationTau:
      "report-only-fixed-asymptote-log-linear-fit-over-AoV-closure-to-MVO" as const,
    landThermodynamicStoredEnergyClaimed: false as const,
    embeddedHtmlData:
      "plot-trace-projection-plus-cycle-diagnostics-not-full-material-readback" as const,
  });

const CLOSURE_GROUP_ORDER = Object.freeze([
  "circulation-node-volume",
  "dynamic-edge-flow",
  "valve-opening",
  "triseg-coordinate",
  "land-state",
  "sls-viscous-strain",
  "wall-input-history",
] as const satisfies readonly MainWireFiveWallPeriodicClosureGroupV1[]);

const WALL_COLORS = Object.freeze({
  LA: "#38bdf8",
  LVFW: "#a78bfa",
  SEP: "#f59e0b",
  RVFW: "#22c55e",
  RA: "#fb7185",
} as const);

const PHASE_COLORS = Object.freeze({
  reservoir: "#38bdf8",
  conduit: "#f59e0b",
  pumping: "#ec4899",
} as const);

const GROUP_COLORS = Object.freeze({
  "circulation-node-volume": "#38bdf8",
  "dynamic-edge-flow": "#f97316",
  "valve-opening": "#22c55e",
  "triseg-coordinate": "#e879f9",
  "land-state": "#a78bfa",
  "sls-viscous-strain": "#facc15",
  "wall-input-history": "#fb7185",
} as const);

type Point = Readonly<{ x: number; y: number }>;
type LineSeries = Readonly<{
  label: string;
  color: string;
  paths: readonly (readonly Point[])[];
  dashed?: boolean;
  width?: number;
}>;
type BarSeries = Readonly<{
  label: string;
  color: string;
  values: readonly number[];
}>;

export type MainWireNormalAdultFiveWallPeriodicReviewV1 = Readonly<{
  reviewId: typeof MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_REVIEW_V1_ID;
  generatedFromExperimentId: string;
  run: Readonly<{
    dtSec: number;
    stepsPerBeat: number;
    completedBeatCount: number;
    terminationReason: string;
    integrationCompletedWithoutFailure: boolean;
    periodicSteadyStateClaimed: boolean;
    timeStepRobustness: "not-assessed-by-single-result";
    period2OrbitSuspected: boolean;
    latestBeatIndex: number;
    previousBeatIndex: number | null;
    laSlsMode: string;
    pericardiumMode: string;
    pericardiumCase: string;
    pericardiumParameterSetId: string;
    initialization: string;
    protocolIdentityHash: string;
    jacobianFiniteDifferenceWidthAudit: Readonly<{
      nominalScaledStep: number;
      nominalStepCount: number;
      alternateStepCount: number;
    }>;
  }>;
  currentBeatSamples:
    readonly MainWireNormalAdultFiveWallDiagnosticSampleV2[];
  previousBeatSamples:
    readonly MainWireNormalAdultFiveWallDiagnosticSampleV2[];
  cycleDiagnostics: MainWireNormalAdultFiveWallCycleDiagnosticsV1;
  convergence: Readonly<{
    policyTolerance: number;
    beatHistory: readonly Readonly<{
      beatIndex: number;
      period1OverallMaximumNormalizedDelta: number | null;
      period2OverallMaximumNormalizedDelta: number | null;
      period1MaximumNormalizedDeltaByGroup: Readonly<Partial<Record<
        MainWireFiveWallPeriodicClosureGroupV1,
        number
      >>>;
    }>[];
    latestWorstPath: string | null;
    latestWorstGroup: MainWireFiveWallPeriodicClosureGroupV1 | null;
    latestMaximumNormalizedDelta: number | null;
    latestGroupReports:
      readonly MainWireFiveWallPeriodicClosureGroupReportV1[];
  }>;
  claim: typeof MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_REVIEW_CLAIM_V1;
}>;

export type MainWireNormalAdultFiveWallPeriodicReviewRenderedV1 = Readonly<{
  html: string;
  svg: string;
  review: MainWireNormalAdultFiveWallPeriodicReviewV1;
}>;

export function buildMainWireNormalAdultFiveWallPeriodicReviewV1(
  result: MainWireNormalAdultFiveWallPeriodicResultV1,
): MainWireNormalAdultFiveWallPeriodicReviewV1 {
  const currentBeat = result.retainedCompleteBeats.at(-1);
  if (!currentBeat || currentBeat.samples.length === 0) {
    throw new Error("periodic result has no retained complete beat to review");
  }
  if (currentBeat.samples.length !== result.stepsPerBeat) {
    throw new Error("latest retained beat does not contain one complete cycle");
  }
  const previousCandidate = result.retainedCompleteBeats.at(-2);
  const previousBeat = previousCandidate
    && previousCandidate.beatIndex === currentBeat.beatIndex - 1
    && previousCandidate.samples.length === result.stepsPerBeat
    ? previousCandidate
    : null;
  const calcium = FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1;
  const atrialOnsetPhase01 = positiveModulo(
    calcium.cycleLengthSec - calcium.atrioventricularDelaySec
      + calcium.atrial.electricalToCalciumDelaySec,
    calcium.cycleLengthSec,
  ) / calcium.cycleLengthSec;
  const cycleDiagnostics =
    measureMainWireNormalAdultFiveWallCycleDiagnosticsV1({
      samples: currentBeat.samples,
      precedingSample: previousBeat?.samples.at(-1) ?? null,
      dtSec: result.dtSec,
      atrialCalciumOnsetPhase01: atrialOnsetPhase01,
      wallMaterialVolumeMlByWall: wallMaterialVolumesMl(),
    });
  const latestClosure = result.beatClosure.at(-1)?.period1 ?? null;
  const nominalJacobianStep =
    MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_NOMINAL_JACOBIAN_SCALED_STEP_V1;
  const nominalJacobianStepCount = currentBeat.samples.filter((sample) =>
    sample.acceptedMechanicsJacobianAudit.finiteDifferenceScaledStepUsed
      === nominalJacobianStep).length;
  return Object.freeze({
    reviewId: MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_REVIEW_V1_ID,
    generatedFromExperimentId: result.experimentId,
    run: Object.freeze({
      dtSec: result.dtSec,
      stepsPerBeat: result.stepsPerBeat,
      completedBeatCount: result.completedBeatCount,
      terminationReason: result.terminationReason,
      integrationCompletedWithoutFailure:
        result.integrationCompletedWithoutFailure,
      periodicSteadyStateClaimed: result.periodicSteadyStateClaimed,
      timeStepRobustness: "not-assessed-by-single-result" as const,
      period2OrbitSuspected: result.period2OrbitSuspected,
      latestBeatIndex: currentBeat.beatIndex,
      previousBeatIndex: previousBeat?.beatIndex ?? null,
      laSlsMode: result.laSlsMode,
      pericardiumMode: result.pericardiumMode,
      pericardiumCase: result.pericardiumCase,
      pericardiumParameterSetId: result.pericardiumParameterSetId,
      initialization: result.initialization,
      protocolIdentityHash: result.protocolIdentityHash,
      jacobianFiniteDifferenceWidthAudit: Object.freeze({
        nominalScaledStep: nominalJacobianStep,
        nominalStepCount: nominalJacobianStepCount,
        alternateStepCount:
          currentBeat.samples.length - nominalJacobianStepCount,
      }),
    }),
    currentBeatSamples: currentBeat.samples,
    previousBeatSamples: previousBeat?.samples ?? Object.freeze([]),
    cycleDiagnostics,
    convergence: Object.freeze({
      policyTolerance: result.policy.period1NormalizedTolerance,
      beatHistory: Object.freeze(result.beatClosure.map((beat) => Object.freeze({
        beatIndex: beat.beatIndex,
        period1OverallMaximumNormalizedDelta:
          beat.period1?.overall.maximumNormalizedDelta ?? null,
        period2OverallMaximumNormalizedDelta:
          beat.period2?.overall.maximumNormalizedDelta ?? null,
        period1MaximumNormalizedDeltaByGroup: Object.freeze(
          Object.fromEntries(CLOSURE_GROUP_ORDER.flatMap((group) => {
            const value = beat.period1?.groups[group].maximumNormalizedDelta;
            return value === undefined ? [] : [[group, value]];
          })),
        ),
      }))),
      latestWorstPath: latestClosure?.overall.worstPath ?? null,
      latestWorstGroup: latestClosure?.overall.worstGroup ?? null,
      latestMaximumNormalizedDelta:
        latestClosure?.overall.maximumNormalizedDelta ?? null,
      latestGroupReports: Object.freeze(latestClosure
        ? CLOSURE_GROUP_ORDER.map((group) => latestClosure.groups[group])
        : []),
    }),
    claim: MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_REVIEW_CLAIM_V1,
  });
}

export function renderMainWireNormalAdultFiveWallPeriodicReviewV1(
  result: MainWireNormalAdultFiveWallPeriodicResultV1,
): MainWireNormalAdultFiveWallPeriodicReviewRenderedV1 {
  const review = buildMainWireNormalAdultFiveWallPeriodicReviewV1(result);
  const svg = renderSvg(review, result);
  const diagnostics = review.cycleDiagnostics;
  const statusClass = review.run.periodicSteadyStateClaimed
    ? "warn"
    : review.run.period2OrbitSuspected ? "danger" : "warn";
  const statusText = review.run.periodicSteadyStateClaimed
    ? "Current-dt period-1 established; time-step robustness is not assessed by this page"
    : review.run.period2OrbitSuspected
      ? "Period-2 orbit suspected; morphology is not accepted"
      : "Periodic steady state is not established; morphology is provisional";
  const embedded = safeScriptJson(embeddedReviewPayload(review));
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Periodic five-wall physiology review V1</title>
  <style>${htmlCss()}</style>
</head>
<body><main>
  <header>
    <div class="eyebrow">Research sidecar · fixed-prior review</div>
    <h1>Periodic five-wall physiology review</h1>
    <p class="subtitle">Raw accepted samples from the retained terminal beat; straight endpoint segments only. No time-series smoothing or resampling, parameter fitting, or added dynamic state.</p>
  </header>
  <div class="status ${statusClass}" role="status"><strong>${escapeHtml(statusText)}</strong><span>termination: ${escapeHtml(review.run.terminationReason)}</span></div>
  <section class="cards" aria-label="Run summary">
    ${card("latest beat", String(review.run.latestBeatIndex))}
    ${card("time step", `${format(review.run.dtSec * 1000, 3)} ms`)}
    ${card("period-1 delta", scientific(review.convergence.latestMaximumNormalizedDelta))}
    ${card("LA Vmax / Vmin", `${format(diagnostics.leftAtrialVolumes.maximumMl, 1)} / ${format(diagnostics.leftAtrialVolumes.minimumMl, 1)} mL`)}
    ${card("MV peak E/A", nullableRatio(diagnostics.mitral.peakERatioToA))}
    ${card("PV S/D volume", nullableRatio(safeRatio(diagnostics.pulmonaryVenous.S.forwardVolumeMl, diagnostics.pulmonaryVenous.D.forwardVolumeMl)))}
    ${card("pericardium", `${review.run.pericardiumMode} · ${review.run.pericardiumCase}`)}
    ${card("peak Pperi", `${format(maximum(review.currentBeatSamples.map((sample) => sample.commonPericardium.excessPressureMmHg)), 3)} mmHg`)}
    ${card("Jacobian FD nominal / alternate", `${review.run.jacobianFiniteDifferenceWidthAudit.nominalStepCount} / ${review.run.jacobianFiniteDifferenceWidthAudit.alternateStepCount}`)}
    ${card("protocol identity", review.run.protocolIdentityHash.slice(0, 12))}
  </section>
  <section class="figure" aria-label="Periodic review plots">${svg}</section>
  <section class="table-grid">
    ${convergenceTable(review)}
    ${flowTable(diagnostics)}
    ${workTable(diagnostics)}
  </section>
  <section class="boundary" aria-labelledby="claim-boundaries">
    <h2 id="claim-boundaries">Claim boundaries</h2>
    <ul>
      <li>This is the main-wire-derived noncoronary experimental sidecar, not a claim of current ModelCore/browser-runtime adoption.</li>
      <li>Physiology and PV morphology are interpretable only after period-1 closure; the page remains useful as a numerical settling diagnostic before then.</li>
      <li>Period-1 closure applies only to the displayed dt. A separate dt comparison is required before claiming time-step robustness.</li>
      <li>PV panels use intracavitary absolute pressure. Wall-work and constitutive diagnostics use transmural pressure, so common pericardial work is not counted twice.</li>
      <li>A zero common-pericardial pressure means the structural model is in its exact slack branch; it does not mean the pericardium was omitted.</li>
      <li>Pulmonary venous flow is one aggregate PVein→LA edge, not four separately measured veins.</li>
      <li>Mitral VTI is modeled bulk flow divided by modeled instantaneous physical EOA; it is not a validated clinical Doppler VTI.</li>
      <li>Land active stress has no thermodynamic stored-energy claim. Work signs follow the diagnostic API: positive means work on the wall.</li>
      <li>The normalized free-Ca used for PV-lobe selection is a diagnostic proxy, not the Land activation or tension state.</li>
      <li>The relaxation time is a report-only fixed-asymptote fit between AoV closure and MVO.</li>
    </ul>
  </section>
  <details><summary>Numerical diagnostics and claim metadata</summary><pre>${escapeHtml(JSON.stringify({
    run: review.run,
    convergence: review.convergence,
    cycleDiagnostics: review.cycleDiagnostics,
    claim: review.claim,
  }, null, 2))}</pre></details>
  <script type="application/json" id="periodic-review-data">${embedded}</script>
</main></body></html>`;
  return Object.freeze({ html, svg, review });
}

function renderSvg(
  review: MainWireNormalAdultFiveWallPeriodicReviewV1,
  result: MainWireNormalAdultFiveWallPeriodicResultV1,
): string {
  const current = review.currentBeatSamples;
  const previous = review.previousBeatSamples;
  const phases = review.cycleDiagnostics.phaseBySample;
  const width = 2140;
  const panelWidth = 500;
  const panelHeight = 310;
  const gapX = 26;
  const gapY = 42;
  const left = 34;
  const top = 96;
  const panel = (column: number, row: number) => Object.freeze({
    x: left + column * (panelWidth + gapX),
    y: top + row * (panelHeight + gapY),
    width: panelWidth,
    height: panelHeight,
  });
  const atrialPvSeries = (chamber: "LA" | "RA"): LineSeries[] => {
    const series = phaseSeries(
      current,
      phases,
      (sample) => sample.nodeVolumeMl[chamber],
      (sample) => sample.nodeAbsolutePressureMmHg[chamber],
    );
    if (previous.length > 0) {
      series.unshift(lineSeries(
        "previous beat",
        "#64748b",
        previous,
        (sample) => sample.nodeVolumeMl[chamber],
        (sample) => sample.nodeAbsolutePressureMmHg[chamber],
        { dashed: true, width: 1.35 },
      ));
    }
    return series;
  };
  const ventricularPvSeries = (
    chamber: "LV" | "RV",
    color: string,
  ): LineSeries[] => [
    ...(previous.length > 0 ? [lineSeries(
      "previous beat",
      "#64748b",
      periodicPvSamples(previous, result.periodicSteadyStateClaimed),
      (sample) => sample.nodeVolumeMl[chamber],
      (sample) => sample.nodeAbsolutePressureMmHg[chamber],
      { dashed: true, width: 1.35 },
    )] : []),
    lineSeries(
      "current beat",
      color,
      periodicPvSamples(current, result.periodicSteadyStateClaimed),
      (sample) => sample.nodeVolumeMl[chamber],
      (sample) => sample.nodeAbsolutePressureMmHg[chamber],
    ),
  ];
  const convergence = convergenceSeries(result);
  const panels = [
    renderLinePanel(
      panel(0, 0),
      "LA blood-volume PV",
      "LA blood volume (mL)",
      "absolute LAP (mmHg)",
      atrialPvSeries("LA"),
    ),
    renderLinePanel(
      panel(1, 0),
      "LV blood-volume PV",
      "LV blood volume (mL)",
      "absolute LVP (mmHg)",
      ventricularPvSeries("LV", "#a78bfa"),
    ),
    renderLinePanel(
      panel(2, 0),
      "RA blood-volume PV",
      "RA blood volume (mL)",
      "absolute RAP (mmHg)",
      atrialPvSeries("RA"),
    ),
    renderLinePanel(
      panel(3, 0),
      "RV blood-volume PV",
      "RV blood volume (mL)",
      "absolute RVP (mmHg)",
      ventricularPvSeries("RV", "#22c55e"),
    ),
    renderLinePanel(
      panel(0, 1),
      "Left-heart absolute pressures",
      "cardiac phase",
      "pressure (mmHg)",
      [
        phaseDomainLineSeries("LAP", "#38bdf8", current, (sample) =>
          sample.nodeAbsolutePressureMmHg.LA),
        phaseDomainLineSeries("LVP", "#a78bfa", current, (sample) =>
          sample.nodeAbsolutePressureMmHg.LV),
        phaseDomainLineSeries("AoP", "#f97316", current, (sample) =>
          sample.nodeAbsolutePressureMmHg.Ao),
        phaseDomainLineSeries("PVein", "#22c55e", current, (sample) =>
          sample.nodeAbsolutePressureMmHg.PVein),
      ],
    ),
    renderLinePanel(
      panel(1, 1),
      "Right-heart absolute pressures",
      "cardiac phase",
      "pressure (mmHg)",
      [
        phaseDomainLineSeries("RAP", "#fb7185", current, (sample) =>
          sample.nodeAbsolutePressureMmHg.RA),
        phaseDomainLineSeries("RVP", "#22c55e", current, (sample) =>
          sample.nodeAbsolutePressureMmHg.RV),
        phaseDomainLineSeries("PAP", "#f59e0b", current, (sample) =>
          sample.nodeAbsolutePressureMmHg.PA),
      ],
    ),
    renderLinePanel(
      panel(2, 1),
      "AV-valve and pulmonary-venous flow",
      "cardiac phase",
      "flow (mL/s)",
      [
        phaseDomainLineSeries("MV", "#ec4899", current, (sample) =>
          sample.flowMlPerSec.MV),
        phaseDomainLineSeries("TV", "#38bdf8", current, (sample) =>
          sample.flowMlPerSec.TV),
        phaseDomainLineSeries("PVein→LA", "#22c55e", current, (sample) =>
          sample.flowMlPerSec.PVein_LA),
      ],
      [0],
    ),
    renderLinePanel(
      panel(3, 1),
      "Semilunar-valve flow",
      "cardiac phase",
      "flow (mL/s)",
      [
        phaseDomainLineSeries("AoV", "#f97316", current, (sample) =>
          sample.flowMlPerSec.AoV),
        phaseDomainLineSeries("PV", "#f59e0b", current, (sample) =>
          sample.flowMlPerSec.PV),
      ],
      [0],
    ),
    renderLinePanel(
      panel(0, 2),
      "Valve opening memory",
      "cardiac phase",
      "opening fraction",
      [
        phaseDomainLineSeries("MV", "#ec4899", current, (sample) =>
          sample.valveOpeningFraction01.MV),
        phaseDomainLineSeries("AoV", "#f97316", current, (sample) =>
          sample.valveOpeningFraction01.AoV),
        phaseDomainLineSeries("TV", "#38bdf8", current, (sample) =>
          sample.valveOpeningFraction01.TV),
        phaseDomainLineSeries("PV", "#f59e0b", current, (sample) =>
          sample.valveOpeningFraction01.PV),
      ],
      [0, 1],
    ),
    renderLinePanel(
      panel(1, 2),
      "Atrial and pulmonary-venous pressures",
      "cardiac phase",
      "absolute pressure (mmHg)",
      [
        phaseDomainLineSeries("LAP", "#38bdf8", current, (sample) =>
          sample.nodeAbsolutePressureMmHg.LA),
        phaseDomainLineSeries("RAP", "#fb7185", current, (sample) =>
          sample.nodeAbsolutePressureMmHg.RA),
        phaseDomainLineSeries("PVein", "#22c55e", current, (sample) =>
          sample.nodeAbsolutePressureMmHg.PVein),
      ],
    ),
    renderLinePanel(
      panel(2, 2),
      "Common pericardial pressure",
      "cardiac phase",
      "pressure (mmHg)",
      [phaseDomainLineSeries("Pperi", "#e879f9", current, (sample) =>
        sample.commonPericardium.excessPressureMmHg)],
      [0],
    ),
    renderLinePanel(
      panel(3, 2),
      "Left-atrial blood volume",
      "cardiac phase",
      "LA volume (mL)",
      phaseDomainPhaseSeries(
        current,
        phases,
        (sample) => sample.nodeVolumeMl.LA,
      ),
    ),
    renderLinePanel(
      panel(0, 3),
      "Group-wise beat closure",
      "completed beat",
      "log10 normalized delta",
      convergence,
      [Math.log10(result.policy.period1NormalizedTolerance)],
    ),
    renderBarPanel(
      panel(1, 3),
      "Phasic flow-volume ledger",
      "window",
      "integrated volume (mL)",
      ["PV S", "PV D", "PV Ar", "MV E", "MV A"],
      phasicFlowBars(review.cycleDiagnostics),
      true,
    ),
    renderBarPanel(
      panel(2, 3),
      "Wall stress work",
      "wall",
      "work on wall (mJ)",
      MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CYCLE_WALL_IDS_V1,
      wallWorkBars(review.cycleDiagnostics),
      true,
    ),
    renderBarPanel(
      panel(3, 3),
      "SLS energy ledger",
      "wall",
      "energy per cycle (mJ)",
      MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CYCLE_WALL_IDS_V1,
      slsEnergyBars(review.cycleDiagnostics),
      true,
    ),
  ].join("\n");
  const height = 1485;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="review-svg-title review-svg-description">
  <title id="review-svg-title">Periodic five-wall raw physiology and numerical diagnostics</title>
  <desc id="review-svg-description">Sixteen plots show four-chamber intracavitary pressure-volume loops, bilateral and atrial pressure waveforms, all four valve flows and openings, aggregate pulmonary-venous flow, common pericardial pressure, left-atrial volume, group-wise beat closure, phasic flow, wall work, and SLS energy. Lines connect raw accepted endpoints without smoothing.</desc>
  <rect width="100%" height="100%" fill="#081426"/>
  <text x="34" y="39" fill="#e7eef9" font-size="24" font-weight="700">Raw terminal-beat physiology and energy ownership</text>
  <text x="34" y="66" fill="#9fb0c8" font-size="13">Straight accepted-step segments · no smoothing or time-series resampling · phase colors: reservoir / conduit / pumping</text>
  ${panels}
  </svg>`;
}

function phaseSeries(
  samples: readonly MainWireNormalAdultFiveWallDiagnosticSampleV2[],
  phases: readonly MainWireNormalAdultFiveWallCyclePhaseV1[],
  x: (sample: MainWireNormalAdultFiveWallDiagnosticSampleV2) => number,
  y: (sample: MainWireNormalAdultFiveWallDiagnosticSampleV2) => number,
): LineSeries[] {
  return (["reservoir", "conduit", "pumping"] as const).map((target) => ({
    label: target,
    color: PHASE_COLORS[target],
    paths: contiguousPhaseRuns(samples, phases, target).map((run) =>
      run.map((sample) => ({ x: x(sample), y: y(sample) }))),
    width: 2.4,
  }));
}

function periodicPvSamples(
  samples: readonly MainWireNormalAdultFiveWallDiagnosticSampleV2[],
  period1Converged: boolean,
): readonly MainWireNormalAdultFiveWallDiagnosticSampleV2[] {
  if (!period1Converged || samples.length === 0) return samples;
  return Object.freeze([...samples, samples[0]!]);
}

function phaseDomainPhaseSeries(
  samples: readonly MainWireNormalAdultFiveWallDiagnosticSampleV2[],
  phases: readonly MainWireNormalAdultFiveWallCyclePhaseV1[],
  y: (sample: MainWireNormalAdultFiveWallDiagnosticSampleV2) => number,
): LineSeries[] {
  const unwrapped =
    unwrapMainWireNormalAdultFiveWallPeriodicReviewPhase01V1(
      samples.map((sample) => sample.cyclePhase01),
    );
  return (["reservoir", "conduit", "pumping"] as const).map((target) => ({
    label: target,
    color: PHASE_COLORS[target],
    paths: contiguousPhaseIndexRuns(phases, target).map((run) =>
      run.map((index) => ({
        x: unwrapped[index]!,
        y: y(samples[index]!),
      }))),
    width: 2.4,
  }));
}

function contiguousPhaseRuns(
  samples: readonly MainWireNormalAdultFiveWallDiagnosticSampleV2[],
  phases: readonly MainWireNormalAdultFiveWallCyclePhaseV1[],
  target: MainWireNormalAdultFiveWallCyclePhaseV1,
): readonly (readonly MainWireNormalAdultFiveWallDiagnosticSampleV2[])[] {
  const runs: MainWireNormalAdultFiveWallDiagnosticSampleV2[][] = [];
  let run: MainWireNormalAdultFiveWallDiagnosticSampleV2[] = [];
  for (let index = 0; index < samples.length; index += 1) {
    if (phases[index] === target) {
      if (run.length === 0) {
        run.push(samples[positiveModulo(index - 1, samples.length)]!);
      }
      run.push(samples[index]!);
    } else if (run.length > 0) {
      runs.push(run);
      run = [];
    }
  }
  if (run.length > 0) runs.push(run);
  return Object.freeze(runs.map((value) => Object.freeze(value)));
}

function contiguousPhaseIndexRuns(
  phases: readonly MainWireNormalAdultFiveWallCyclePhaseV1[],
  target: MainWireNormalAdultFiveWallCyclePhaseV1,
): readonly (readonly number[])[] {
  const runs: number[][] = [];
  let run: number[] = [];
  for (let index = 0; index < phases.length; index += 1) {
    if (phases[index] === target) {
      if (run.length === 0 && index > 0) run.push(index - 1);
      run.push(index);
    } else if (run.length > 0) {
      runs.push(run);
      run = [];
    }
  }
  if (run.length > 0) runs.push(run);
  return Object.freeze(runs.map((value) => Object.freeze(value)));
}

function lineSeries(
  label: string,
  color: string,
  samples: readonly MainWireNormalAdultFiveWallDiagnosticSampleV2[],
  x: (sample: MainWireNormalAdultFiveWallDiagnosticSampleV2) => number,
  y: (sample: MainWireNormalAdultFiveWallDiagnosticSampleV2) => number,
  style: Readonly<{ dashed?: boolean; width?: number }> = {},
): LineSeries {
  return Object.freeze({
    label,
    color,
    paths: Object.freeze([Object.freeze(samples.map((sample) => Object.freeze({
      x: x(sample),
      y: y(sample),
    })))]),
    dashed: style.dashed,
    width: style.width,
  });
}

function phaseDomainLineSeries(
  label: string,
  color: string,
  samples: readonly MainWireNormalAdultFiveWallDiagnosticSampleV2[],
  y: (sample: MainWireNormalAdultFiveWallDiagnosticSampleV2) => number,
): LineSeries {
  const unwrapped =
    unwrapMainWireNormalAdultFiveWallPeriodicReviewPhase01V1(
      samples.map((sample) => sample.cyclePhase01),
    );
  return Object.freeze({
    label,
    color,
    paths: Object.freeze([Object.freeze(samples.map((sample, index) =>
      Object.freeze({ x: unwrapped[index]!, y: y(sample) })))]),
    width: 2.1,
  });
}

/**
 * Plot-only cyclic phase unwrap. Accepted sample order is preserved; a wrapped
 * terminal phase near zero is shown at one instead of drawing back to zero.
 */
export function unwrapMainWireNormalAdultFiveWallPeriodicReviewPhase01V1(
  phases: readonly number[],
): readonly number[] {
  const tolerance = 1e-10;
  let cycleOffset = 0;
  let previous = Number.NEGATIVE_INFINITY;
  return Object.freeze(phases.map((phaseValue, index) => {
    if (
      !Number.isFinite(phaseValue)
      || phaseValue < -tolerance
      || phaseValue >= 1 + tolerance
    ) throw new Error(`invalid cycle phase at sample ${index}`);
    const phase = Math.abs(phaseValue) <= tolerance ? 0 : phaseValue;
    let unwrapped = phase + cycleOffset;
    if (index > 0 && unwrapped < previous) {
      if (previous - unwrapped < 0.5) {
        throw new Error(`nonmonotone cycle phase without wrap at sample ${index}`);
      }
      cycleOffset += 1;
      unwrapped = phase + cycleOffset;
    }
    if (unwrapped < previous) {
      throw new Error(`cycle phase unwrap decreased at sample ${index}`);
    }
    previous = unwrapped;
    return unwrapped;
  }));
}

function convergenceSeries(
  result: MainWireNormalAdultFiveWallPeriodicResultV1,
): LineSeries[] {
  const groups: LineSeries[] = CLOSURE_GROUP_ORDER.map((group) => Object.freeze({
    label: shortGroupLabel(group),
    color: GROUP_COLORS[group],
    paths: Object.freeze([Object.freeze(result.beatClosure.flatMap((beat) => {
      const value = beat.period1?.groups[group].maximumNormalizedDelta;
      return value === undefined ? [] : [{
        x: beat.beatIndex,
        y: safeLog10(value),
      }];
    }))]),
    width: 1.75,
  }));
  groups.push(Object.freeze({
    label: "period-2 overall",
    color: "#e5e7eb",
    paths: Object.freeze([Object.freeze(result.beatClosure.flatMap((beat) =>
      beat.period2 === null ? [] : [{
        x: beat.beatIndex,
        y: safeLog10(beat.period2.overall.maximumNormalizedDelta),
      }]))]),
    width: 1.4,
    dashed: true,
  }));
  return groups;
}

function phasicFlowBars(
  diagnostics: MainWireNormalAdultFiveWallCycleDiagnosticsV1,
): BarSeries[] {
  const pv = diagnostics.pulmonaryVenous;
  return [
    Object.freeze({
      label: "forward",
      color: "#22c55e",
      values: Object.freeze([
        pv.S.forwardVolumeMl,
        pv.D.forwardVolumeMl,
        pv.Ar.forwardVolumeMl,
        diagnostics.mitral.E.forwardVolumeMl,
        diagnostics.mitral.A.forwardVolumeMl,
      ]),
    }),
    Object.freeze({
      label: "reverse (negative)",
      color: "#fb7185",
      values: Object.freeze([
        -pv.S.reverseVolumeMl,
        -pv.D.reverseVolumeMl,
        -pv.Ar.reverseVolumeMl,
        0,
        0,
      ]),
    }),
  ];
}

function wallWorkBars(
  diagnostics: MainWireNormalAdultFiveWallCycleDiagnosticsV1,
): BarSeries[] {
  const component = (key: "total" | "active" | "passive" | "sls") =>
    MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CYCLE_WALL_IDS_V1.map((wall) =>
      diagnostics.workEnergy.perWall[wall].stressWorkOnWallMilliJ[key]);
  return [
    Object.freeze({ label: "total", color: "#e5e7eb", values: component("total") }),
    Object.freeze({ label: "active", color: "#ec4899", values: component("active") }),
    Object.freeze({ label: "passive", color: "#38bdf8", values: component("passive") }),
    Object.freeze({ label: "SLS", color: "#f59e0b", values: component("sls") }),
  ];
}

function slsEnergyBars(
  diagnostics: MainWireNormalAdultFiveWallCycleDiagnosticsV1,
): BarSeries[] {
  const values = (
    read: (wall: MainWireNormalAdultFiveWallCycleWallIdV1) => number,
  ) => MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CYCLE_WALL_IDS_V1.map(read);
  return [
    Object.freeze({
      label: "Δ stored",
      color: "#38bdf8",
      values: values((wall) => diagnostics.workEnergy.perWall[wall]
        .sls.storedEnergyChangeMilliJ),
    }),
    Object.freeze({
      label: "physical dissipation",
      color: "#22c55e",
      values: values((wall) => diagnostics.workEnergy.perWall[wall]
        .sls.physicalDissipationMilliJ),
    }),
    Object.freeze({
      label: "BE numerical",
      color: "#f59e0b",
      values: values((wall) => diagnostics.workEnergy.perWall[wall]
        .sls.backwardEulerNumericalDissipationMilliJ),
    }),
  ];
}

function renderLinePanel(
  rect: Readonly<{ x: number; y: number; width: number; height: number }>,
  title: string,
  xLabel: string,
  yLabel: string,
  series: readonly LineSeries[],
  horizontalRules: readonly number[] = [],
): string {
  const finitePaths = series.map((item) => Object.freeze({
    ...item,
    paths: Object.freeze(item.paths.map((path) => Object.freeze(path.filter(
      (point) => Number.isFinite(point.x) && Number.isFinite(point.y),
    ))).filter((path) => path.length > 0)),
  })).filter((item) => item.paths.length > 0);
  const points = finitePaths.flatMap((item) => item.paths.flatMap((path) => path));
  const xDomain = paddedDomain(points.map((point) => point.x));
  const yDomain = paddedDomain([
    ...points.map((point) => point.y),
    ...horizontalRules.filter(Number.isFinite),
  ]);
  const legendRows = Math.max(1, Math.ceil(finitePaths.length / 4));
  const plot = Object.freeze({
    x: rect.x + 70,
    y: rect.y + 41 + legendRows * 15,
    width: rect.width - 91,
    height: rect.height - 91 - legendRows * 15,
  });
  const sx = (value: number) => plot.x + (value - xDomain[0])
    / Math.max(xDomain[1] - xDomain[0], 1e-12) * plot.width;
  const sy = (value: number) => plot.y + plot.height - (value - yDomain[0])
    / Math.max(yDomain[1] - yDomain[0], 1e-12) * plot.height;
  const grid = gridMarkup(plot, xDomain, yDomain);
  const rules = horizontalRules.filter((value) =>
    value >= yDomain[0] && value <= yDomain[1]).map((value) =>
      `<line x1="${plot.x}" y1="${round(sy(value), 2)}" x2="${plot.x + plot.width}" y2="${round(sy(value), 2)}" stroke="#f8fafc" stroke-width="1" stroke-dasharray="3 5" opacity="0.72"/>`).join("");
  const lines = finitePaths.map((item) => item.paths.map((path) =>
    `<polyline points="${path.map((point) =>
      `${round(sx(point.x), 2)},${round(sy(point.y), 2)}`).join(" ")}" fill="none" stroke="${item.color}" stroke-width="${item.width ?? 2.1}" stroke-linecap="round" stroke-linejoin="round"${item.dashed ? ' stroke-dasharray="7 5"' : ""}/>`).join("\n")).join("\n");
  return `<g role="img" aria-label="${escapeXml(`${title}; ${xLabel}; ${yLabel}`)}">
    <title>${escapeXml(title)}</title>
    <text x="${rect.x}" y="${rect.y + 19}" fill="#e7eef9" font-size="16" font-weight="700">${escapeXml(title)}</text>
    ${legendMarkup(finitePaths, rect.x + 4, rect.y + 31, 4, 124)}
    <rect x="${plot.x}" y="${plot.y}" width="${plot.width}" height="${plot.height}" fill="#0b1728" stroke="#29405f"/>
    ${grid}${rules}${lines}
    <text x="${plot.x + plot.width / 2}" y="${rect.y + rect.height - 4}" fill="#93a7c0" font-size="11" text-anchor="middle">${escapeXml(xLabel)}</text>
    <text x="${rect.x + 12}" y="${plot.y + plot.height / 2}" fill="#93a7c0" font-size="11" text-anchor="middle" transform="rotate(-90 ${rect.x + 12} ${plot.y + plot.height / 2})">${escapeXml(yLabel)}</text>
  </g>`;
}

function renderBarPanel(
  rect: Readonly<{ x: number; y: number; width: number; height: number }>,
  title: string,
  xLabel: string,
  yLabel: string,
  categories: readonly string[],
  series: readonly BarSeries[],
  includeZero: boolean,
): string {
  const all = series.flatMap((item) => item.values).filter(Number.isFinite);
  const yDomain = paddedDomain(includeZero ? [...all, 0] : all);
  const legendRows = Math.max(1, Math.ceil(series.length / 3));
  const plot = Object.freeze({
    x: rect.x + 70,
    y: rect.y + 41 + legendRows * 15,
    width: rect.width - 91,
    height: rect.height - 91 - legendRows * 15,
  });
  const sy = (value: number) => plot.y + plot.height - (value - yDomain[0])
    / Math.max(yDomain[1] - yDomain[0], 1e-12) * plot.height;
  const slotWidth = plot.width / Math.max(categories.length, 1);
  const groupWidth = slotWidth * 0.78;
  const barWidth = groupWidth / Math.max(series.length, 1);
  const zeroY = sy(Math.min(yDomain[1], Math.max(yDomain[0], 0)));
  const bars = series.map((item, seriesIndex) => item.values.map((value, categoryIndex) => {
    if (!Number.isFinite(value)) return "";
    const x = plot.x + categoryIndex * slotWidth + (slotWidth - groupWidth) / 2
      + seriesIndex * barWidth;
    const y = Math.min(zeroY, sy(value));
    const height = Math.max(0.75, Math.abs(sy(value) - zeroY));
    return `<rect x="${round(x, 2)}" y="${round(y, 2)}" width="${round(Math.max(1, barWidth - 1.5), 2)}" height="${round(height, 2)}" fill="${item.color}" opacity="0.9"><title>${escapeXml(`${categories[categoryIndex]} ${item.label}: ${format(value, 4)}`)}</title></rect>`;
  }).join("\n")).join("\n");
  const labels = categories.map((category, index) =>
    `<text x="${round(plot.x + (index + 0.5) * slotWidth, 2)}" y="${plot.y + plot.height + 17}" fill="#8296af" font-size="10" text-anchor="middle">${escapeXml(category)}</text>`).join("");
  const yGrid = gridMarkup(plot, [0, categories.length], yDomain, false);
  const lineSeriesForLegend = series.map((item) => ({
    label: item.label,
    color: item.color,
    paths: [],
  }));
  return `<g role="img" aria-label="${escapeXml(`${title}; ${xLabel}; ${yLabel}`)}">
    <title>${escapeXml(title)}</title>
    <text x="${rect.x}" y="${rect.y + 19}" fill="#e7eef9" font-size="16" font-weight="700">${escapeXml(title)}</text>
    ${legendMarkup(lineSeriesForLegend, rect.x + 4, rect.y + 31, 3, 150)}
    <rect x="${plot.x}" y="${plot.y}" width="${plot.width}" height="${plot.height}" fill="#0b1728" stroke="#29405f"/>
    ${yGrid}<line x1="${plot.x}" y1="${round(zeroY, 2)}" x2="${plot.x + plot.width}" y2="${round(zeroY, 2)}" stroke="#8296af"/>${bars}${labels}
    <text x="${plot.x + plot.width / 2}" y="${rect.y + rect.height - 4}" fill="#93a7c0" font-size="11" text-anchor="middle">${escapeXml(xLabel)}</text>
    <text x="${rect.x + 12}" y="${plot.y + plot.height / 2}" fill="#93a7c0" font-size="11" text-anchor="middle" transform="rotate(-90 ${rect.x + 12} ${plot.y + plot.height / 2})">${escapeXml(yLabel)}</text>
  </g>`;
}

function gridMarkup(
  plot: Readonly<{ x: number; y: number; width: number; height: number }>,
  xDomain: readonly [number, number],
  yDomain: readonly [number, number],
  vertical = true,
): string {
  return [0, 0.25, 0.5, 0.75, 1].map((fraction) => {
    const x = plot.x + fraction * plot.width;
    const y = plot.y + fraction * plot.height;
    const xv = xDomain[0] + fraction * (xDomain[1] - xDomain[0]);
    const yv = yDomain[1] - fraction * (yDomain[1] - yDomain[0]);
    return `${vertical ? `<line x1="${x}" y1="${plot.y}" x2="${x}" y2="${plot.y + plot.height}" stroke="#1c2d45"/><text x="${x}" y="${plot.y + plot.height + 17}" fill="#8296af" font-size="10" text-anchor="middle">${escapeXml(tick(xv))}</text>` : ""}
      <line x1="${plot.x}" y1="${y}" x2="${plot.x + plot.width}" y2="${y}" stroke="#1c2d45"/>
      <text x="${plot.x - 8}" y="${y + 3}" fill="#8296af" font-size="10" text-anchor="end">${escapeXml(tick(yv))}</text>`;
  }).join("\n");
}

function legendMarkup(
  series: readonly Pick<LineSeries, "label" | "color" | "dashed">[],
  x: number,
  y: number,
  columns: number,
  cellWidth: number,
): string {
  return series.map((item, index) => {
    const cx = x + (index % columns) * cellWidth;
    const cy = y + Math.floor(index / columns) * 15;
    return `<line x1="${cx}" y1="${cy}" x2="${cx + 15}" y2="${cy}" stroke="${item.color}" stroke-width="2.5"${item.dashed ? ' stroke-dasharray="5 4"' : ""}/><text x="${cx + 20}" y="${cy + 4}" fill="#aebed1" font-size="10">${escapeXml(item.label)}</text>`;
  }).join("");
}

function convergenceTable(
  review: MainWireNormalAdultFiveWallPeriodicReviewV1,
): string {
  const rows = review.convergence.latestGroupReports.length > 0
    ? review.convergence.latestGroupReports.map((group) => `<tr>
      <th scope="row">${escapeHtml(shortGroupLabel(group.group))}</th>
      <td>${scientific(group.maximumNormalizedDelta)}</td>
      <td><code>${escapeHtml(group.worstPath)}</code></td>
    </tr>`).join("")
    : `<tr><td colspan="3">No period-1 closure report is available.</td></tr>`;
  return `<article><h2>Latest group-wise closure</h2><div class="scroll"><table>
    <thead><tr><th>group</th><th>max normalized Δ</th><th>worst state path</th></tr></thead>
    <tbody>${rows}</tbody>
  </table></div><p class="note">Fixed dimensional reference scales normalize unlike units; they are not physiological fit targets.</p></article>`;
}

function flowTable(
  diagnostics: MainWireNormalAdultFiveWallCycleDiagnosticsV1,
): string {
  const rows = (["S", "D", "Ar"] as const).map((window) => {
    const value = diagnostics.pulmonaryVenous[window];
    return `<tr><th scope="row">PV ${window}</th><td>${format(value.peakForwardMlPerSec, 2)}</td><td>${format(value.peakReverseMlPerSec, 2)}</td><td>${format(value.forwardVolumeMl, 3)}</td><td>${format(value.reverseVolumeMl, 3)}</td></tr>`;
  }).join("") + (["E", "A"] as const).map((window) => {
    const value = diagnostics.mitral[window];
    return `<tr><th scope="row">MV ${window}</th><td>${format(value.peakForwardMlPerSec, 2)}</td><td>—</td><td>${format(value.forwardVolumeMl, 3)}</td><td>—</td></tr>`;
  }).join("");
  return `<article><h2>Phasic flow ledger</h2><div class="scroll"><table>
    <thead><tr><th>window</th><th>peak + (mL/s)</th><th>peak − (mL/s)</th><th>forward (mL)</th><th>reverse (mL)</th></tr></thead>
    <tbody>${rows}</tbody>
  </table></div><p class="note">Half-open, exhaustive windows; backward-Euler endpoint integration.</p></article>`;
}

function workTable(
  diagnostics: MainWireNormalAdultFiveWallCycleDiagnosticsV1,
): string {
  const rows = MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CYCLE_WALL_IDS_V1.map((wall) => {
    const value = diagnostics.workEnergy.perWall[wall];
    return `<tr><th scope="row">${wall}</th><td>${format(value.stressWorkOnWallMilliJ.total, 4)}</td><td>${format(value.stressWorkOnWallMilliJ.active, 4)}</td><td>${format(value.stressWorkOnWallMilliJ.passive, 4)}</td><td>${format(value.stressWorkOnWallMilliJ.sls, 4)}</td><td>${scientific(value.sls.reconstructedDiscreteBalanceResidualMilliJ)}</td></tr>`;
  }).join("");
  return `<article><h2>Wall work and SLS balance</h2><div class="scroll"><table>
    <thead><tr><th>wall</th><th>total</th><th>active</th><th>passive</th><th>SLS</th><th>SLS residual</th></tr></thead>
    <tbody>${rows}</tbody>
  </table></div><p class="note">All work values are mJ; positive means work on wall. Stress-work coverage: ${format(100 * diagnostics.workEnergy.stressWorkCoverageFraction, 1)}%.</p></article>`;
}

function wallMaterialVolumesMl(): Readonly<Record<
  MainWireNormalAdultFiveWallCycleWallIdV1,
  number
>> {
  const prior = NORMAL_ADULT_FIVE_WALL_PRIOR_V1;
  return Object.freeze({
    LA: prior.anatomy.atria.LA.wallMaterialVolumeMl,
    LVFW: prior.anatomy.triSeg.wallGeometryParameters.LVFW
      .wallMaterialVolumeM3 * 1e6,
    SEP: prior.anatomy.triSeg.wallGeometryParameters.SEP
      .wallMaterialVolumeM3 * 1e6,
    RVFW: prior.anatomy.triSeg.wallGeometryParameters.RVFW
      .wallMaterialVolumeM3 * 1e6,
    RA: prior.anatomy.atria.RA.wallMaterialVolumeMl,
  });
}

function shortGroupLabel(group: MainWireFiveWallPeriodicClosureGroupV1): string {
  return ({
    "circulation-node-volume": "node volume",
    "dynamic-edge-flow": "edge flow",
    "valve-opening": "valve opening",
    "triseg-coordinate": "TriSeg coordinate",
    "land-state": "Land state",
    "sls-viscous-strain": "SLS strain",
    "wall-input-history": "wall input history",
  } as const)[group];
}

function paddedDomain(values: readonly number[]): readonly [number, number] {
  const finite = values.filter(Number.isFinite);
  if (finite.length === 0) return [0, 1];
  const minimum = Math.min(...finite);
  const maximum = Math.max(...finite);
  const span = maximum - minimum;
  const padding = span > 0 ? 0.065 * span : Math.max(0.5, 0.1 * Math.abs(maximum));
  return [minimum - padding, maximum + padding];
}

function card(label: string, value: string): string {
  return `<div class="card"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function htmlCss(): string {
  return `:root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #06101f; color: #e7eef9; font-family: Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
  main { max-width: 1720px; margin: 0 auto; padding: 28px 28px 52px; }
  .eyebrow { color: #7dd3fc; font-size: 12px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
  h1 { margin: 5px 0 8px; font-size: clamp(26px, 3vw, 36px); }
  h2 { margin: 0 0 12px; font-size: 17px; }
  .subtitle { max-width: 1050px; color: #9fb0c8; line-height: 1.55; margin: 0; }
  .status { display: flex; justify-content: space-between; gap: 20px; margin: 20px 0 14px; padding: 12px 14px; border-radius: 9px; border: 1px solid; }
  .status span { color: inherit; opacity: .82; }
  .status.ok { background: #09281e; border-color: #166534; color: #bbf7d0; }
  .status.warn { background: #2b210a; border-color: #854d0e; color: #fde68a; }
  .status.danger { background: #311317; border-color: #991b1b; color: #fecaca; }
  .cards { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 10px; margin: 0 0 16px; }
  .card { min-width: 0; background: #0d1a2d; border: 1px solid #203451; border-radius: 9px; padding: 11px 12px; }
  .card span { display: block; color: #8fa4bf; font-size: 11px; margin-bottom: 5px; }
  .card strong { display: block; font-size: 17px; overflow-wrap: anywhere; }
  .figure { background: #081426; border: 1px solid #203451; border-radius: 11px; overflow: hidden; }
  svg { width: 100%; height: auto; display: block; }
  .table-grid { display: grid; grid-template-columns: 1.15fr 1fr 1.2fr; gap: 14px; margin-top: 16px; }
  article, .boundary, details { background: #0d1a2d; border: 1px solid #203451; border-radius: 9px; padding: 14px; min-width: 0; }
  table { border-collapse: collapse; width: 100%; font-size: 12px; }
  th, td { border-bottom: 1px solid #203451; padding: 7px 8px; text-align: right; vertical-align: top; }
  th:first-child, td:first-child { text-align: left; }
  thead th { color: #8fa4bf; font-weight: 600; }
  tbody th { color: #dbeafe; }
  code { color: #bae6fd; font-size: 11px; overflow-wrap: anywhere; }
  .scroll { overflow-x: auto; }
  .note { margin: 10px 0 0; color: #8fa4bf; font-size: 11px; line-height: 1.45; }
  .boundary { margin-top: 16px; }
  .boundary ul { margin: 0; padding-left: 20px; color: #b8c6d9; line-height: 1.55; }
  details { margin-top: 14px; }
  summary { cursor: pointer; color: #dbeafe; font-weight: 600; }
  pre { white-space: pre-wrap; word-break: break-word; font-size: 11px; color: #aebed1; }
  @media (max-width: 1150px) { .cards { grid-template-columns: repeat(3, minmax(0, 1fr)); } .table-grid { grid-template-columns: 1fr; } }
  @media (max-width: 650px) { main { padding: 18px 12px 36px; } .cards { grid-template-columns: repeat(2, minmax(0, 1fr)); } .status { flex-direction: column; gap: 4px; } }`;
}

function safeScriptJson(value: unknown): string {
  return JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, (character) => ({
    "<": "\\u003c",
    ">": "\\u003e",
    "&": "\\u0026",
    "\u2028": "\\u2028",
    "\u2029": "\\u2029",
  })[character]!);
}

function embeddedReviewPayload(
  review: MainWireNormalAdultFiveWallPeriodicReviewV1,
): unknown {
  const project = (sample: MainWireNormalAdultFiveWallDiagnosticSampleV2) =>
    Object.freeze({
      timeSec: sample.timeSec,
      cyclePhase01: sample.cyclePhase01,
      nodeVolumeMl: sample.nodeVolumeMl,
      nodeAbsolutePressureMmHg: sample.nodeAbsolutePressureMmHg,
      chamberTransmuralPressureMmHg: sample.chamberTransmuralPressureMmHg,
      commonPericardium: sample.commonPericardium,
      flowMlPerSec: sample.flowMlPerSec,
      valveOpeningFraction01: sample.valveOpeningFraction01,
      diagnostics: sample.diagnostics,
    });
  return Object.freeze({
    reviewId: review.reviewId,
    generatedFromExperimentId: review.generatedFromExperimentId,
    run: review.run,
    currentBeatSamples: Object.freeze(review.currentBeatSamples.map(project)),
    previousBeatSamples: Object.freeze(review.previousBeatSamples.map(project)),
    cycleDiagnostics: review.cycleDiagnostics,
    convergence: review.convergence,
    claim: review.claim,
  });
}

function safeRatio(numerator: number, denominator: number): number | null {
  return Number.isFinite(numerator) && Number.isFinite(denominator)
    && Math.abs(denominator) > 1e-12 ? numerator / denominator : null;
}

function maximum(values: readonly number[]): number {
  const finite = values.filter(Number.isFinite);
  return finite.length > 0 ? Math.max(...finite) : Number.NaN;
}

function safeLog10(value: number): number {
  return Math.log10(Math.max(Math.abs(value), 1e-16));
}

function positiveModulo(value: number, modulus: number): number {
  const result = value % modulus;
  return result < 0 ? result + modulus : result;
}

function nullableRatio(value: number | null): string {
  return value === null || !Number.isFinite(value) ? "n/a" : format(value, 3);
}

function scientific(value: number | null): string {
  return value === null || !Number.isFinite(value) ? "n/a" : value.toExponential(3);
}

function tick(value: number): string {
  const magnitude = Math.abs(value);
  if (magnitude !== 0 && (magnitude >= 1000 || magnitude < 0.01)) {
    return value.toExponential(1);
  }
  return round(value, magnitude < 1 ? 2 : 1).toString();
}

function format(value: number, digits: number): string {
  return Number.isFinite(value) ? value.toFixed(digits) : "n/a";
}

function round(value: number, digits = 3): number {
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}

function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&apos;",
  })[character]!);
}

function escapeHtml(value: string): string {
  return escapeXml(value);
}
