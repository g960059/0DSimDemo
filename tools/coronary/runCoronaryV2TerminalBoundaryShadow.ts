import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  buildCoronaryTopologyV2,
  CHILIAN_1991_DIRECTIONAL_TRANSMURAL_REPARTITION_ABLATION_V2,
  NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V2,
  repartitionCoronaryMicrovascularResistanceV2,
  scaleCoronaryLargeArterialComplianceV2,
  type CoronaryTopologyPriorV2,
} from "@/engine/coronary/topologyPriorV2";
import {
  stepCoronaryAutoregulationByTerritoryLayerV2,
  unitCoronaryDemandScaleV2,
  zeroCoronaryHyperemiaDriveV2,
  type CoronaryAutoregulationAcceptedStepV2,
  type CoronaryAutoregulationLawV2,
} from "@/engine/coronary/autoregulationV2";
import {
  initializePressureLadderCoronaryStateV2,
  solveCoronaryBackwardEulerTrialV2,
  type CoronaryHydraulicBoundaryInputV2,
  type CoronaryHydraulicEvaluationV2,
} from "@/engine/coronary/backwardEulerCoronaryNetworkV2";
import {
  CORONARY_CONSERVED_VOLUME_NODE_IDS_V2,
  CORONARY_LAYER_IDS_V2,
  CORONARY_TERRITORY_IDS_V2,
  type CoronaryConservedVolumeRecordV2,
  type CoronaryLayerIdV2,
  type CoronaryTerritoryIdV2,
  type CoronaryTerritoryLayerRecordV2,
  type CoronaryTerritoryRecordV2,
} from "@/engine/coronary/typesV2";

const REPORT_SCHEMA =
  "circleheart.coronary-v2-terminal-boundary-shadow.v1" as const;
const DEFAULT_SOURCE_PATH = path.resolve(
  "data/myocardium/reports",
  "mainwire-five-wall-coronary-twelve-beat-dt2ms-validation-v1.json",
);
const DEFAULT_OUTPUT_PATH = path.resolve(
  "data/myocardium/reports",
  "mainwire-coronary-v2-terminal-boundary-shadow-v1.json",
);

type TerritoryNumbers = CoronaryTerritoryRecordV2<number>;
type LayerNumbers = CoronaryTerritoryLayerRecordV2<number>;

type SourceSample = Readonly<{
  cyclePhase01: number;
  pressureMmHg: Readonly<{
    Ao: number;
    RA: number;
    perivascularExternal: number;
    intramyocardialByTerritoryLayer: LayerNumbers;
  }>;
}>;

type SourceReport = Readonly<{
  schema: string;
  diagnosticsVersion: number;
  completed: boolean;
  configuration: Readonly<{ dtSec: number; cycleLengthSec: number }>;
  beatSummaries: readonly Readonly<{
    beatIndex: number;
    summary: Readonly<{
      phasicCoronaryFlow: Readonly<{
        phaseDefinition: Readonly<{
          eventSegmentationAccepted: boolean;
          mitralClosurePhase01: number | null;
          aorticOpeningPhase01: number | null;
          aorticClosurePhase01: number | null;
        }>;
      }>;
    }>;
  }>[];
  samples: readonly SourceSample[];
}>;

type ShadowSample = Readonly<{
  cyclePhase01: number;
  boundaryPressureMmHg: Readonly<{
    Ao: number;
    RA: number;
    perivascularExternal: number;
    intramyocardialByTerritoryLayer: LayerNumbers;
  }>;
  absolutePressureMmHgByNode:
    CoronaryHydraulicEvaluationV2["absolutePressureMmHgByNode"];
  volumeMlByNode: CoronaryConservedVolumeRecordV2<number>;
  toneResistanceScaleByTerritoryLayer: LayerNumbers;
  flowMlPerSec: Readonly<{
    totalInlet: number;
    commonVenousOutlet: number;
    inletByTerritory: TerritoryNumbers;
    r1ByTerritoryLayer: LayerNumbers;
    tissueByTerritoryLayer: LayerNumbers;
    r2ByTerritoryLayer: LayerNumbers;
  }>;
  solver: Readonly<{
    newtonIterations: number;
    lineSearchBacktracks: number;
    residualInfinityNormMl: number;
    exactBloodVolumeLedgerResidualMl: number;
    totalDissipatedPowerMmHgMlPerSec: number;
  }>;
}>;

