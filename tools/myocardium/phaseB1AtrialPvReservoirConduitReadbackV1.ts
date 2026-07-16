import {
  assertCanonicalSha256,
  computeCanonicalSha256,
  type CanonicalSha256HexProvider,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  assertDensePlainArrayV1,
  assertExactPlainRecordV1,
} from "@/engine/myocardium/fourChamberV1/validation/strictClosedRecordV1";

export const PHASE_B1_ATRIAL_PV_RESERVOIR_CONDUIT_READBACK_V1_ID =
  "phase-b1-atrial-pv-reservoir-conduit-held-out-readback-v1" as const;

export const PHASE_B1_ATRIAL_PV_READBACK_ATRIUM_ORDER_V1 = Object.freeze([
  "LA",
  "RA",
] as const);

export type PhaseB1AtrialPvReadbackAtriumV1 =
  (typeof PHASE_B1_ATRIAL_PV_READBACK_ATRIUM_ORDER_V1)[number];

export type PhaseB1AtrialPvReadbackValveFlowV1 = "Q_MV" | "Q_TV";

export type PhaseB1AtrialPvReadbackSampleV1 = Readonly<{
  phaseSec: number;
  bloodVolumesM3: Readonly<Record<PhaseB1AtrialPvReadbackAtriumV1, number>>;
  pressuresPa: Readonly<Record<PhaseB1AtrialPvReadbackAtriumV1, number>>;
  allFlowsM3PerSec: Readonly<Record<PhaseB1AtrialPvReadbackValveFlowV1, number>>;
}>;

export type PhaseB1AtrialPvReadbackTraceV1 = Readonly<{
  cycleLengthSec: number;
  samples: readonly PhaseB1AtrialPvReadbackSampleV1[];
}>;

export type PhaseB1AtrialPvReadbackPointV1 = Readonly<{
  phaseSec: number;
  volumeM3: number;
  pressurePa: number;
}>;

export type PhaseB1AtrialPvReadbackReasonV1 =
  | "functional-av-flow-insufficient-samples"
  | "functional-av-flow-has-no-positive-lobe"
  | "functional-av-flow-is-unbracketed-all-positive"
  | "functional-av-main-positive-lobe-integral-is-not-unique"
  | "functional-av-main-positive-lobe-boundary-is-unbracketed"
  | "functional-av-main-positive-lobe-duration-is-degenerate"
  | "post-closure-local-volume-minimum-unresolved"
  | "pre-opening-volume-maximum-unresolved"
  | "reservoir-branch-has-insufficient-samples"
  | "reservoir-branch-is-not-strictly-increasing"
  | "first-post-opening-volume-minimum-unresolved"
  | "conduit-branch-has-insufficient-samples"
  | "conduit-branch-is-not-strictly-decreasing"
  | "reservoir-conduit-common-volume-overlap-is-empty";

export type PhaseB1AtrialPvValveBoundaryV1 = Readonly<{
  phaseSec: number;
  endpoint: PhaseB1AtrialPvReadbackPointV1;
  bracketSampleIndices: readonly [number, number];
}>;

export type PhaseB1AtrialPvFunctionalValveLobeV1 = Readonly<{
  status: "resolved" | "unresolved";
  positiveLobeCount: number;
  selectedIntegratedPositiveVolumeM3: number | null;
  nextLargestIntegratedPositiveVolumeM3: number | null;
  opening: PhaseB1AtrialPvValveBoundaryV1 | null;
  closure: PhaseB1AtrialPvValveBoundaryV1 | null;
  wrapsCycleBoundary: boolean | null;
  crossingInterpolation: "linear-chord";
}>;

export type PhaseB1AtrialPvMonotoneBranchV1 = Readonly<{
  role: "reservoir" | "early-conduit";
  expectedVolumeDirection: "increasing" | "decreasing";
  status: "resolved" | "ambiguous" | "unresolved";
  points: readonly PhaseB1AtrialPvReadbackPointV1[];
  sampleCount: number;
  strictlyMonotone: boolean;
  minimumVolumeM3: number | null;
  maximumVolumeM3: number | null;
  startPhaseSec: number | null;
  endPhaseSec: number | null;
}>;

export type PhaseB1AtrialPvMatchedVolumeGridPointV1 = Readonly<{
  normalizedCommonVolume01: number;
  volumeM3: number;
  reservoirPressurePa: number;
  conduitPressurePa: number;
  reservoirMinusConduitPressurePa: number;
}>;

export type PhaseB1AtrialPvMatchedVolumeReadbackV1 = Readonly<{
  commonVolumeMinimumM3: number;
  commonVolumeMaximumM3: number;
  overlapWidthM3: number;
  gridPointCount: 101;
  meanReservoirMinusConduitPressurePa: number;
  minimumReservoirMinusConduitPressurePa: number;
  maximumReservoirMinusConduitPressurePa: number;
  positiveGridPointFraction: number;
  trapezoidalIntegralReservoirMinusConduitPressurePaM3: number;
  grid: readonly PhaseB1AtrialPvMatchedVolumeGridPointV1[];
}>;

export type PhaseB1AtrialPvLoopReadbackV1 = Readonly<{
  signedShoelaceAreaPaM3: number;
  absoluteShoelaceAreaPaM3: number;
  volumeRangeM3: Readonly<{ minimum: number; maximum: number; width: number }>;
  pressureRangePa: Readonly<{ minimum: number; maximum: number; width: number }>;
  closingChordApplied: true;
}>;

export type PhaseB1AtrialPvReservoirConduitReadbackByAtriumV1 = Readonly<{
  atrium: PhaseB1AtrialPvReadbackAtriumV1;
  valveFlow: PhaseB1AtrialPvReadbackValveFlowV1;
  status: "resolved" | "ambiguous" | "no-overlap" | "unresolved";
  reasons: readonly PhaseB1AtrialPvReadbackReasonV1[];
  functionalValveLobe: PhaseB1AtrialPvFunctionalValveLobeV1;
  exactInterpolatedValveBoundaryEndpointsPreserved: boolean;
  reservoirBranch: PhaseB1AtrialPvMonotoneBranchV1;
  conduitBranch: PhaseB1AtrialPvMonotoneBranchV1;
  matchedVolume: PhaseB1AtrialPvMatchedVolumeReadbackV1 | null;
  wholeCyclePv: PhaseB1AtrialPvLoopReadbackV1;
}>;

