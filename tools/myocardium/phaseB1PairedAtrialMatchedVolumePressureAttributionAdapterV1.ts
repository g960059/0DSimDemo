import {
  type CanonicalSha256HexProvider,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  evaluatePhaseB1EventFreeEndpointV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/eventFreeMonolithicBackwardEulerV1";
import {
  assertBuilderIssuedPhaseB1NormalSinusBeTerminalTimestepObservationV1,
  type PhaseB1NormalSinusBeTerminalTimestepObservationV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1NormalSinusBeTerminalTimestepObservationV1";
import {
  assertExactPlainRecordV1,
} from "@/engine/myocardium/fourChamberV1/validation/strictClosedRecordV1";
import {
  PHASE_B1_PAIRED_ATRIAL_MATCHED_VOLUME_ATRIUM_ORDER_V1,
  PHASE_B1_PAIRED_ATRIAL_MATCHED_VOLUME_MODE_ORDER_V1,
  validatePhaseB1PairedAtrialMatchedVolumePressureAttributionManifestV1,
  type PhaseB1AtrialPressureAttributionSampleV1,
  type PhaseB1AtrialPressureComponentsPaV1,
  type PhaseB1AtrialPressurePhaseSeriesV1,
  type PhaseB1MatchedVolumeSourceProvenanceByModeV1,
  type PhaseB1PairedAtrialMatchedVolumeAtriumV1,
  type PhaseB1PairedAtrialMatchedVolumePressureAttributionManifestV1,
  type PhaseB1PairedAtrialPressureSeriesByModeV1,
} from "@/tools/myocardium/phaseB1PairedAtrialMatchedVolumePressureAttributionV1";

export const PHASE_B1_PAIRED_ATRIAL_MATCHED_VOLUME_TERMINAL_OBSERVATION_ADAPTER_V1_ID =
  "phase-b1-paired-atrial-matched-volume-terminal-observation-adapter-v1" as const;

export const PHASE_B1_PAIRED_ATRIAL_MATCHED_VOLUME_PHASE_SEMANTICS_V1 =
  deepFreeze([
    {
      phaseId: "reservoir-av-closure-to-opening",
      role: "reservoir" as const,
      startBoundary:
        "functional-av-main-positive-flow-lobe-closing-crossing",
      endBoundary:
        "functional-av-main-positive-flow-lobe-opening-crossing",
      expectedVolumeDirection: "increasing" as const,
    },
    {
      phaseId: "conduit-av-opening-to-next-atrial-calcium-drive",
      role: "conduit" as const,
      startBoundary:
        "functional-av-main-positive-flow-lobe-opening-crossing",
      endBoundary: "next-scheduled-atrial-calcium-drive",
      expectedVolumeDirection: "decreasing" as const,
    },
    {
      phaseId: "pump-atrial-calcium-drive-to-av-closure",
      role: "pump" as const,
      startBoundary: "scheduled-atrial-calcium-drive",
      endBoundary:
        "functional-av-main-positive-flow-lobe-closing-crossing",
      expectedVolumeDirection: "decreasing" as const,
    },
  ]);

const SLS_OFF_NEAR_ZERO_ABSOLUTE_TOLERANCE_PA = 1e-6;
const SLS_OFF_NEAR_ZERO_RELATIVE_TOLERANCE = 1e-10;
type ObservationV1 = PhaseB1NormalSinusBeTerminalTimestepObservationV1;
type ModeV1 = (typeof PHASE_B1_PAIRED_ATRIAL_MATCHED_VOLUME_MODE_ORDER_V1)[number];

export type PhaseB1PairedAtrialMatchedVolumeBoundaryResolutionReasonV1 =
  | "functional-av-main-positive-flow-lobe-not-unique"
  | "functional-av-main-positive-flow-lobe-unresolved"
  | "functional-av-hidden-retry-sign-topology"
  | "functional-av-opening-or-closing-scalar-unavailable"
  | "atrial-calcium-drive-unavailable-or-invalid"
  | "functional-boundary-cyclic-order-unresolved";

export type PhaseB1PairedAtrialMatchedVolumeMeasuredBoundaryV1 =
  | Readonly<{
    status: "resolved";
    avOpeningPhaseSec: number;
    avClosurePhaseSec: number;
    atrialCalciumDrivePhaseSec: number;
    reason: null;
  }>
  | Readonly<{
    status: "unresolved";
    avOpeningPhaseSec: null;
    avClosurePhaseSec: null;
    atrialCalciumDrivePhaseSec: null;
    reason: PhaseB1PairedAtrialMatchedVolumeBoundaryResolutionReasonV1;
  }>;

export type PhaseB1PairedAtrialMatchedVolumeTerminalObservationAdapterV1 =
  Readonly<{
    adapterId:
      typeof PHASE_B1_PAIRED_ATRIAL_MATCHED_VOLUME_TERMINAL_OBSERVATION_ADAPTER_V1_ID;
    sourceObservationsAuthenticatedInProcess: true;
    sourceProvenanceByMode: PhaseB1MatchedVolumeSourceProvenanceByModeV1;
    seriesByMode: PhaseB1PairedAtrialPressureSeriesByModeV1;
    measuredBoundaryByModeAndAtrium: Readonly<Record<
      ModeV1,
      Readonly<Record<
        PhaseB1PairedAtrialMatchedVolumeAtriumV1,
        PhaseB1PairedAtrialMatchedVolumeMeasuredBoundaryV1
      >>
    >>;
    audit: Readonly<{
      pressureOwnerFormula:
        "P_abs=P_eq+P_act+P_sls(direct)+P_ext";
      equilibriumPassiveSource:
        "Gamma*same-time-level-wall-mechanics-equilibrium-passive-stress";
      activeSource: "Gamma*same-time-level-wall-mechanics-active-stress";
      commonExternalSource:
        "intrathoracicPressurePa+same-time-level-pericardial-excess-pressure";
      slsOverstressSource:
        "Gamma*same-time-level-wall-mechanics-sls-overstress";
      eachEndpointIndependentlyReevaluatedAtSameTimeLevel: true;
      maximumAbsoluteSourceReconstructionResidualPa: number;
      maximumAbsoluteSlsOffContributionPaByAtrium: Readonly<Record<
        PhaseB1PairedAtrialMatchedVolumeAtriumV1,
        number
      >>;
      slsOffNearZeroAbsoluteTolerancePa: number;
      slsOffNearZeroRelativeTolerance: number;
      slsOffNearZeroAuditPassByAtrium: Readonly<Record<
        PhaseB1PairedAtrialMatchedVolumeAtriumV1,
        boolean
      >>;
      slsOffNearZeroAuditPass: boolean;
      slsOffNearZeroAuditUsedAsAcceptanceGate: false;
      pressureDeltaSignUsedAsAcceptanceGate: false;
      pvTopologyUsedAsAcceptanceGate: false;
      phaseBoundariesAreResultDependent: true;
      phaseBoundaryResolutionIndependentOfGlobalTerminalObservationGate: true;
      unresolvedBoundaryProducesThreeEmptyPhaseSeries: true;
      phaseSemanticsPredeclaredBeforeModeAdvance: true;
      functionalValveBoundaryDefinition:
        "unique-resolved-main-signed-forward-flow-lobe-linear-crossing";
      cyclicOrderRequired:
        "atrial-calcium-drive<av-closure<av-opening<next-atrial-calcium-drive";
      circularWrapRule: "add-one-cycle-to-end-until-strictly-after-start";
      boundaryInterpolation: "piecewise-linear-in-phase";
    }>;
  }>;

export function buildPhaseB1PairedAtrialMatchedVolumeTerminalObservationAdapterV1(
  input: Readonly<{
    analysisManifest:
      PhaseB1PairedAtrialMatchedVolumePressureAttributionManifestV1;
    slsOffTerminalObservation: ObservationV1;
    slsOnTerminalObservation: ObservationV1;
    sha256Hex: CanonicalSha256HexProvider;
  }>,
): PhaseB1PairedAtrialMatchedVolumeTerminalObservationAdapterV1 {
  assertExactPlainRecordV1(input, [
    "analysisManifest",
    "slsOffTerminalObservation",
    "slsOnTerminalObservation",
    "sha256Hex",
  ], "paired atrial matched-volume terminal-observation adapter input");
  if (typeof input.sha256Hex !== "function") {
    throw new Error("matched-volume terminal-observation adapter requires SHA-256");
  }
  const manifest =
    validatePhaseB1PairedAtrialMatchedVolumePressureAttributionManifestV1(
      input.analysisManifest,
      input.sha256Hex,
    );
  assertSemanticManifest(manifest);
  const observations = deepFreeze({
    off: assertBuilderIssuedPhaseB1NormalSinusBeTerminalTimestepObservationV1(
      input.slsOffTerminalObservation,
      input.sha256Hex,
    ),
    on: assertBuilderIssuedPhaseB1NormalSinusBeTerminalTimestepObservationV1(
      input.slsOnTerminalObservation,
      input.sha256Hex,
    ),
  });
  assertPairedObservationLineage(observations.off, observations.on);

  const completeOwnerSeriesByMode = mapMode((mode) => mapAtrium((atriumId) =>
    buildCompleteOwnerSeries(observations[mode], atriumId)));
  const measuredBoundaryByModeAndAtrium = mapMode((mode) => mapAtrium(
    (atriumId) => measuredBoundaries(observations[mode], atriumId),
  ));
  const seriesByMode = mapMode((mode) => mapAtrium((atriumId) => {
    const cycleLengthSec = observations[mode].canonicalCycleLengthSec;
    const boundary = measuredBoundaryByModeAndAtrium[mode][atriumId];
    const complete = completeOwnerSeriesByMode[mode][atriumId];
    if (boundary.status === "unresolved") {
      return deepFreeze(manifest.phaseWindows.map((semantic) =>
        unresolvedPhaseSeries(semantic, boundary.reason)));
    }
    const reservoirStart = boundary.avClosurePhaseSec;
    const reservoirEnd = unwrapAfter(
      reservoirStart,
      boundary.avOpeningPhaseSec,
      cycleLengthSec,
    );
    const conduitStart = boundary.avOpeningPhaseSec;
    const conduitEnd = unwrapAfter(
      conduitStart,
      boundary.atrialCalciumDrivePhaseSec,
      cycleLengthSec,
    );
    const pumpStart = boundary.atrialCalciumDrivePhaseSec;
    const pumpEnd = unwrapAfter(
      pumpStart,
      boundary.avClosurePhaseSec,
      cycleLengthSec,
    );
    return deepFreeze([
      phaseSeries(
        manifest.phaseWindows[0],
        reservoirStart,
        reservoirEnd,
        complete,
        cycleLengthSec,
      ),
      phaseSeries(
        manifest.phaseWindows[1],
        conduitStart,
        conduitEnd,
        complete,
        cycleLengthSec,
      ),
      phaseSeries(
        manifest.phaseWindows[2],
        pumpStart,
        pumpEnd,
        complete,
        cycleLengthSec,
      ),
    ]);
  }));
  const maximumAbsoluteSlsOffContributionPaByAtrium = mapAtrium((atriumId) =>
    Math.max(...completeOwnerSeriesByMode.off[atriumId].map((sample) =>
      Math.abs(sample.pressureComponentsPa.slsOverstress))));
  const slsOffNearZeroAuditPassByAtrium = mapAtrium((atriumId) => {
    const maximumTotal = Math.max(
      ...completeOwnerSeriesByMode.off[atriumId].map((sample) =>
        Math.abs(sample.totalAbsolutePressurePa)),
    );
    const tolerance = SLS_OFF_NEAR_ZERO_ABSOLUTE_TOLERANCE_PA
      + SLS_OFF_NEAR_ZERO_RELATIVE_TOLERANCE * maximumTotal;
    return maximumAbsoluteSlsOffContributionPaByAtrium[atriumId] <= tolerance;
  });
  const maximumAbsoluteSourceReconstructionResidualPa = Math.max(
    ...PHASE_B1_PAIRED_ATRIAL_MATCHED_VOLUME_MODE_ORDER_V1.flatMap((mode) =>
      PHASE_B1_PAIRED_ATRIAL_MATCHED_VOLUME_ATRIUM_ORDER_V1.flatMap(
        (atriumId) => completeOwnerSeriesByMode[mode][atriumId].map((sample) =>
          Math.abs(sample.totalAbsolutePressurePa
            - componentSum(sample.pressureComponentsPa))),
      )),
  );
  return deepFreeze({
    adapterId:
      PHASE_B1_PAIRED_ATRIAL_MATCHED_VOLUME_TERMINAL_OBSERVATION_ADAPTER_V1_ID,
    sourceObservationsAuthenticatedInProcess: true as const,
    sourceProvenanceByMode: {
      off: {
        sourceArtifactId: observations.off.observationId,
        sourceContentSha256: observations.off.contentSha256,
      },
      on: {
        sourceArtifactId: observations.on.observationId,
        sourceContentSha256: observations.on.contentSha256,
      },
    },
    seriesByMode,
    measuredBoundaryByModeAndAtrium,
    audit: {
      pressureOwnerFormula:
        "P_abs=P_eq+P_act+P_sls(direct)+P_ext" as const,
      equilibriumPassiveSource:
        "Gamma*same-time-level-wall-mechanics-equilibrium-passive-stress" as const,
      activeSource:
        "Gamma*same-time-level-wall-mechanics-active-stress" as const,
      commonExternalSource:
        "intrathoracicPressurePa+same-time-level-pericardial-excess-pressure" as const,
      slsOverstressSource:
        "Gamma*same-time-level-wall-mechanics-sls-overstress" as const,
      eachEndpointIndependentlyReevaluatedAtSameTimeLevel: true as const,
      maximumAbsoluteSourceReconstructionResidualPa,
      maximumAbsoluteSlsOffContributionPaByAtrium,
      slsOffNearZeroAbsoluteTolerancePa:
        SLS_OFF_NEAR_ZERO_ABSOLUTE_TOLERANCE_PA,
      slsOffNearZeroRelativeTolerance:
        SLS_OFF_NEAR_ZERO_RELATIVE_TOLERANCE,
      slsOffNearZeroAuditPassByAtrium,
      slsOffNearZeroAuditPass:
        PHASE_B1_PAIRED_ATRIAL_MATCHED_VOLUME_ATRIUM_ORDER_V1.every(
          (atriumId) => slsOffNearZeroAuditPassByAtrium[atriumId],
        ),
      slsOffNearZeroAuditUsedAsAcceptanceGate: false as const,
      pressureDeltaSignUsedAsAcceptanceGate: false as const,
      pvTopologyUsedAsAcceptanceGate: false as const,
      phaseBoundariesAreResultDependent: true as const,
      phaseBoundaryResolutionIndependentOfGlobalTerminalObservationGate:
        true as const,
      unresolvedBoundaryProducesThreeEmptyPhaseSeries: true as const,
      phaseSemanticsPredeclaredBeforeModeAdvance: true as const,
      functionalValveBoundaryDefinition:
        "unique-resolved-main-signed-forward-flow-lobe-linear-crossing" as const,
      cyclicOrderRequired:
        "atrial-calcium-drive<av-closure<av-opening<next-atrial-calcium-drive" as const,
      circularWrapRule:
        "add-one-cycle-to-end-until-strictly-after-start" as const,
      boundaryInterpolation: "piecewise-linear-in-phase" as const,
    },
  });
}

function assertSemanticManifest(
  manifest: PhaseB1PairedAtrialMatchedVolumePressureAttributionManifestV1,
): void {
  if (
    manifest.phaseWindows.length
      !== PHASE_B1_PAIRED_ATRIAL_MATCHED_VOLUME_PHASE_SEMANTICS_V1.length
    || manifest.phaseWindows.some((window, index) => {
      const expected =
        PHASE_B1_PAIRED_ATRIAL_MATCHED_VOLUME_PHASE_SEMANTICS_V1[index];
      return window.phaseId !== expected.phaseId
        || window.role !== expected.role
        || window.startBoundary !== expected.startBoundary
        || window.endBoundary !== expected.endBoundary
        || window.expectedVolumeDirection !== expected.expectedVolumeDirection;
    })
  ) throw new Error("matched-volume manifest phase semantics drifted");
}

function assertPairedObservationLineage(off: ObservationV1, on: ObservationV1): void {
  if (off.slsMode !== "off" || on.slsMode !== "on") {
    throw new Error("matched-volume adapter requires SLS-off/on observations");
  }
  if (
    !Object.is(off.comparisonManifest, on.comparisonManifest)
    || !Object.is(off.initialSourceParityAudit, on.initialSourceParityAudit)
    || !Object.is(
      off.terminalCycleCapsule.parentManifest,
      on.terminalCycleCapsule.parentManifest,
    )
    || !Object.is(
      off.terminalCycleCapsule.parentNumericalEvidence,
      on.terminalCycleCapsule.parentNumericalEvidence,
    )
    || !Object.is(
      off.terminalCycleCapsule.schedule,
      on.terminalCycleCapsule.schedule,
    )
    || off.nominalDtSec !== on.nominalDtSec
    || off.canonicalCycleLengthSec !== on.canonicalCycleLengthSec
  ) throw new Error("matched-volume adapter observation lineage differs");
}

function measuredBoundaries(
  observation: ObservationV1,
  atriumId: PhaseB1PairedAtrialMatchedVolumeAtriumV1,
): PhaseB1PairedAtrialMatchedVolumeMeasuredBoundaryV1 {
  const valveFlowId = atriumId === "LA" ? "Q_MV" : "Q_TV";
  const mainLobe = observation.valveObservationAudit
    .mainPositiveFlowLobeByValve[valveFlowId];
  if (mainLobe.positiveLobeCount !== 1) {
    return unresolvedBoundaries(
      "functional-av-main-positive-flow-lobe-not-unique",
    );
  }
  if (mainLobe.resolved !== true || mainLobe.status !== "resolved") {
    return unresolvedBoundaries(
      "functional-av-main-positive-flow-lobe-unresolved",
    );
  }
  const hiddenSign = observation.valveObservationAudit
    .hiddenRetrySignTopologyByValve[valveFlowId];
  if (hiddenSign.pass !== true) {
    return unresolvedBoundaries(
      "functional-av-hidden-retry-sign-topology",
    );
  }
  const opening = valvePhaseOrNull(observation, valveFlowId,
    "main-signed-forward-flow-lobe-opening");
  const closure = valvePhaseOrNull(observation, valveFlowId,
    "main-signed-forward-flow-lobe-closing");
  if (opening === null || closure === null) {
    return unresolvedBoundaries(
      "functional-av-opening-or-closing-scalar-unavailable",
    );
  }
  const calciumEvent = observation.terminalCycleCapsule.schedule.events.find(
    (event) => event.wallId === atriumId,
  );
  if (
    calciumEvent === undefined
    || !validPhase(
      calciumEvent.calciumDriveOffsetWithinCycleSec,
      observation.canonicalCycleLengthSec,
    )
  ) {
    return unresolvedBoundaries(
      "atrial-calcium-drive-unavailable-or-invalid",
    );
  }
  const boundary = deepFreeze({
    status: "resolved" as const,
    avOpeningPhaseSec: opening,
    avClosurePhaseSec: closure,
    atrialCalciumDrivePhaseSec: calciumEvent.calciumDriveOffsetWithinCycleSec,
    reason: null,
  });
  const closureAfterCalcium = unwrapAfter(
    boundary.atrialCalciumDrivePhaseSec,
    boundary.avClosurePhaseSec,
    observation.canonicalCycleLengthSec,
  );
  const openingAfterClosure = unwrapAfter(
    closureAfterCalcium,
    boundary.avOpeningPhaseSec,
    observation.canonicalCycleLengthSec,
  );
  const nextCalcium = boundary.atrialCalciumDrivePhaseSec
    + observation.canonicalCycleLengthSec;
  if (!(closureAfterCalcium < openingAfterClosure && openingAfterClosure < nextCalcium)) {
    return unresolvedBoundaries(
      "functional-boundary-cyclic-order-unresolved",
    );
  }
  return boundary;
}

function valvePhaseOrNull(
  observation: ObservationV1,
  valveFlowId: "Q_MV" | "Q_TV",
  event: "main-signed-forward-flow-lobe-opening"
    | "main-signed-forward-flow-lobe-closing",
): number | null {
  const scalar = observation.valveTimingScalars.find((candidate) =>
    candidate.valveFlowId === valveFlowId && candidate.event === event);
  if (
    scalar === undefined
    || scalar.available !== true
    || scalar.phaseSec === null
    || !validPhase(scalar.phaseSec, observation.canonicalCycleLengthSec)
  ) return null;
  return scalar.phaseSec;
}

function unresolvedBoundaries(
  reason: PhaseB1PairedAtrialMatchedVolumeBoundaryResolutionReasonV1,
): PhaseB1PairedAtrialMatchedVolumeMeasuredBoundaryV1 {
  return deepFreeze({
    status: "unresolved" as const,
    avOpeningPhaseSec: null,
    avClosurePhaseSec: null,
    atrialCalciumDrivePhaseSec: null,
    reason,
  });
}

function buildCompleteOwnerSeries(
  observation: ObservationV1,
  atriumId: PhaseB1PairedAtrialMatchedVolumeAtriumV1,
): readonly PhaseB1AtrialPressureAttributionSampleV1[] {
  const model = observation.terminalCycleCapsule.sourceCase.model;
  const binding = observation.terminalCycleCapsule.sourceCase
    .wallMaterialBinding;
  const intrathoracicPressurePa =
    model.closedLoopParameters.intrathoracicPressurePa;
  return deepFreeze(observation.sampleTrace.samples.map((sample, index) => {
    const endpoint = retainedEndpointForSample(observation, sample);
    const evaluation = evaluatePhaseB1EventFreeEndpointV1(
      model,
      binding,
      endpoint,
    );
    const wall = evaluation.closedLoop.wallMechanics[atriumId];
    const atrium = evaluation.closedLoop.atria[atriumId];
    if (
      !Object.is(endpoint.timeSec, sample.absoluteTimeSec)
      || !Object.is(
        evaluation.closedLoop.state.bloodVolumesM3[atriumId],
        sample.bloodVolumesM3[atriumId],
      )
      || !Object.is(
        evaluation.closedLoop.compartmentAbsolutePressurePa[atriumId],
        sample.compartmentAbsolutePressurePa[atriumId],
      )
      || !Object.is(
        wall.fiberLogStrain,
        sample.wallFiberLogStrain[atriumId],
      )
      || !Object.is(
        wall.activeKirchhoffStressPa,
        sample.wallActiveKirchhoffStressPa[atriumId],
      )
      || !Object.is(
        evaluation.closedLoop.pericardium.excessPressurePa,
        sample.pericardialExcessPressurePa,
      )
    ) {
      throw new Error(
        `${observation.slsMode}.${atriumId}.samples[${index}] differs from independent same-time-level reevaluation`,
      );
    }
    const gamma = atrium.pressure.virtualWorkCoefficient;
    const equilibriumPassive = gamma
      * wall.equilibriumPassive.equilibriumKirchhoffStressPa;
    const activeLand = gamma * wall.activeKirchhoffStressPa;
    const slsOverstress = gamma * wall.slsOverstressPa;
    const commonExternal = intrathoracicPressurePa
      + evaluation.closedLoop.pericardium.excessPressurePa;
    const totalAbsolutePressurePa =
      evaluation.closedLoop.compartmentAbsolutePressurePa[atriumId];
    const pressureComponentsPa = deepFreeze({
      equilibriumPassive,
      activeLand,
      slsOverstress,
      commonExternal,
    });
    for (const [field, value] of Object.entries({
      gamma,
      totalAbsolutePressurePa,
      ...pressureComponentsPa,
    })) {
      if (!Number.isFinite(value)) {
        throw new Error(
          `${observation.slsMode}.${atriumId}.samples[${index}].${field} must be finite`,
        );
      }
    }
    return deepFreeze({
      phaseSec: sample.phaseSec,
      volumeM3: sample.bloodVolumesM3[atriumId],
      totalAbsolutePressurePa,
      pressureComponentsPa,
    });
  }));
}

function retainedEndpointForSample(
  observation: ObservationV1,
  sample: ObservationV1["sampleTrace"]["samples"][number],
) {
  const run = observation.terminalCycleCapsule.sourceScheduleRun;
  if (sample.sourceKind === "run-initial-endpoint") {
    if (sample.requestedSegmentIndex !== null) {
      throw new Error("initial terminal observation sample has a segment index");
    }
    return run.initialEndpoint;
  }
  const segmentIndex = sample.requestedSegmentIndex;
  if (segmentIndex === null) {
    throw new Error("segment-exit terminal observation sample lost its index");
  }
  const segment = run.requestedSegments[segmentIndex];
  if (
    segment === undefined
    || segment.requestedSegmentIndex !== segmentIndex
  ) throw new Error("terminal observation sample segment provenance drifted");
  return segment.exitEndpoint;
}

function phaseSeries(
  semantic: PhaseB1PairedAtrialMatchedVolumePressureAttributionManifestV1[
    "phaseWindows"
  ][number],
  startPhaseSec: number,
  endPhaseSec: number,
  completeCycle: readonly PhaseB1AtrialPressureAttributionSampleV1[],
  cycleLengthSec: number,
): PhaseB1AtrialPressurePhaseSeriesV1 {
  return deepFreeze({
    phaseId: semantic.phaseId,
    startBoundary: semantic.startBoundary,
    endBoundary: semantic.endBoundary,
    boundaryResolution: {
      status: "resolved" as const,
      startPhaseSec,
      endPhaseSec,
      reason: null,
    },
    samples: selectCircularWindow(
      completeCycle,
      startPhaseSec,
      endPhaseSec,
      cycleLengthSec,
    ),
  });
}

function unresolvedPhaseSeries(
  semantic: PhaseB1PairedAtrialMatchedVolumePressureAttributionManifestV1[
    "phaseWindows"
  ][number],
  reason: PhaseB1PairedAtrialMatchedVolumeBoundaryResolutionReasonV1,
): PhaseB1AtrialPressurePhaseSeriesV1 {
  return deepFreeze({
    phaseId: semantic.phaseId,
    startBoundary: semantic.startBoundary,
    endBoundary: semantic.endBoundary,
    boundaryResolution: {
      status: "unresolved" as const,
      startPhaseSec: null,
      endPhaseSec: null,
      reason,
    },
    samples: [],
  });
}

export function selectPhaseB1AtrialPressureCircularWindowV1(
  input: Readonly<{
    completeCycle: readonly PhaseB1AtrialPressureAttributionSampleV1[];
    startPhaseSec: number;
    endPhaseSec: number;
    cycleLengthSec: number;
  }>,
): readonly PhaseB1AtrialPressureAttributionSampleV1[] {
  assertExactPlainRecordV1(input, [
    "completeCycle",
    "startPhaseSec",
    "endPhaseSec",
    "cycleLengthSec",
  ], "atrial pressure circular-window input");
  return selectCircularWindow(
    input.completeCycle,
    input.startPhaseSec,
    input.endPhaseSec,
    input.cycleLengthSec,
  );
}

function selectCircularWindow(
  completeCycle: readonly PhaseB1AtrialPressureAttributionSampleV1[],
  startPhaseSec: number,
  endPhaseSec: number,
  cycleLengthSec: number,
): readonly PhaseB1AtrialPressureAttributionSampleV1[] {
  if (
    !Number.isFinite(cycleLengthSec)
    || !(cycleLengthSec > 0)
    || !Number.isFinite(startPhaseSec)
    || !Number.isFinite(endPhaseSec)
    || startPhaseSec < 0
    || startPhaseSec >= cycleLengthSec
    || !(endPhaseSec > startPhaseSec)
    || endPhaseSec > startPhaseSec + cycleLengthSec
  ) throw new Error("atrial pressure circular-window boundaries are invalid");
  if (
    completeCycle.length < 2
    || completeCycle[0].phaseSec !== 0
    || completeCycle[completeCycle.length - 1].phaseSec !== cycleLengthSec
    || completeCycle.some((sample, index) =>
      !Number.isFinite(sample.phaseSec)
      || (index > 0 && sample.phaseSec <= completeCycle[index - 1].phaseSec))
  ) throw new Error("atrial pressure complete cycle must span [0,cycleLength]");
  const expanded = [
    ...completeCycle,
    ...completeCycle.slice(1).map((sample) => deepFreeze({
      ...sample,
      phaseSec: sample.phaseSec + cycleLengthSec,
    })),
  ];
  const start = interpolateAtPhase(expanded, startPhaseSec);
  const end = interpolateAtPhase(expanded, endPhaseSec);
  const interior = expanded.filter((sample) =>
    sample.phaseSec > startPhaseSec && sample.phaseSec < endPhaseSec);
  return deepFreeze([start, ...interior, end]);
}

function interpolateAtPhase(
  samples: readonly PhaseB1AtrialPressureAttributionSampleV1[],
  phaseSec: number,
): PhaseB1AtrialPressureAttributionSampleV1 {
  const exact = samples.find((sample) => sample.phaseSec === phaseSec);
  if (exact !== undefined) return exact;
  let upper = 1;
  while (upper < samples.length && samples[upper].phaseSec < phaseSec) upper += 1;
  if (upper >= samples.length || samples[upper - 1].phaseSec > phaseSec) {
    throw new Error("atrial pressure boundary lies outside expanded cycle");
  }
  const first = samples[upper - 1];
  const second = samples[upper];
  const fraction = (phaseSec - first.phaseSec)
    / (second.phaseSec - first.phaseSec);
  const pressureComponentsPa = mapOwners((owner) => linear(
    first.pressureComponentsPa[owner],
    second.pressureComponentsPa[owner],
    fraction,
  ));
  return deepFreeze({
    phaseSec,
    volumeM3: linear(first.volumeM3, second.volumeM3, fraction),
    totalAbsolutePressurePa: linear(
      first.totalAbsolutePressurePa,
      second.totalAbsolutePressurePa,
      fraction,
    ),
    pressureComponentsPa,
  });
}

function unwrapAfter(start: number, endWithinCycle: number, cycle: number): number {
  let end = endWithinCycle;
  while (!(end > start)) end += cycle;
  return end;
}

function validPhase(value: number, cycle: number): boolean {
  return Number.isFinite(value) && value >= 0 && value < cycle;
}

function componentSum(components: PhaseB1AtrialPressureComponentsPaV1): number {
  return components.equilibriumPassive
    + components.activeLand
    + components.slsOverstress
    + components.commonExternal;
}

function mapMode<Value>(build: (mode: ModeV1) => Value): Readonly<Record<
  ModeV1,
  Value
>> {
  return deepFreeze({ off: build("off"), on: build("on") });
}

function mapAtrium<Value>(
  build: (atriumId: PhaseB1PairedAtrialMatchedVolumeAtriumV1) => Value,
): Readonly<Record<PhaseB1PairedAtrialMatchedVolumeAtriumV1, Value>> {
  return deepFreeze({ LA: build("LA"), RA: build("RA") });
}

function mapOwners(
  build: (owner: keyof PhaseB1AtrialPressureComponentsPaV1) => number,
): PhaseB1AtrialPressureComponentsPaV1 {
  return deepFreeze({
    equilibriumPassive: build("equilibriumPassive"),
    activeLand: build("activeLand"),
    slsOverstress: build("slsOverstress"),
    commonExternal: build("commonExternal"),
  });
}

function linear(first: number, second: number, fraction: number): number {
  return first + fraction * (second - first);
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