type PhaseDefinition = Readonly<{
  mitralClosurePhase01: number;
  aorticOpeningPhase01: number;
  aorticClosurePhase01: number;
}>;

const sourcePath = argument("--source", DEFAULT_SOURCE_PATH);
const outputPath = argument("--output", DEFAULT_OUTPUT_PATH);
const beatCount = integerArgument("--beats", 20);
const toneMode = toneModeArgument("--tone-mode", "fixed");
const toneLaw = toneLawArgument(
  "--tone-law",
  "integral-flow-homeostasis-v2",
);
const resistancePartitionMode = resistancePartitionModeArgument(
  "--resistance-partition",
  "symmetric-60-30-10",
);
const largeArterialComplianceScale = positiveNumberArgument(
  "--large-arterial-compliance-scale",
  1,
);
const initializerPhase01 = numberArgument("--initializer-phase", 0.50);
const source = JSON.parse(readFileSync(sourcePath, "utf8")) as SourceReport;
validateSource(source);
const dtSec = source.configuration.dtSec;
const resistancePrior = resistancePartitionMode === "chilian-directional-transmural"
  ? repartitionCoronaryMicrovascularResistanceV2(
    NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V2,
    CHILIAN_1991_DIRECTIONAL_TRANSMURAL_REPARTITION_ABLATION_V2,
  )
  : NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V2;
const activePrior = largeArterialComplianceScale === 1
  ? resistancePrior
  : scaleCoronaryLargeArterialComplianceV2(
    resistancePrior,
    largeArterialComplianceScale,
  );
const activeTopology = buildCoronaryTopologyV2(activePrior);
const toneUpdateWindowSec = positiveNumberArgument(
  "--tone-update-window-sec",
  source.configuration.cycleLengthSec,
);
const phaseDefinition = acceptedPhaseDefinition(source);
const orderedBoundarySamples = rotateCycleAtPhase(
  source.samples,
  initializerPhase01,
);
const firstBoundary = toBoundary(orderedBoundarySamples[0]!);
const initialized = initializePressureLadderCoronaryStateV2({
  boundary: firstBoundary,
}, activePrior, activeTopology);
let state = initialized.acceptedState;
const beatSummaries: unknown[] = [];
let finalSummary: unknown = null;
let retainedSamples: readonly ShadowSample[] = [];
let maximumLedgerResidualMl = 0;
let minimumDissipatedPowerMmHgMlPerSec = Number.POSITIVE_INFINITY;