const ANALYSIS_POLICY = deepFreeze({
  functionalValveLobeDefinition:
    "unique-largest-positive-integrated-volume-interval-on-cyclic-signed-flow" as const,
  valveZeroCrossingInterpolation: "linear-chord" as const,
  reservoirBranchDefinition:
    "first-post-closure-local-volume-minimum-through-pre-opening-global-volume-maximum" as const,
  conduitBranchDefinition:
    "exact-av-opening-boundary-through-first-post-opening-local-volume-minimum" as const,
  branchInterpolation: "piecewise-linear-on-strict-monotone-volume" as const,
  commonVolumeGrid: "fixed-101-point-uniform-grid-including-overlap-endpoints" as const,
  pressureDifferenceConvention: "reservoir-minus-conduit" as const,
  pressureMeanDefinition: "trapezoidal-volume-integral-divided-by-overlap-width" as const,
  pvAreaDefinition: "signed-shoelace-with-explicit-closing-chord" as const,
  numericalVolumeComparisonToleranceM3: 1e-15 as const,
  uniqueLobeRelativeIntegralTolerance: 1e-12 as const,
  uniqueLobeAbsoluteIntegralToleranceM3: 1e-18 as const,
  readbackUsedForCandidateSelection: false as const,
  readbackUsedAsFittingObjective: false as const,
});

const CLAIM_BOUNDARY = deepFreeze({
  diagnosticOnly: true as const,
  heldOutReadback: true as const,
  candidateSelectionPerformed: false as const,
  parameterFittingPerformed: false as const,
  physiologicalValidationEstablished: false as const,
  formalPeriodOneRequiredForGateEligibility: true as const,
  nonperiodicExploratoryReadbackAllowed: true as const,
  callerPeriodOneAssertionAuthenticatedByThisModule: false as const,
  valveLobeAndBranchResolutionAreDataDriven: true as const,
  unresolvedOrAmbiguousBranchesAreNotForced: true as const,
  pressureDifferenceSignUsedAsPassFailGate: false as const,
  pvAreaUsedAsPassFailGate: false as const,
  modelCoreOrBrowserRuntimeAdopted: false as const,
});

export type PhaseB1AtrialPvReservoirConduitReadbackPayloadV1 = Readonly<{
  readbackId: typeof PHASE_B1_ATRIAL_PV_RESERVOIR_CONDUIT_READBACK_V1_ID;
  status: "held-out-atrial-pv-reservoir-conduit-diagnostic";
  sourceTraceContentSha256: string;
  atriumOrder: typeof PHASE_B1_ATRIAL_PV_READBACK_ATRIUM_ORDER_V1;
  units: Readonly<{
    phase: "s";
    volume: "m3";
    pressure: "Pa";
    flow: "m3/s";
    pvArea: "Pa*m3";
  }>;
  periodicity: Readonly<{
    formalPeriodOneConvergencePass: boolean;
    gateEligible: boolean;
    classification:
      | "formal-period-one-held-out-readback"
      | "nonperiodic-exploratory-readback";
    diagnosticComputedRegardlessOfGateEligibility: true;
  }>;
  analysisPolicy: typeof ANALYSIS_POLICY;
  byAtrium: Readonly<Record<
    PhaseB1AtrialPvReadbackAtriumV1,
    PhaseB1AtrialPvReservoirConduitReadbackByAtriumV1
  >>;
  claimBoundary: typeof CLAIM_BOUNDARY;
  hashAlgorithm: "sha256-canonical-json-v1";
}>;

export type PhaseB1AtrialPvReservoirConduitReadbackV1 =
  PhaseB1AtrialPvReservoirConduitReadbackPayloadV1 & Readonly<{
    contentSha256: string;
  }>;

type ValidatedSample = Readonly<{
  sourceIndex: number;
  phaseSec: number;
  bloodVolumesM3: Readonly<Record<PhaseB1AtrialPvReadbackAtriumV1, number>>;
  pressuresPa: Readonly<Record<PhaseB1AtrialPvReadbackAtriumV1, number>>;
  allFlowsM3PerSec: Readonly<Record<PhaseB1AtrialPvReadbackValveFlowV1, number>>;
}>;

type PositivePiece = Readonly<{
  startPhaseSec: number;
  endPhaseSec: number;
  integratedPositiveVolumeM3: number;
  startBracketSampleIndices: readonly [number, number];
  endBracketSampleIndices: readonly [number, number];
  startIsZeroCrossing: boolean;
  endIsZeroCrossing: boolean;
}>;

type PositiveLobe = Readonly<{
  startPhaseSec: number;
  endPhaseSec: number;
  integratedPositiveVolumeM3: number;
  openingBracketSampleIndices: readonly [number, number];
  closureBracketSampleIndices: readonly [number, number];
  openingBracketed: boolean;
  closureBracketed: boolean;
  wrapsCycleBoundary: boolean;
}>;

const GRID_POINT_COUNT = 101 as const;
const VOLUME_TOLERANCE_M3 = ANALYSIS_POLICY.numericalVolumeComparisonToleranceM3;