for (let beatIndex = 1; beatIndex <= beatCount; beatIndex += 1) {
  const startVolume = state.volumeMlByNode;
  const startTone = state.toneResistanceScaleByTerritoryLayer;
  const samples: ShadowSample[] = [];
  for (const boundarySample of orderedBoundarySamples) {
    const trial = solveCoronaryBackwardEulerTrialV2(state, {
      dtSec,
      boundary: toBoundary(boundarySample),
    }, activePrior, activeTopology);
    state = trial.candidateAcceptedState;
    const hydraulics = trial.diagnostics.hydraulics;
    maximumLedgerResidualMl = Math.max(
      maximumLedgerResidualMl,
      Math.abs(trial.diagnostics.exactBloodVolumeLedgerResidualMl),
    );
    minimumDissipatedPowerMmHgMlPerSec = Math.min(
      minimumDissipatedPowerMmHgMlPerSec,
      ...Object.values(hydraulics.dissipatedPowerMmHgMlPerSecByEdge),
    );
    samples.push(Object.freeze({
      cyclePhase01: boundarySample.cyclePhase01,
      boundaryPressureMmHg: Object.freeze({
        Ao: boundarySample.pressureMmHg.Ao,
        RA: boundarySample.pressureMmHg.RA,
        perivascularExternal:
          boundarySample.pressureMmHg.perivascularExternal,
        intramyocardialByTerritoryLayer: copyLayers(
          boundarySample.pressureMmHg.intramyocardialByTerritoryLayer,
        ),
      }),
      absolutePressureMmHgByNode: hydraulics.absolutePressureMmHgByNode,
      volumeMlByNode: state.volumeMlByNode,
      toneResistanceScaleByTerritoryLayer: copyLayers(
        state.toneResistanceScaleByTerritoryLayer,
      ),
      flowMlPerSec: Object.freeze({
        totalInlet: hydraulics.totalInletFlowMlPerSec,
        commonVenousOutlet:
          hydraulics.commonCoronaryVenousOutletFlowMlPerSec,
        inletByTerritory: copyTerritory(
          hydraulics.inletFlowMlPerSecByTerritory,
        ),
        r1ByTerritoryLayer: copyLayers(
          hydraulics.layerR1FlowMlPerSecByTerritory,
        ),
        tissueByTerritoryLayer: copyLayers(
          hydraulics.layerTissueFlowMlPerSecByTerritory,
        ),
        r2ByTerritoryLayer: copyLayers(
          hydraulics.layerR2FlowMlPerSecByTerritory,
        ),
      }),
      solver: Object.freeze({
        newtonIterations: trial.diagnostics.newtonIterations,
        lineSearchBacktracks: trial.diagnostics.totalLineSearchBacktracks,
        residualInfinityNormMl: trial.diagnostics.finalResidualInfinityNormMl,
        exactBloodVolumeLedgerResidualMl:
          trial.diagnostics.exactBloodVolumeLedgerResidualMl,
        totalDissipatedPowerMmHgMlPerSec:
          hydraulics.totalDissipatedPowerMmHgMlPerSec,
      }),
    }));
  }
  const closure = volumeClosure(startVolume, state.volumeMlByNode);
  const summary = summarizeCycle(
    samples,
    phaseDefinition,
    dtSec,
    activePrior,
  );
  const toneStep = toneMode === "accepted-layer-autoregulation"
    ? acceptedLayerToneStep(
      samples,
      toneUpdateWindowSec,
      toneLaw,
      activePrior,
    )
    : null;
  const endTone = toneStep?.nextToneResistanceScaleByTerritoryLayer
    ?? state.toneResistanceScaleByTerritoryLayer;
  const toneClosure = toneStateClosure(startTone, endTone);
  if (toneStep !== null) {
    state = Object.freeze({
      ...state,
      revision: state.revision + 1,
      toneResistanceScaleByTerritoryLayer: endTone,
    });
  }
  finalSummary = Object.freeze({
    beatIndex,
    closure,
    toneClosure,
    toneResistanceScaleByTerritoryLayer: copyLayers(endTone),
    toneStep,
    summary,
  });
  beatSummaries.push(Object.freeze({
    beatIndex,
    closure,
    toneClosure,
    toneResistanceScaleByTerritoryLayer: copyLayers(endTone),
    compactSummary: compactCycleSummary(samples),
  }));
  retainedSamples = Object.freeze(samples);
}