export function buildPhaseB1AtrialPvReservoirConduitReadbackV1(
  input: Readonly<{
    trace: PhaseB1AtrialPvReadbackTraceV1;
    formalPeriodOneConvergencePass: boolean;
    sha256Hex: CanonicalSha256HexProvider;
  }>,
): PhaseB1AtrialPvReservoirConduitReadbackV1 {
  assertExactPlainRecordV1(input, [
    "trace",
    "formalPeriodOneConvergencePass",
    "sha256Hex",
  ], "atrial PV readback input");
  if (typeof input.formalPeriodOneConvergencePass !== "boolean") {
    throw new Error("formalPeriodOneConvergencePass must be boolean");
  }
  if (typeof input.sha256Hex !== "function") {
    throw new Error("atrial PV readback requires a SHA-256 provider");
  }
  const trace = validateAndCopyTrace(input.trace);
  const byAtrium = mapAtrium((atrium) => analyzeAtrium(trace, atrium));
  const payload = deepFreeze<PhaseB1AtrialPvReservoirConduitReadbackPayloadV1>({
    readbackId: PHASE_B1_ATRIAL_PV_RESERVOIR_CONDUIT_READBACK_V1_ID,
    status: "held-out-atrial-pv-reservoir-conduit-diagnostic",
    sourceTraceContentSha256: computeCanonicalSha256(trace, input.sha256Hex),
    atriumOrder: PHASE_B1_ATRIAL_PV_READBACK_ATRIUM_ORDER_V1,
    units: {
      phase: "s",
      volume: "m3",
      pressure: "Pa",
      flow: "m3/s",
      pvArea: "Pa*m3",
    },
    periodicity: {
      formalPeriodOneConvergencePass: input.formalPeriodOneConvergencePass,
      gateEligible: input.formalPeriodOneConvergencePass,
      classification: input.formalPeriodOneConvergencePass
        ? "formal-period-one-held-out-readback"
        : "nonperiodic-exploratory-readback",
      diagnosticComputedRegardlessOfGateEligibility: true,
    },
    analysisPolicy: ANALYSIS_POLICY,
    byAtrium,
    claimBoundary: CLAIM_BOUNDARY,
    hashAlgorithm: "sha256-canonical-json-v1",
  });
  return deepFreeze({
    ...payload,
    contentSha256: computeCanonicalSha256(payload, input.sha256Hex),
  });
}

export function phaseB1AtrialPvReservoirConduitReadbackHashPayloadV1(
  readback: PhaseB1AtrialPvReservoirConduitReadbackV1,
): PhaseB1AtrialPvReservoirConduitReadbackPayloadV1 {
  const { contentSha256: _contentSha256, ...payload } = readback;
  return payload;
}