const report = Object.freeze({
  schema: REPORT_SCHEMA,
  completed: true,
  claim: Object.freeze({
    role: "fixed-boundary-topology-falsification" as const,
    sourceBoundaryFeedbackEnabled: false as const,
    mainWireFixedTbvCouplingAccepted: false as const,
    acceptedToneAdvanced: toneMode === "accepted-layer-autoregulation",
    toneTrajectoryRepresentsPhysicalElapsedTime:
      toneMode === "fixed"
      || toneUpdateWindowSec === source.configuration.cycleLengthSec,
    simulationReady: false as const,
    inertanceIncluded: false as const,
    hardValveOrDiodeIncluded: false as const,
  }),
  configuration: Object.freeze({
    sourcePath,
    sourceSchema: source.schema,
    sourceTerminalBeatIndex: source.beatSummaries.at(-1)!.beatIndex,
    dtSec,
    cycleLengthSec: source.configuration.cycleLengthSec,
    requestedBeatCount: beatCount,
    sourceSampleCountPerCycle: orderedBoundarySamples.length,
    initializerPhase01,
    toneMode,
    toneLaw,
    resistancePartitionMode,
    largeArterialComplianceScale,
    toneUpdateWindowSec,
    offlineToneFixedPointAccelerationFactor:
      toneUpdateWindowSec / source.configuration.cycleLengthSec,
    phaseDefinition,
    topologyId: activePrior.topologyId,
    pressureVolumeStateCount:
      activePrior.claims.conservedVolumeNodeCount,
    signedEdgeCount:
      activePrior.claims.signedEdgeCount,
  }),
  initializer: initialized.diagnostics,
  runHealth: Object.freeze({
    maximumAbsoluteLedgerResidualMl: maximumLedgerResidualMl,
    minimumEdgeDissipatedPowerMmHgMlPerSec:
      minimumDissipatedPowerMmHgMlPerSec,
    allPassiveEdgesNonnegativePower:
      minimumDissipatedPowerMmHgMlPerSec >= -1e-12,
  }),
  finalSummary,
  beatSummaries: Object.freeze(beatSummaries),
  samples: retainedSamples,
});
mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(report)}\n`);
process.stdout.write(`${JSON.stringify({
  outputPath,
  initializer: report.initializer,
  runHealth: report.runHealth,
  finalSummary,
}, null, 2)}\n`);

function summarizeCycle(
  samples: readonly ShadowSample[],
  phase: PhaseDefinition,
  dt: number,
  prior: CoronaryTopologyPriorV2,
): unknown {
  const territory = Object.freeze(Object.fromEntries(
    CORONARY_TERRITORY_IDS_V2.map((territoryId) => [territoryId, Object.freeze({
      inlet: phaseLedger(
        samples,
        (sample) => sample.flowMlPerSec.inletByTerritory[territoryId],
        phase,
        dt,
      ),
      layers: Object.freeze(Object.fromEntries(
        CORONARY_LAYER_IDS_V2.map((layerId) => [layerId, Object.freeze({
          r1: phaseLedger(
            samples,
            (sample) => sample.flowMlPerSec
              .r1ByTerritoryLayer[territoryId][layerId],
            phase,
            dt,
          ),
          tissue: phaseLedger(
            samples,
            (sample) => sample.flowMlPerSec
              .tissueByTerritoryLayer[territoryId][layerId],
            phase,
            dt,
          ),
          r2: phaseLedger(
            samples,
            (sample) => sample.flowMlPerSec
              .r2ByTerritoryLayer[territoryId][layerId],
            phase,
            dt,
          ),
        })]),
      )),
    })]),
  )) as Readonly<Record<CoronaryTerritoryIdV2, unknown>>;
  const totalInlet = phaseLedger(
    samples,
    (sample) => sample.flowMlPerSec.totalInlet,
    phase,
    dt,
  );
  const commonVenousOutlet = phaseLedger(
    samples,
    (sample) => sample.flowMlPerSec.commonVenousOutlet,
    phase,
    dt,
  );
  const meanTissueFlowByLayer = Object.freeze(Object.fromEntries(
    CORONARY_TERRITORY_IDS_V2.map((territoryId) => [territoryId,
      Object.freeze(Object.fromEntries(CORONARY_LAYER_IDS_V2.map((layerId) => [
        layerId,
        mean(samples.map((sample) => sample.flowMlPerSec
          .tissueByTerritoryLayer[territoryId][layerId])) * 60,
      ]))),
    ]),
  )) as LayerNumbers;
  const endocardialToEpicardialTissueFlowRatio = copyTerritory(
    Object.fromEntries(CORONARY_TERRITORY_IDS_V2.map((territoryId) => [
      territoryId,
      meanTissueFlowByLayer[territoryId].subendocardial
        / meanTissueFlowByLayer[territoryId].subepicardial,
    ])) as TerritoryNumbers,
  );
  return Object.freeze({
    meanTotalInletMlPerMin: mean(samples.map(
      (sample) => sample.flowMlPerSec.totalInlet,
    )) * 60,
    massNormalizedMeanInletMlPerMinPerG:
      mean(samples.map((sample) => sample.flowMlPerSec.totalInlet)) * 60
      / prior.construction
        .referenceVentricularMyocardialMassG,
    totalInlet,
    commonVenousOutlet,
    territory,
    meanTissueFlowMlPerMinByTerritoryLayer: meanTissueFlowByLayer,
    endocardialToEpicardialTissueFlowRatio,
    maximumSolverResidualInfinityNormMl: Math.max(...samples.map(
      (sample) => sample.solver.residualInfinityNormMl,
    )),
    maximumNewtonIterations: Math.max(...samples.map(
      (sample) => sample.solver.newtonIterations,
    )),
  });
}

function acceptedLayerToneStep(
  samples: readonly ShadowSample[],
  acceptedWindowDurationSec: number,
  law: CoronaryAutoregulationLawV2,
  topologyPrior: CoronaryTopologyPriorV2,
): CoronaryAutoregulationAcceptedStepV2 {
  const meanTissueFlowMlPerSecByTerritoryLayer = Object.freeze(
    Object.fromEntries(CORONARY_TERRITORY_IDS_V2.map((territoryId) => [
      territoryId,
      Object.freeze(Object.fromEntries(CORONARY_LAYER_IDS_V2.map((layerId) => {
        const acceptedMean = mean(samples.map((sample) => sample.flowMlPerSec
          .tissueByTerritoryLayer[territoryId][layerId]));
        if (acceptedMean < 0) {
          throw new Error(
            `${territoryId}.${layerId} accepted mean Qm is negative`,
          );
        }
        return [layerId, acceptedMean];
      }))),
    ])),
  ) as LayerNumbers;
  const meanPerfusionPressureMmHgByTerritory = Object.freeze(
    Object.fromEntries(CORONARY_TERRITORY_IDS_V2.map((territoryId) => {
      const acceptedMean = mean(samples.map((sample) =>
        sample.absolutePressureMmHgByNode[`${territoryId}.Art`]
        - sample.absolutePressureMmHgByNode.CV));
      if (acceptedMean < 0) {
        throw new Error(`${territoryId} accepted mean Art-to-CV pressure is negative`);
      }
      return [territoryId, acceptedMean];
    })),
  ) as TerritoryNumbers;
  return stepCoronaryAutoregulationByTerritoryLayerV2(
    samples[0]!.toneResistanceScaleByTerritoryLayer,
    {
      meanTissueFlowMlPerSecByTerritoryLayer,
      meanPerfusionPressureMmHgByTerritory,
      demandScaleByTerritoryLayer: unitCoronaryDemandScaleV2(),
      hyperemia01ByTerritoryLayer: zeroCoronaryHyperemiaDriveV2(),
      acceptedWindowDurationSec,
    },
    { law, topologyPrior },
  );
}

function compactCycleSummary(samples: readonly ShadowSample[]): unknown {
  const meanTissueFlowMlPerMinByTerritoryLayer = Object.freeze(
    Object.fromEntries(CORONARY_TERRITORY_IDS_V2.map((territoryId) => [
      territoryId,
      Object.freeze(Object.fromEntries(CORONARY_LAYER_IDS_V2.map((layerId) => [
        layerId,
        mean(samples.map((sample) => sample.flowMlPerSec
          .tissueByTerritoryLayer[territoryId][layerId])) * 60,
      ]))),
    ])),
  ) as LayerNumbers;
  return Object.freeze({
    meanTotalInletMlPerMin: mean(samples.map(
      (sample) => sample.flowMlPerSec.totalInlet,
    )) * 60,
    endocardialToEpicardialTissueFlowRatio: copyTerritory(
      Object.fromEntries(CORONARY_TERRITORY_IDS_V2.map((territoryId) => [
        territoryId,
        meanTissueFlowMlPerMinByTerritoryLayer[territoryId].subendocardial
          / meanTissueFlowMlPerMinByTerritoryLayer[territoryId].subepicardial,
      ])) as TerritoryNumbers,
    ),
  });
}

function toneStateClosure(
  start: LayerNumbers,
  end: LayerNumbers,
): Readonly<{
  maximumAbsoluteLogResistanceScaleChange: number;
  maximumRelativeResistanceScaleChange01: number;
}> {
  let maximumAbsoluteLogResistanceScaleChange = 0;
  let maximumRelativeResistanceScaleChange01 = 0;
  for (const territoryId of CORONARY_TERRITORY_IDS_V2) {
    for (const layerId of CORONARY_LAYER_IDS_V2) {
      maximumAbsoluteLogResistanceScaleChange = Math.max(
        maximumAbsoluteLogResistanceScaleChange,
        Math.abs(Math.log(end[territoryId][layerId])
          - Math.log(start[territoryId][layerId])),
      );
      maximumRelativeResistanceScaleChange01 = Math.max(
        maximumRelativeResistanceScaleChange01,
        Math.abs(end[territoryId][layerId] - start[territoryId][layerId])
          / start[territoryId][layerId],
      );
    }
  }
  return Object.freeze({
    maximumAbsoluteLogResistanceScaleChange,
    maximumRelativeResistanceScaleChange01,
  });
}

function phaseLedger(
  samples: readonly ShadowSample[],
  read: (sample: ShadowSample) => number,
  phase: PhaseDefinition,
  dt: number,
): unknown {
  const systolic = samples.filter((sample) => isSystolic(
    sample.cyclePhase01,
    phase,
  ));
  const diastolic = samples.filter((sample) => !isSystolic(
    sample.cyclePhase01,
    phase,
  ));
  const ejection = samples.filter((sample) => isEjection(
    sample.cyclePhase01,
    phase,
  ));
  const earlyDiastolic = diastolic.filter((sample) =>
    cyclicElapsed(sample.cyclePhase01, phase.aorticClosurePhase01) < 0.2);
  const ledger = (subset: readonly ShadowSample[]) => {
    const values = subset.map(read);
    let peakForwardIndex: number | null = null;
    let peakReverseIndex: number | null = null;
    values.forEach((value, index) => {
      if (
        value > 0
        && (peakForwardIndex === null || value > values[peakForwardIndex]!)
      ) peakForwardIndex = index;
      if (
        value < 0
        && (peakReverseIndex === null || value < values[peakReverseIndex]!)
      ) peakReverseIndex = index;
    });
    return Object.freeze({
      durationSec: subset.length * dt,
      forwardVolumeMl: sum(values.map((value) => Math.max(0, value))) * dt,
      reverseVolumeMl: sum(values.map((value) => Math.max(0, -value))) * dt,
      reverseDurationSec: values.filter((value) => value < 0).length * dt,
      meanForwardFlowMlPerSec: mean(values.map((value) => Math.max(0, value))),
      peakForwardFlowMlPerSec: Math.max(0, ...values),
      peakReverseFlowMlPerSec: Math.max(0, ...values.map((value) => -value)),
      peakForwardPhase01: peakForwardIndex === null
        ? null
        : subset[peakForwardIndex]!.cyclePhase01,
      peakReversePhase01: peakReverseIndex === null
        ? null
        : subset[peakReverseIndex]!.cyclePhase01,
    });
  };
  const s = ledger(systolic);
  const d = ledger(diastolic);
  const ej = ledger(ejection);
  const early = ledger(earlyDiastolic);
  const totalForward = s.forwardVolumeMl + d.forwardVolumeMl;
  return Object.freeze({
    systole: s,
    diastole: d,
    ejection: ej,
    earlyDiastole: early,
    diastolicForwardVolumeFraction01:
      totalForward === 0 ? null : d.forwardVolumeMl / totalForward,
    peakDiastolicToSystolicForwardFlowRatio:
      s.peakForwardFlowMlPerSec === 0
        ? null
        : d.peakForwardFlowMlPerSec / s.peakForwardFlowMlPerSec,
    peakDiastolicToEjectionForwardFlowRatio:
      ej.peakForwardFlowMlPerSec === 0
        ? null
        : d.peakForwardFlowMlPerSec / ej.peakForwardFlowMlPerSec,
    diastolicToSystolicMeanNetFlowRatio:
      s.durationSec === 0
        || (s.forwardVolumeMl - s.reverseVolumeMl) === 0
        ? null
        : ((d.forwardVolumeMl - d.reverseVolumeMl) / d.durationSec)
          / ((s.forwardVolumeMl - s.reverseVolumeMl) / s.durationSec),
    earlyDiastolicForwardVolumeFractionOfDiastole01:
      d.forwardVolumeMl === 0
        ? null
        : early.forwardVolumeMl / d.forwardVolumeMl,
    diastolicForwardFlowCentroidAfterAorticClosureSec:
      d.forwardVolumeMl === 0
        ? null
        : sum(diastolic.map((sample) =>
          cyclicElapsed(sample.cyclePhase01, phase.aorticClosurePhase01)
          * Math.max(0, read(sample)) * dt)) / d.forwardVolumeMl,
    diastolicPeakDelayAfterAorticClosureSec:
      d.peakForwardPhase01 === null
        ? null
        : cyclicElapsed(
          d.peakForwardPhase01,
          phase.aorticClosurePhase01,
        ),
  });
}

function volumeClosure(
  start: CoronaryConservedVolumeRecordV2<number>,
  end: CoronaryConservedVolumeRecordV2<number>,
): unknown {
  let maximumAbsoluteMl = 0;
  let maximumRelative01 = 0;
  let signedTotalMl = 0;
  for (const nodeId of CORONARY_CONSERVED_VOLUME_NODE_IDS_V2) {
    const difference = end[nodeId] - start[nodeId];
    maximumAbsoluteMl = Math.max(maximumAbsoluteMl, Math.abs(difference));
    maximumRelative01 = Math.max(
      maximumRelative01,
      Math.abs(difference) / Math.max(Math.abs(start[nodeId]), 1e-12),
    );
    signedTotalMl += difference;
  }
  return Object.freeze({ maximumAbsoluteMl, maximumRelative01, signedTotalMl });
}

function rotateCycleAtPhase(
  samples: readonly SourceSample[],
  startPhase01: number,
): readonly SourceSample[] {
  const sorted = [...samples].sort((a, b) => a.cyclePhase01 - b.cyclePhase01);
  let startIndex = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  sorted.forEach((sample, index) => {
    const distance = Math.abs(sample.cyclePhase01 - startPhase01);
    if (distance < bestDistance) {
      startIndex = index;
      bestDistance = distance;
    }
  });
  return Object.freeze([...sorted.slice(startIndex), ...sorted.slice(0, startIndex)]);
}

function toBoundary(sample: SourceSample): CoronaryHydraulicBoundaryInputV2 {
  return Object.freeze({
    absoluteAorticPressureMmHg: sample.pressureMmHg.Ao,
    absoluteRightAtrialPressureMmHg: sample.pressureMmHg.RA,
    perivascularExternalPressureMmHg:
      sample.pressureMmHg.perivascularExternal,
    intramyocardialPressureMmHgByTerritoryLayer:
      copyLayers(sample.pressureMmHg.intramyocardialByTerritoryLayer),
  });
}

function acceptedPhaseDefinition(sourceReport: SourceReport): PhaseDefinition {
  const definition = sourceReport.beatSummaries.at(-1)!.summary
    .phasicCoronaryFlow.phaseDefinition;
  if (
    !definition.eventSegmentationAccepted
    || definition.mitralClosurePhase01 === null
    || definition.aorticOpeningPhase01 === null
    || definition.aorticClosurePhase01 === null
  ) {
    throw new Error("source terminal beat lacks accepted MVC/AoVO/AoVC events");
  }
  return Object.freeze({
    mitralClosurePhase01: definition.mitralClosurePhase01,
    aorticOpeningPhase01: definition.aorticOpeningPhase01,
    aorticClosurePhase01: definition.aorticClosurePhase01,
  });
}

function validateSource(sourceReport: SourceReport): void {
  if (!sourceReport.completed || sourceReport.diagnosticsVersion < 2) {
    throw new Error("source report must be a completed diagnostics-v2 artifact");
  }
  if (sourceReport.samples.length < 100) {
    throw new Error("source report must retain a full terminal cycle");
  }
  if (
    !Number.isFinite(sourceReport.configuration.dtSec)
    || sourceReport.configuration.dtSec <= 0
    || sourceReport.configuration.cycleLengthSec !== 1
  ) {
    throw new Error("source report has an unsupported time base");
  }
  for (const sample of sourceReport.samples) {
    if (!Number.isFinite(sample.pressureMmHg.perivascularExternal)) {
      throw new Error("source report lacks perivascular external pressure");
    }
  }
}

function isSystolic(phase01: number, phase: PhaseDefinition): boolean {
  return phase.mitralClosurePhase01 <= phase.aorticClosurePhase01
    ? phase01 >= phase.mitralClosurePhase01
      && phase01 < phase.aorticClosurePhase01
    : phase01 >= phase.mitralClosurePhase01
      || phase01 < phase.aorticClosurePhase01;
}

function isEjection(phase01: number, phase: PhaseDefinition): boolean {
  return phase.aorticOpeningPhase01 <= phase.aorticClosurePhase01
    ? phase01 >= phase.aorticOpeningPhase01
      && phase01 < phase.aorticClosurePhase01
    : phase01 >= phase.aorticOpeningPhase01
      || phase01 < phase.aorticClosurePhase01;
}

function cyclicElapsed(phase01: number, eventPhase01: number): number {
  return ((phase01 - eventPhase01) % 1 + 1) % 1;
}

function copyTerritory(values: TerritoryNumbers): TerritoryNumbers {
  return Object.freeze(Object.fromEntries(CORONARY_TERRITORY_IDS_V2.map(
    (territoryId) => [territoryId, values[territoryId]],
  ))) as TerritoryNumbers;
}

function copyLayers(values: LayerNumbers): LayerNumbers {
  return Object.freeze(Object.fromEntries(CORONARY_TERRITORY_IDS_V2.map(
    (territoryId) => [territoryId, Object.freeze(Object.fromEntries(
      CORONARY_LAYER_IDS_V2.map((layerId: CoronaryLayerIdV2) => [
        layerId,
        values[territoryId][layerId],
      ]),
    ))],
  ))) as LayerNumbers;
}

function mean(values: readonly number[]): number {
  return values.length === 0 ? 0 : sum(values) / values.length;
}

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function argument(flag: string, fallback: string): string {
  const index = process.argv.indexOf(flag);
  return index < 0 ? fallback : path.resolve(process.argv[index + 1]!);
}

function numberArgument(flag: string, fallback: number): number {
  const index = process.argv.indexOf(flag);
  const value = index < 0 ? fallback : Number(process.argv[index + 1]);
  if (!Number.isFinite(value) || value < 0 || value >= 1) {
    throw new RangeError(`${flag} must lie in [0, 1)`);
  }
  return value;
}

function integerArgument(flag: string, fallback: number): number {
  const index = process.argv.indexOf(flag);
  const value = index < 0 ? fallback : Number(process.argv[index + 1]);
  if (!Number.isInteger(value) || value <= 0) {
    throw new RangeError(`${flag} must be a positive integer`);
  }
  return value;
}

function positiveNumberArgument(flag: string, fallback: number): number {
  const index = process.argv.indexOf(flag);
  const value = index < 0 ? fallback : Number(process.argv[index + 1]);
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${flag} must be positive and finite`);
  }
  return value;
}

function toneModeArgument(
  flag: string,
  fallback: "fixed" | "accepted-layer-autoregulation",
): "fixed" | "accepted-layer-autoregulation" {
  const index = process.argv.indexOf(flag);
  const value = index < 0 ? fallback : process.argv[index + 1];
  if (value !== "fixed" && value !== "accepted-layer-autoregulation") {
    throw new RangeError(
      `${flag} must be fixed or accepted-layer-autoregulation`,
    );
  }
  return value;
}

function toneLawArgument(
  flag: string,
  fallback: CoronaryAutoregulationLawV2,
): CoronaryAutoregulationLawV2 {
  const index = process.argv.indexOf(flag);
  const value = index < 0 ? fallback : process.argv[index + 1];
  if (value !== "leaky-target-v1" && value !== "integral-flow-homeostasis-v2") {
    throw new RangeError(
      `${flag} must be leaky-target-v1 or integral-flow-homeostasis-v2`,
    );
  }
  return value;
}

function resistancePartitionModeArgument(
  flag: string,
  fallback: "symmetric-60-30-10" | "chilian-directional-transmural",
): "symmetric-60-30-10" | "chilian-directional-transmural" {
  const index = process.argv.indexOf(flag);
  const value = index < 0 ? fallback : process.argv[index + 1];
  if (
    value !== "symmetric-60-30-10"
    && value !== "chilian-directional-transmural"
  ) {
    throw new RangeError(
      `${flag} must be symmetric-60-30-10 or chilian-directional-transmural`,
    );
  }
  return value;
}