export function validatePhaseB1AtrialPvReservoirConduitReadbackV1(
  readback: PhaseB1AtrialPvReservoirConduitReadbackV1,
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB1AtrialPvReservoirConduitReadbackV1 {
  if (
    readback === null
    || typeof readback !== "object"
    || readback.readbackId
      !== PHASE_B1_ATRIAL_PV_RESERVOIR_CONDUIT_READBACK_V1_ID
    || readback.analysisPolicy.commonVolumeGrid
      !== "fixed-101-point-uniform-grid-including-overlap-endpoints"
    || readback.analysisPolicy.readbackUsedForCandidateSelection !== false
    || readback.claimBoundary.diagnosticOnly !== true
    || readback.claimBoundary.heldOutReadback !== true
    || readback.claimBoundary.candidateSelectionPerformed !== false
    || readback.claimBoundary.physiologicalValidationEstablished !== false
    || readback.claimBoundary.formalPeriodOneRequiredForGateEligibility !== true
    || readback.claimBoundary.unresolvedOrAmbiguousBranchesAreNotForced !== true
    || readback.periodicity.gateEligible
      !== readback.periodicity.formalPeriodOneConvergencePass
  ) {
    throw new Error("atrial PV reservoir/conduit readback identity or policy drifted");
  }
  assertCanonicalSha256(
    phaseB1AtrialPvReservoirConduitReadbackHashPayloadV1(readback),
    readback.contentSha256,
    sha256Hex,
  );
  return readback;
}

function analyzeAtrium(
  trace: Readonly<{ cycleLengthSec: number; samples: readonly ValidatedSample[] }>,
  atrium: PhaseB1AtrialPvReadbackAtriumV1,
): PhaseB1AtrialPvReservoirConduitReadbackByAtriumV1 {
  const valveFlow: PhaseB1AtrialPvReadbackValveFlowV1 =
    atrium === "LA" ? "Q_MV" : "Q_TV";
  const wholeCyclePv = wholeCyclePvReadback(trace.samples, atrium);
  const lobeResolution = resolveMainPositiveFlowLobe(trace, valveFlow);
  if (lobeResolution.lobe === null) {
    return deepFreeze({
      atrium,
      valveFlow,
      status: "unresolved" as const,
      reasons: lobeResolution.reasons,
      functionalValveLobe: lobeResolution.audit,
      exactInterpolatedValveBoundaryEndpointsPreserved: false,
      reservoirBranch: emptyBranch("reservoir", "unresolved"),
      conduitBranch: emptyBranch("early-conduit", "unresolved"),
      matchedVolume: null,
      wholeCyclePv,
    });
  }
  const opening = boundaryFromLobe(
    trace.samples,
    atrium,
    normalizePhase(lobeResolution.lobe.startPhaseSec, trace.cycleLengthSec),
    lobeResolution.lobe.startPhaseSec,
    lobeResolution.lobe.openingBracketSampleIndices,
  );
  const closure = boundaryFromLobe(
    trace.samples,
    atrium,
    normalizePhase(lobeResolution.lobe.endPhaseSec, trace.cycleLengthSec),
    lobeResolution.lobe.endPhaseSec,
    lobeResolution.lobe.closureBracketSampleIndices,
  );
  const functionalValveLobe = deepFreeze({
    ...lobeResolution.audit,
    opening,
    closure,
  });
  const closedWindow = selectCircularWindow(
    trace.samples,
    atrium,
    closure.phaseSec,
    unwrapAfter(closure.phaseSec, opening.phaseSec, trace.cycleLengthSec),
    trace.cycleLengthSec,
  );
  const openWindow = selectCircularWindow(
    trace.samples,
    atrium,
    opening.phaseSec,
    unwrapAfter(opening.phaseSec, closure.phaseSec, trace.cycleLengthSec),
    trace.cycleLengthSec,
  );
  const reasons = [...lobeResolution.reasons];
  const reservoirBranch = reservoirBranchFromClosedWindow(closedWindow, reasons);
  const conduitBranch = conduitBranchFromOpenWindow(openWindow, reasons);
  const branchRangesHavePositiveOverlap = branchRangeOverlapIsPositive(
    reservoirBranch,
    conduitBranch,
  );
  if (branchRangesHavePositiveOverlap === false) {
    reasons.push("reservoir-conduit-common-volume-overlap-is-empty");
  }
  let status: PhaseB1AtrialPvReservoirConduitReadbackByAtriumV1["status"] =
    reservoirBranch.status === "resolved" && conduitBranch.status === "resolved"
      ? "resolved"
      : "ambiguous";
  let matchedVolume: PhaseB1AtrialPvMatchedVolumeReadbackV1 | null = null;
  if (status === "resolved") {
    matchedVolume = matchedVolumeReadback(reservoirBranch, conduitBranch);
    if (matchedVolume === null) {
      status = "no-overlap";
      if (branchRangesHavePositiveOverlap !== false) {
        reasons.push("reservoir-conduit-common-volume-overlap-is-empty");
      }
    }
  }
  return deepFreeze({
    atrium,
    valveFlow,
    status,
    reasons: uniqueReasons(reasons),
    functionalValveLobe,
    exactInterpolatedValveBoundaryEndpointsPreserved: true,
    reservoirBranch,
    conduitBranch,
    matchedVolume,
    wholeCyclePv,
  });
}

function branchRangeOverlapIsPositive(
  reservoir: PhaseB1AtrialPvMonotoneBranchV1,
  conduit: PhaseB1AtrialPvMonotoneBranchV1,
): boolean | null {
  if (
    reservoir.minimumVolumeM3 === null
    || reservoir.maximumVolumeM3 === null
    || conduit.minimumVolumeM3 === null
    || conduit.maximumVolumeM3 === null
  ) return null;
  const minimum = Math.max(
    reservoir.minimumVolumeM3,
    conduit.minimumVolumeM3,
  );
  const maximum = Math.min(
    reservoir.maximumVolumeM3,
    conduit.maximumVolumeM3,
  );
  return maximum > minimum;
}

function resolveMainPositiveFlowLobe(
  trace: Readonly<{ cycleLengthSec: number; samples: readonly ValidatedSample[] }>,
  valveFlow: PhaseB1AtrialPvReadbackValveFlowV1,
): Readonly<{
  lobe: PositiveLobe | null;
  reasons: readonly PhaseB1AtrialPvReadbackReasonV1[];
  audit: PhaseB1AtrialPvFunctionalValveLobeV1;
}> {
  const negative = (
    reason: PhaseB1AtrialPvReadbackReasonV1,
    positiveLobeCount: number,
    selected: number | null = null,
    next: number | null = null,
  ) => deepFreeze({
    lobe: null,
    reasons: [reason],
    audit: {
      status: "unresolved" as const,
      positiveLobeCount,
      selectedIntegratedPositiveVolumeM3: selected,
      nextLargestIntegratedPositiveVolumeM3: next,
      opening: null,
      closure: null,
      wrapsCycleBoundary: null,
      crossingInterpolation: "linear-chord" as const,
    },
  });
  if (trace.samples.length < 3) {
    return negative("functional-av-flow-insufficient-samples", 0);
  }
  const pieces: PositivePiece[] = [];
  for (let index = 0; index < trace.samples.length - 1; index += 1) {
    const first = trace.samples[index];
    const second = trace.samples[index + 1];
    const piece = positivePiece(
      first.phaseSec,
      first.allFlowsM3PerSec[valveFlow],
      second.phaseSec,
      second.allFlowsM3PerSec[valveFlow],
      first.sourceIndex,
      second.sourceIndex,
    );
    if (piece !== null) pieces.push(piece);
  }
  if (pieces.length === 0) {
    return negative("functional-av-flow-has-no-positive-lobe", 0);
  }
  const linearLobes = groupAdjacentPositivePieces(pieces);
  const lobes = mergeCycleWrappingLobes(linearLobes, trace.cycleLengthSec);
  if (
    lobes.length === 1
    && !lobes[0].openingBracketed
    && !lobes[0].closureBracketed
  ) {
    return negative(
      "functional-av-flow-is-unbracketed-all-positive",
      1,
      lobes[0].integratedPositiveVolumeM3,
    );
  }
  const ranked = [...lobes].sort((left, right) =>
    right.integratedPositiveVolumeM3 - left.integratedPositiveVolumeM3);
  const selected = ranked[0];
  const next = ranked[1] ?? null;
  const uniquenessTolerance = Math.max(
    ANALYSIS_POLICY.uniqueLobeAbsoluteIntegralToleranceM3,
    ANALYSIS_POLICY.uniqueLobeRelativeIntegralTolerance
      * selected.integratedPositiveVolumeM3,
  );
  if (
    next !== null
    && selected.integratedPositiveVolumeM3
      - next.integratedPositiveVolumeM3 <= uniquenessTolerance
  ) {
    return negative(
      "functional-av-main-positive-lobe-integral-is-not-unique",
      lobes.length,
      selected.integratedPositiveVolumeM3,
      next.integratedPositiveVolumeM3,
    );
  }
  if (!selected.openingBracketed || !selected.closureBracketed) {
    return negative(
      "functional-av-main-positive-lobe-boundary-is-unbracketed",
      lobes.length,
      selected.integratedPositiveVolumeM3,
      next?.integratedPositiveVolumeM3 ?? null,
    );
  }
  const duration = unwrapAfter(
    selected.startPhaseSec,
    normalizePhase(selected.endPhaseSec, trace.cycleLengthSec),
    trace.cycleLengthSec,
  ) - selected.startPhaseSec;
  if (!(duration > 0) || duration >= trace.cycleLengthSec - 1e-14) {
    return negative(
      "functional-av-main-positive-lobe-duration-is-degenerate",
      lobes.length,
      selected.integratedPositiveVolumeM3,
      next?.integratedPositiveVolumeM3 ?? null,
    );
  }
  return deepFreeze({
    lobe: selected,
    reasons: [],
    audit: {
      status: "resolved" as const,
      positiveLobeCount: lobes.length,
      selectedIntegratedPositiveVolumeM3:
        selected.integratedPositiveVolumeM3,
      nextLargestIntegratedPositiveVolumeM3:
        next?.integratedPositiveVolumeM3 ?? null,
      opening: null,
      closure: null,
      wrapsCycleBoundary: selected.wrapsCycleBoundary,
      crossingInterpolation: "linear-chord" as const,
    },
  });
}

function positivePiece(
  firstPhaseSec: number,
  firstFlow: number,
  secondPhaseSec: number,
  secondFlow: number,
  firstIndex: number,
  secondIndex: number,
): PositivePiece | null {
  if (firstFlow <= 0 && secondFlow <= 0) return null;
  const dt = secondPhaseSec - firstPhaseSec;
  let startPhaseSec = firstPhaseSec;
  let endPhaseSec = secondPhaseSec;
  let startIsZeroCrossing = firstFlow <= 0;
  let endIsZeroCrossing = secondFlow <= 0;
  if (firstFlow <= 0) {
    const fraction = -firstFlow / (secondFlow - firstFlow);
    startPhaseSec = linear(firstPhaseSec, secondPhaseSec, fraction);
  }
  if (secondFlow <= 0) {
    const fraction = firstFlow / (firstFlow - secondFlow);
    endPhaseSec = linear(firstPhaseSec, secondPhaseSec, fraction);
  }
  const startFlow = startPhaseSec === firstPhaseSec ? firstFlow : 0;
  const endFlow = endPhaseSec === secondPhaseSec ? secondFlow : 0;
  const integratedPositiveVolumeM3 =
    0.5 * (startFlow + endFlow) * (endPhaseSec - startPhaseSec);
  if (!(integratedPositiveVolumeM3 > 0) || !(dt > 0)) return null;
  return deepFreeze({
    startPhaseSec,
    endPhaseSec,
    integratedPositiveVolumeM3,
    startBracketSampleIndices: [firstIndex, secondIndex] as const,
    endBracketSampleIndices: [firstIndex, secondIndex] as const,
    startIsZeroCrossing,
    endIsZeroCrossing,
  });
}

function groupAdjacentPositivePieces(
  pieces: readonly PositivePiece[],
): readonly PositiveLobe[] {
  const groups: PositivePiece[][] = [];
  for (const piece of pieces) {
    const current = groups.at(-1);
    if (
      current !== undefined
      && Math.abs(current.at(-1)!.endPhaseSec - piece.startPhaseSec) <= 1e-14
    ) {
      current.push(piece);
    } else {
      groups.push([piece]);
    }
  }
  return groups.map((group) => lobeFromPieces(group, false));
}

function mergeCycleWrappingLobes(
  linearLobes: readonly PositiveLobe[],
  cycleLengthSec: number,
): readonly PositiveLobe[] {
  if (linearLobes.length < 2) return linearLobes;
  const first = linearLobes[0];
  const last = linearLobes.at(-1)!;
  if (
    Math.abs(first.startPhaseSec) > 1e-14
    || Math.abs(last.endPhaseSec - cycleLengthSec) > 1e-14
  ) return linearLobes;
  const merged = deepFreeze<PositiveLobe>({
    startPhaseSec: last.startPhaseSec,
    endPhaseSec: first.endPhaseSec,
    integratedPositiveVolumeM3:
      last.integratedPositiveVolumeM3 + first.integratedPositiveVolumeM3,
    openingBracketSampleIndices: last.openingBracketSampleIndices,
    closureBracketSampleIndices: first.closureBracketSampleIndices,
    openingBracketed: last.openingBracketed,
    closureBracketed: first.closureBracketed,
    wrapsCycleBoundary: true,
  });
  return [merged, ...linearLobes.slice(1, -1)];
}

function lobeFromPieces(
  pieces: readonly PositivePiece[],
  wrapsCycleBoundary: boolean,
): PositiveLobe {
  const first = pieces[0];
  const last = pieces.at(-1)!;
  return deepFreeze({
    startPhaseSec: first.startPhaseSec,
    endPhaseSec: last.endPhaseSec,
    integratedPositiveVolumeM3: pieces.reduce(
      (sum, piece) => sum + piece.integratedPositiveVolumeM3,
      0,
    ),
    openingBracketSampleIndices: first.startBracketSampleIndices,
    closureBracketSampleIndices: last.endBracketSampleIndices,
    openingBracketed: first.startIsZeroCrossing,
    closureBracketed: last.endIsZeroCrossing,
    wrapsCycleBoundary,
  });
}

function boundaryFromLobe(
  samples: readonly ValidatedSample[],
  atrium: PhaseB1AtrialPvReadbackAtriumV1,
  phaseSec: number,
  interpolationPhaseSec: number,
  bracketSampleIndices: readonly [number, number],
): PhaseB1AtrialPvValveBoundaryV1 {
  const first = samples[bracketSampleIndices[0]];
  const second = samples[bracketSampleIndices[1]];
  if (
    first === undefined
    || second === undefined
    || !(second.phaseSec > first.phaseSec)
    || interpolationPhaseSec < first.phaseSec
    || interpolationPhaseSec > second.phaseSec
  ) throw new Error("atrial PV valve boundary interpolation bracket is invalid");
  const fraction = (interpolationPhaseSec - first.phaseSec)
    / (second.phaseSec - first.phaseSec);
  return deepFreeze({
    phaseSec,
    endpoint: {
      phaseSec,
      volumeM3: linear(
        first.bloodVolumesM3[atrium],
        second.bloodVolumesM3[atrium],
        fraction,
      ),
      pressurePa: linear(
        first.pressuresPa[atrium],
        second.pressuresPa[atrium],
        fraction,
      ),
    },
    bracketSampleIndices,
  });
}

function reservoirBranchFromClosedWindow(
  window: readonly PhaseB1AtrialPvReadbackPointV1[],
  reasons: PhaseB1AtrialPvReadbackReasonV1[],
): PhaseB1AtrialPvMonotoneBranchV1 {
  const minimumIndex = firstLocalMinimumIndex(window);
  if (minimumIndex === null) {
    reasons.push("post-closure-local-volume-minimum-unresolved");
    return emptyBranch("reservoir", "unresolved");
  }
  const maximumIndex = uniqueMaximumIndex(window, minimumIndex);
  if (maximumIndex === null || maximumIndex <= minimumIndex) {
    reasons.push("pre-opening-volume-maximum-unresolved");
    return emptyBranch("reservoir", "unresolved");
  }
  const points = deepFreeze(window.slice(minimumIndex, maximumIndex + 1));
  if (points.length < 2) {
    reasons.push("reservoir-branch-has-insufficient-samples");
    return branch("reservoir", points, "unresolved", false);
  }
  const strictlyMonotone = isStrictlyMonotone(points, "increasing");
  if (!strictlyMonotone) {
    reasons.push("reservoir-branch-is-not-strictly-increasing");
  }
  return branch(
    "reservoir",
    points,
    strictlyMonotone ? "resolved" : "ambiguous",
    strictlyMonotone,
  );
}

function conduitBranchFromOpenWindow(
  window: readonly PhaseB1AtrialPvReadbackPointV1[],
  reasons: PhaseB1AtrialPvReadbackReasonV1[],
): PhaseB1AtrialPvMonotoneBranchV1 {
  const minimumIndex = firstLocalMinimumIndex(window, 1);
  if (minimumIndex === null) {
    reasons.push("first-post-opening-volume-minimum-unresolved");
    return emptyBranch("early-conduit", "unresolved");
  }
  const points = deepFreeze(window.slice(0, minimumIndex + 1));
  if (points.length < 2) {
    reasons.push("conduit-branch-has-insufficient-samples");
    return branch("early-conduit", points, "unresolved", false);
  }
  const strictlyMonotone = isStrictlyMonotone(points, "decreasing");
  if (!strictlyMonotone) {
    reasons.push("conduit-branch-is-not-strictly-decreasing");
  }
  return branch(
    "early-conduit",
    points,
    strictlyMonotone ? "resolved" : "ambiguous",
    strictlyMonotone,
  );
}

function matchedVolumeReadback(
  reservoir: PhaseB1AtrialPvMonotoneBranchV1,
  conduit: PhaseB1AtrialPvMonotoneBranchV1,
): PhaseB1AtrialPvMatchedVolumeReadbackV1 | null {
  const minimum = Math.max(
    reservoir.minimumVolumeM3!,
    conduit.minimumVolumeM3!,
  );
  const maximum = Math.min(
    reservoir.maximumVolumeM3!,
    conduit.maximumVolumeM3!,
  );
  if (!(maximum > minimum)) return null;
  const width = maximum - minimum;
  const grid = deepFreeze(Array.from({ length: GRID_POINT_COUNT }, (_, index) => {
    const normalizedCommonVolume01 = index / (GRID_POINT_COUNT - 1);
    const volumeM3 = minimum + normalizedCommonVolume01 * width;
    const reservoirPressurePa = interpolatePressureAtVolume(
      reservoir.points,
      volumeM3,
    );
    const conduitPressurePa = interpolatePressureAtVolume(
      conduit.points,
      volumeM3,
    );
    return deepFreeze({
      normalizedCommonVolume01,
      volumeM3,
      reservoirPressurePa,
      conduitPressurePa,
      reservoirMinusConduitPressurePa:
        reservoirPressurePa - conduitPressurePa,
    });
  }));
  let integral = 0;
  for (let index = 1; index < grid.length; index += 1) {
    const first = grid[index - 1];
    const second = grid[index];
    integral += 0.5
      * (first.reservoirMinusConduitPressurePa
        + second.reservoirMinusConduitPressurePa)
      * (second.volumeM3 - first.volumeM3);
  }
  const deltas = grid.map((point) => point.reservoirMinusConduitPressurePa);
  return deepFreeze({
    commonVolumeMinimumM3: minimum,
    commonVolumeMaximumM3: maximum,
    overlapWidthM3: width,
    gridPointCount: GRID_POINT_COUNT,
    meanReservoirMinusConduitPressurePa: integral / width,
    minimumReservoirMinusConduitPressurePa: Math.min(...deltas),
    maximumReservoirMinusConduitPressurePa: Math.max(...deltas),
    positiveGridPointFraction:
      deltas.filter((delta) => delta > 0).length / GRID_POINT_COUNT,
    trapezoidalIntegralReservoirMinusConduitPressurePaM3: integral,
    grid,
  });
}

function wholeCyclePvReadback(
  samples: readonly ValidatedSample[],
  atrium: PhaseB1AtrialPvReadbackAtriumV1,
): PhaseB1AtrialPvLoopReadbackV1 {
  const volumes = samples.map((sample) => sample.bloodVolumesM3[atrium]);
  const pressures = samples.map((sample) => sample.pressuresPa[atrium]);
  let doubleArea = 0;
  for (let index = 0; index < samples.length; index += 1) {
    const next = (index + 1) % samples.length;
    doubleArea += volumes[index] * pressures[next]
      - volumes[next] * pressures[index];
  }
  const signedShoelaceAreaPaM3 = 0.5 * doubleArea;
  const minimumVolume = Math.min(...volumes);
  const maximumVolume = Math.max(...volumes);
  const minimumPressure = Math.min(...pressures);
  const maximumPressure = Math.max(...pressures);
  return deepFreeze({
    signedShoelaceAreaPaM3,
    absoluteShoelaceAreaPaM3: Math.abs(signedShoelaceAreaPaM3),
    volumeRangeM3: {
      minimum: minimumVolume,
      maximum: maximumVolume,
      width: maximumVolume - minimumVolume,
    },
    pressureRangePa: {
      minimum: minimumPressure,
      maximum: maximumPressure,
      width: maximumPressure - minimumPressure,
    },
    closingChordApplied: true,
  });
}

function selectCircularWindow(
  samples: readonly ValidatedSample[],
  atrium: PhaseB1AtrialPvReadbackAtriumV1,
  startPhaseSec: number,
  endPhaseSec: number,
  cycleLengthSec: number,
): readonly PhaseB1AtrialPvReadbackPointV1[] {
  const complete = samples.map((sample) => pointFromSample(sample, atrium));
  const expanded = [
    ...complete,
    ...complete.slice(1).map((point) => deepFreeze({
      ...point,
      phaseSec: point.phaseSec + cycleLengthSec,
    })),
  ];
  const start = interpolatePointAtPhase(expanded, startPhaseSec);
  const end = interpolatePointAtPhase(expanded, endPhaseSec);
  const interior = expanded.filter((point) =>
    point.phaseSec > startPhaseSec && point.phaseSec < endPhaseSec);
  return deepFreeze([start, ...interior, end]);
}

function interpolatePointAtPhase(
  samples: readonly ValidatedSample[],
  atrium: PhaseB1AtrialPvReadbackAtriumV1,
  phaseSec: number,
): PhaseB1AtrialPvReadbackPointV1;
function interpolatePointAtPhase(
  samples: readonly PhaseB1AtrialPvReadbackPointV1[],
  phaseSec: number,
): PhaseB1AtrialPvReadbackPointV1;
function interpolatePointAtPhase(
  samples: readonly (ValidatedSample | PhaseB1AtrialPvReadbackPointV1)[],
  atriumOrPhase: PhaseB1AtrialPvReadbackAtriumV1 | number,
  maybePhase?: number,
): PhaseB1AtrialPvReadbackPointV1 {
  const isValidated = typeof atriumOrPhase === "string";
  const atrium = isValidated ? atriumOrPhase : null;
  const phaseSec = isValidated ? maybePhase! : atriumOrPhase;
  const points = isValidated
    ? (samples as readonly ValidatedSample[]).map((sample) =>
      pointFromSample(sample, atrium!))
    : samples as readonly PhaseB1AtrialPvReadbackPointV1[];
  const exact = points.find((point) => point.phaseSec === phaseSec);
  if (exact !== undefined) return exact;
  let upper = 1;
  while (upper < points.length && points[upper].phaseSec < phaseSec) upper += 1;
  if (upper >= points.length || points[upper - 1].phaseSec > phaseSec) {
    throw new Error("atrial PV interpolation phase lies outside the trace");
  }
  const first = points[upper - 1];
  const second = points[upper];
  const fraction = (phaseSec - first.phaseSec)
    / (second.phaseSec - first.phaseSec);
  return deepFreeze({
    phaseSec,
    volumeM3: linear(first.volumeM3, second.volumeM3, fraction),
    pressurePa: linear(first.pressurePa, second.pressurePa, fraction),
  });
}

function interpolatePressureAtVolume(
  points: readonly PhaseB1AtrialPvReadbackPointV1[],
  volumeM3: number,
): number {
  const ordered = points[0].volumeM3 < points.at(-1)!.volumeM3
    ? points
    : [...points].reverse();
  const exact = ordered.find((point) => point.volumeM3 === volumeM3);
  if (exact !== undefined) return exact.pressurePa;
  let upper = 1;
  while (upper < ordered.length && ordered[upper].volumeM3 < volumeM3) upper += 1;
  if (upper >= ordered.length || ordered[upper - 1].volumeM3 > volumeM3) {
    throw new Error("matched volume lies outside a monotone atrial branch");
  }
  const first = ordered[upper - 1];
  const second = ordered[upper];
  const fraction = (volumeM3 - first.volumeM3)
    / (second.volumeM3 - first.volumeM3);
  return linear(first.pressurePa, second.pressurePa, fraction);
}

function firstLocalMinimumIndex(
  points: readonly PhaseB1AtrialPvReadbackPointV1[],
  firstCandidateIndex = 0,
): number | null {
  for (let index = firstCandidateIndex; index < points.length; index += 1) {
    const value = points[index].volumeM3;
    const lowerThanPrevious = index === 0
      || value < points[index - 1].volumeM3 - VOLUME_TOLERANCE_M3;
    const lowerThanNext = index === points.length - 1
      || value < points[index + 1].volumeM3 - VOLUME_TOLERANCE_M3;
    if (lowerThanPrevious && lowerThanNext) return index;
  }
  return null;
}

function uniqueMaximumIndex(
  points: readonly PhaseB1AtrialPvReadbackPointV1[],
  startIndex: number,
): number | null {
  let maximumIndex = startIndex;
  for (let index = startIndex + 1; index < points.length; index += 1) {
    if (points[index].volumeM3 > points[maximumIndex].volumeM3) {
      maximumIndex = index;
    }
  }
  const maximum = points[maximumIndex].volumeM3;
  const tied = points.slice(startIndex).filter((point) =>
    Math.abs(point.volumeM3 - maximum) <= VOLUME_TOLERANCE_M3).length;
  return tied === 1 ? maximumIndex : null;
}

function isStrictlyMonotone(
  points: readonly PhaseB1AtrialPvReadbackPointV1[],
  direction: "increasing" | "decreasing",
): boolean {
  return points.every((point, index) => {
    if (index === 0) return true;
    const delta = point.volumeM3 - points[index - 1].volumeM3;
    return direction === "increasing"
      ? delta > VOLUME_TOLERANCE_M3
      : delta < -VOLUME_TOLERANCE_M3;
  });
}

function branch(
  role: PhaseB1AtrialPvMonotoneBranchV1["role"],
  points: readonly PhaseB1AtrialPvReadbackPointV1[],
  status: PhaseB1AtrialPvMonotoneBranchV1["status"],
  strictlyMonotone: boolean,
): PhaseB1AtrialPvMonotoneBranchV1 {
  const volumes = points.map((point) => point.volumeM3);
  return deepFreeze({
    role,
    expectedVolumeDirection: role === "reservoir" ? "increasing" : "decreasing",
    status,
    points,
    sampleCount: points.length,
    strictlyMonotone,
    minimumVolumeM3: volumes.length === 0 ? null : Math.min(...volumes),
    maximumVolumeM3: volumes.length === 0 ? null : Math.max(...volumes),
    startPhaseSec: points[0]?.phaseSec ?? null,
    endPhaseSec: points.at(-1)?.phaseSec ?? null,
  });
}

function emptyBranch(
  role: PhaseB1AtrialPvMonotoneBranchV1["role"],
  status: "unresolved" | "ambiguous",
): PhaseB1AtrialPvMonotoneBranchV1 {
  return branch(role, [], status, false);
}

function pointFromSample(
  sample: ValidatedSample,
  atrium: PhaseB1AtrialPvReadbackAtriumV1,
): PhaseB1AtrialPvReadbackPointV1 {
  return deepFreeze({
    phaseSec: sample.phaseSec,
    volumeM3: sample.bloodVolumesM3[atrium],
    pressurePa: sample.pressuresPa[atrium],
  });
}

function validateAndCopyTrace(
  value: unknown,
): Readonly<{ cycleLengthSec: number; samples: readonly ValidatedSample[] }> {
  assertExactPlainRecordV1(value, [
    "cycleLengthSec",
    "samples",
  ], "atrial PV readback trace");
  const cycleLengthSec = requirePositiveFinite(
    value.cycleLengthSec,
    "trace.cycleLengthSec",
  );
  assertDensePlainArrayV1(value.samples, undefined, "trace.samples");
  if (value.samples.length < 3) {
    throw new Error("trace.samples must include phase 0, interior samples, and cycleLength");
  }
  const samples = value.samples.map((sample, index) => {
    assertExactPlainRecordV1(sample, [
      "phaseSec",
      "bloodVolumesM3",
      "pressuresPa",
      "allFlowsM3PerSec",
    ], `trace.samples[${index}]`);
    assertExactPlainRecordV1(
      sample.bloodVolumesM3,
      PHASE_B1_ATRIAL_PV_READBACK_ATRIUM_ORDER_V1,
      `trace.samples[${index}].bloodVolumesM3`,
    );
    assertExactPlainRecordV1(
      sample.pressuresPa,
      PHASE_B1_ATRIAL_PV_READBACK_ATRIUM_ORDER_V1,
      `trace.samples[${index}].pressuresPa`,
    );
    assertExactPlainRecordV1(
      sample.allFlowsM3PerSec,
      ["Q_MV", "Q_TV"],
      `trace.samples[${index}].allFlowsM3PerSec`,
    );
    const rawPhaseSec = requireFinite(
      sample.phaseSec,
      `trace.samples[${index}].phaseSec`,
    );
    const phaseSec = Object.is(rawPhaseSec, -0) ? 0 : rawPhaseSec;
    if (phaseSec < 0 || phaseSec > cycleLengthSec) {
      throw new Error(`trace.samples[${index}].phaseSec must lie in [0,cycleLengthSec]`);
    }
    return deepFreeze({
      sourceIndex: index,
      phaseSec,
      bloodVolumesM3: mapAtrium((atrium) => requirePositiveFinite(
        sample.bloodVolumesM3[atrium],
        `trace.samples[${index}].bloodVolumesM3.${atrium}`,
      )),
      pressuresPa: mapAtrium((atrium) => requireFinite(
        sample.pressuresPa[atrium],
        `trace.samples[${index}].pressuresPa.${atrium}`,
      )),
      allFlowsM3PerSec: deepFreeze({
        Q_MV: requireFinite(
          sample.allFlowsM3PerSec.Q_MV,
          `trace.samples[${index}].allFlowsM3PerSec.Q_MV`,
        ),
        Q_TV: requireFinite(
          sample.allFlowsM3PerSec.Q_TV,
          `trace.samples[${index}].allFlowsM3PerSec.Q_TV`,
        ),
      }),
    });
  });
  if (samples[0].phaseSec !== 0) {
    throw new Error("trace.samples must start at phaseSec 0");
  }
  if (samples.at(-1)!.phaseSec !== cycleLengthSec) {
    throw new Error("trace.samples must include the duplicated cycle endpoint");
  }
  if (samples.some((sample, index) =>
    index > 0 && sample.phaseSec <= samples[index - 1].phaseSec)) {
    throw new Error("trace sample phases must strictly increase from 0 through cycleLengthSec");
  }
  return deepFreeze({ cycleLengthSec, samples });
}

function uniqueReasons(
  reasons: readonly PhaseB1AtrialPvReadbackReasonV1[],
): readonly PhaseB1AtrialPvReadbackReasonV1[] {
  return Object.freeze([...new Set(reasons)]);
}

function normalizePhase(phaseSec: number, cycleLengthSec: number): number {
  if (Math.abs(phaseSec - cycleLengthSec) <= 1e-14) return 0;
  return phaseSec;
}

function unwrapAfter(start: number, phase: number, cycle: number): number {
  let unwrapped = phase;
  while (!(unwrapped > start)) unwrapped += cycle;
  return unwrapped;
}

function linear(first: number, second: number, fraction: number): number {
  return first + fraction * (second - first);
}

function requireFinite(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${field} must be finite`);
  }
  return value;
}

function requirePositiveFinite(value: unknown, field: string): number {
  const finite = requireFinite(value, field);
  if (!(finite > 0)) throw new Error(`${field} must be positive`);
  return finite;
}

function mapAtrium<Value>(
  build: (atrium: PhaseB1AtrialPvReadbackAtriumV1) => Value,
): Readonly<Record<PhaseB1AtrialPvReadbackAtriumV1, Value>> {
  return deepFreeze({ LA: build("LA"), RA: build("RA") });
}

function deepFreeze<Value>(value: Value): Value {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
  }
  return value;
}
