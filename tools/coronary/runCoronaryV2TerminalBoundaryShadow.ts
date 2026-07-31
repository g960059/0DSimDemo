import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  applyBeatingReferenceR1CalibrationV2,
  buildCoronaryTopologyV2,
  CHILIAN_1991_DIRECTIONAL_TRANSMURAL_REPARTITION_ABLATION_V2,
  NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V2,
  LOW_RM_70_15_15_REPARTITION_ABLATION_V2,
  redistributeCoronaryLargeArterialPressureDropToR1V2,
  repartitionCoronaryMicrovascularResistanceV2,
  scaleCoronaryIntramyocardialComplianceV2,
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
  buildCoronaryCollapseHydraulicsPriorV2,
  disableCoronaryCollapseHydraulicsV2,
  initializePressureLadderCoronaryStateV2,
  solveCoronaryBackwardEulerTrialV2,
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
import {
  buildCoronaryV2ShorteningImpReference,
  fingerprintCoronaryV2ShadowBoundarySource,
  resolveCoronaryV2ShadowBoundary,
  snapshotCoronaryV2ShadowBoundary,
  validateCoronaryV2R1ReferenceNumerics,
  type CoronaryV2ShadowImpMechanism,
  type CoronaryV2ShadowPhaseDefinition,
  type CoronaryV2ShadowSourceSample,
} from "./coronaryV2ShadowProtocol";

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
const DEFAULT_R1_REFERENCE_REPORT_PATH = path.resolve(
  "data/myocardium/reports",
  "mainwire-coronary-v2-autoregulated-terminal-boundary-shadow-v1.json",
);

type TerritoryNumbers = CoronaryTerritoryRecordV2<number>;
type LayerNumbers = CoronaryTerritoryLayerRecordV2<number>;
type ResistancePartitionMode =
  | "symmetric-60-30-10"
  | "chilian-directional-transmural"
  | "low-rm-70-15-15-ablation";

type SourceSample = CoronaryV2ShadowSourceSample;

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

type R1ReferenceSourceReport = Readonly<{
  completed: boolean;
  configuration: Readonly<{
    sourceSchema: string;
    dtSec: number;
    cycleLengthSec: number;
    requestedBeatCount?: number;
    toneLaw?: string;
    toneUpdateWindowSec?: number;
    boundaryFingerprint?: string;
    toneMode: string;
    resistancePartitionMode: string;
    largeArterialComplianceScale: number;
    largeArterialPressureDropFraction01?: number;
    intramyocardialC1ComplianceScale?: number;
    intramyocardialC2ComplianceScale?: number;
    r1ReferenceMode?: string;
    impMechanism?: string;
    collapseMode?: string;
    collapseResidualHydraulicAreaFraction?: number;
  }>;
  finalSummary: Readonly<{
    closure: Readonly<{
      maximumAbsoluteMl: number;
      maximumRelative01: number;
    }>;
    toneResistanceScaleByTerritoryLayer: LayerNumbers;
    toneClosure: Readonly<{
      maximumAbsoluteLogResistanceScaleChange: number;
    }>;
    summary: Readonly<{
      maximumSolverResidualInfinityNormMl: number;
    }>;
    toneStep: CoronaryAutoregulationAcceptedStepV2;
  }>;
  runHealth: Readonly<{
    maximumAbsoluteLedgerResidualMl: number;
    minimumEdgeDissipatedPowerMmHgMlPerSec: number;
    allPassiveEdgesNonnegativePower: boolean;
  }>;
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
    /** Ao-to-Art proximal inlet, before the territory Art compliance. */
    inletByTerritory: TerritoryNumbers;
    /** Sum of the two R1 branches leaving the territory Art compliance. */
    largeArterialOutflowByTerritory: TerritoryNumbers;
    /** Exact Art storage rate: proximal inlet minus distal lumped outflow. */
    largeArterialStorageRateByTerritory: TerritoryNumbers;
    r1ByTerritoryLayer: LayerNumbers;
    qmInternalByTerritoryLayer: LayerNumbers;
    /** @deprecated Use qmInternalByTerritoryLayer. */
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

type PhaseDefinition = CoronaryV2ShadowPhaseDefinition;

const sourcePath = argument("--source", DEFAULT_SOURCE_PATH);
const outputPath = argument("--output", DEFAULT_OUTPUT_PATH);
const r1ReferenceReportPath = argument(
  "--r1-reference-report",
  DEFAULT_R1_REFERENCE_REPORT_PATH,
);
const beatCount = integerArgument("--beats", 20);
const toneMode = toneModeArgument("--tone-mode", "fixed");
const r1ReferenceMode = r1ReferenceModeArgument(
  "--r1-reference-mode",
  "static-pressure-construction",
);
const impMechanism = impMechanismArgument(
  "--imp-mechanism",
  "source-cep-land-active",
);
const collapseMode = collapseModeArgument("--collapse-mode", "enabled");
const collapseResidualHydraulicAreaFraction = fractionArgument(
  "--collapse-residual-area-fraction",
  0.10,
);
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
const largeArterialPressureDropFraction01 = fractionArgument(
  "--large-arterial-pressure-drop-fraction",
  NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V2.construction
    .baselineResistancePartition.macroPathPressureDropFraction01.largeArterial,
);
const intramyocardialC1ComplianceScale = positiveNumberArgument(
  "--intramyocardial-c1-compliance-scale",
  1,
);
const intramyocardialC2ComplianceScale = positiveNumberArgument(
  "--intramyocardial-c2-compliance-scale",
  1,
);
const initializerPhase01 = numberArgument("--initializer-phase", 0.50);
const source = JSON.parse(readFileSync(sourcePath, "utf8")) as SourceReport;
validateSource(source);
const dtSec = source.configuration.dtSec;
const phaseDefinition = acceptedPhaseDefinition(source);
const shorteningImpReference = impMechanism === "cep-shortening-induced"
  ? buildCoronaryV2ShorteningImpReference(source, phaseDefinition)
  : null;
const boundaryFingerprint = fingerprintCoronaryV2ShadowBoundarySource(
  source,
  Object.freeze({
    phaseDefinition,
    impMechanism,
    shorteningReference: shorteningImpReference,
  }),
);
const resistancePrior = resistancePartitionMode === "symmetric-60-30-10"
  ? NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V2
  : repartitionCoronaryMicrovascularResistanceV2(
    NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V2,
    resistancePartitionMode === "chilian-directional-transmural"
      ? CHILIAN_1991_DIRECTIONAL_TRANSMURAL_REPARTITION_ABLATION_V2
      : LOW_RM_70_15_15_REPARTITION_ABLATION_V2,
  );
const intramyocardialCompliancePrior = (
  intramyocardialC1ComplianceScale === 1
  && intramyocardialC2ComplianceScale === 1
)
  ? resistancePrior
  : scaleCoronaryIntramyocardialComplianceV2(resistancePrior, {
    c1Proximal: intramyocardialC1ComplianceScale,
    c2Distal: intramyocardialC2ComplianceScale,
  });
const compliancePrior = largeArterialComplianceScale === 1
  ? intramyocardialCompliancePrior
  : scaleCoronaryLargeArterialComplianceV2(
    intramyocardialCompliancePrior,
    largeArterialComplianceScale,
  );
const baselineLargeArterialPressureDropFraction01 =
  NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V2.construction
    .baselineResistancePartition.macroPathPressureDropFraction01.largeArterial;
const pressureDropPlacementPrior =
  largeArterialPressureDropFraction01
    === baselineLargeArterialPressureDropFraction01
    ? compliancePrior
    : redistributeCoronaryLargeArterialPressureDropToR1V2(
      compliancePrior,
      largeArterialPressureDropFraction01,
    );
const r1ReferenceCalibration = r1ReferenceMode === "rebased-accepted-tone"
  ? calibrationFromAcceptedToneReport(
    r1ReferenceReportPath,
    source,
    boundaryFingerprint,
    resistancePartitionMode,
    largeArterialComplianceScale,
    largeArterialPressureDropFraction01,
    intramyocardialC1ComplianceScale,
    intramyocardialC2ComplianceScale,
    impMechanism,
    collapseMode,
    collapseResidualHydraulicAreaFraction,
  )
  : null;
const activePrior = r1ReferenceCalibration === null
  ? pressureDropPlacementPrior
  : applyBeatingReferenceR1CalibrationV2(
    pressureDropPlacementPrior,
    r1ReferenceCalibration.descriptor,
  );
const activeTopology = buildCoronaryTopologyV2(activePrior);
const enabledCollapseHydraulics = buildCoronaryCollapseHydraulicsPriorV2(
  activeTopology,
  collapseResidualHydraulicAreaFraction,
);
const collapseHydraulics = collapseMode === "enabled"
  ? enabledCollapseHydraulics
  : disableCoronaryCollapseHydraulicsV2(
    enabledCollapseHydraulics,
    activeTopology,
  );
const toneUpdateWindowSec = positiveNumberArgument(
  "--tone-update-window-sec",
  source.configuration.cycleLengthSec,
);
const orderedBoundarySamples = rotateCycleAtPhase(
  source.samples,
  initializerPhase01,
);
// The initializer owns the state at orderedBoundarySamples[0]. Each BE input
// is the boundary at the end of the following step; replaying sample 0 first
// would duplicate the initializer phase and omit the closing phase interval.
const boundaryStepEndSamples = Object.freeze([
  ...orderedBoundarySamples.slice(1),
  orderedBoundarySamples[0]!,
]);
const firstBoundary = resolveCoronaryV2ShadowBoundary(
  orderedBoundarySamples[0]!,
  impMechanism,
  shorteningImpReference,
);
const initialized = initializePressureLadderCoronaryStateV2({
  boundary: firstBoundary,
  collapseHydraulics,
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
  for (const boundarySample of boundaryStepEndSamples) {
    const boundary = resolveCoronaryV2ShadowBoundary(
      boundarySample,
      impMechanism,
      shorteningImpReference,
    );
    const trial = solveCoronaryBackwardEulerTrialV2(state, {
      dtSec,
      boundary,
      collapseHydraulics,
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
      boundaryPressureMmHg: snapshotCoronaryV2ShadowBoundary(boundary),
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
        largeArterialOutflowByTerritory: copyTerritory(
          hydraulics.largeArterialOutflowMlPerSecByTerritory,
        ),
        largeArterialStorageRateByTerritory: copyTerritory(
          hydraulics.largeArterialStorageRateMlPerSecByTerritory,
        ),
        r1ByTerritoryLayer: copyLayers(
          hydraulics.layerR1FlowMlPerSecByTerritory,
        ),
        qmInternalByTerritoryLayer: copyLayers(
          hydraulics.layerQmInternalFlowMlPerSecByTerritory,
        ),
        tissueByTerritoryLayer: copyLayers(
          hydraulics.layerQmInternalFlowMlPerSecByTerritory,
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
    source.configuration.cycleLengthSec,
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
    structuralR1ReferenceRebased:
      r1ReferenceMode === "rebased-accepted-tone",
    waveformObjectiveUsedForR1Reference: false as const,
    instantaneousQmIsDirectTissuePerfusionObservable: false as const,
    periodicMeanQmEqualsLayerPerfusionByStorageClosure: true as const,
  }),
  configuration: Object.freeze({
    sourcePath: repositoryRelativePath(sourcePath),
    sourceSchema: source.schema,
    sourceTerminalBeatIndex: source.beatSummaries.at(-1)!.beatIndex,
    dtSec,
    cycleLengthSec: source.configuration.cycleLengthSec,
    requestedBeatCount: beatCount,
    sourceSampleCountPerCycle: orderedBoundarySamples.length,
    backwardEulerBoundaryConvention:
      "initializer-at-sample-0-boundary-at-next-step-end" as const,
    boundaryFingerprint,
    initializerPhase01,
    toneMode,
    toneLaw,
    resistancePartitionMode,
    largeArterialComplianceScale,
    largeArterialPressureDropFraction01,
    intramyocardialC1ComplianceScale,
    intramyocardialC2ComplianceScale,
    r1ReferenceMode,
    r1ReferenceReportPath:
      r1ReferenceMode === "rebased-accepted-tone"
        ? repositoryRelativePath(r1ReferenceReportPath)
        : null,
    r1ReferenceCalibration,
    impMechanism,
    shorteningImpReference,
    collapseMode,
    collapseResidualHydraulicAreaFraction,
    toneUpdateWindowSec,
    offlineToneFixedPointAccelerationFactor:
      toneUpdateWindowSec / source.configuration.cycleLengthSec,
    phaseDefinition,
    flowSemantics: Object.freeze({
      territoryInlet:
        "aorta-to-lumped-epicardial-prearterial-reservoir" as const,
      territoryLargeArterialOutflow:
        "sum-of-r1-branches-at-distal-lumped-reservoir-boundary" as const,
      territoryLargeArterialStorageRate:
        "territory-inlet-minus-large-arterial-outflow" as const,
      q1: "intramyocardial-arteriolar-inflow" as const,
      qm: "hidden-c1-to-c2-reservoir-transfer" as const,
      q2: "intramyocardial-venular-extrusion" as const,
    }),
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

function repositoryRelativePath(filePath: string): string {
  return path.relative(process.cwd(), filePath).split(path.sep).join("/");
}
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
  cycleLengthSec: number,
  prior: CoronaryTopologyPriorV2,
): unknown {
  const territory = Object.freeze(Object.fromEntries(
    CORONARY_TERRITORY_IDS_V2.map((territoryId) => [territoryId, Object.freeze({
      inlet: phaseLedger(
        samples,
        (sample) => sample.flowMlPerSec.inletByTerritory[territoryId],
        phase,
        dt,
        cycleLengthSec,
      ),
      largeArterialOutflow: phaseLedger(
        samples,
        (sample) => sample.flowMlPerSec
          .largeArterialOutflowByTerritory[territoryId],
        phase,
        dt,
        cycleLengthSec,
      ),
      largeArterialStorageRate: phaseLedger(
        samples,
        (sample) => sample.flowMlPerSec
          .largeArterialStorageRateByTerritory[territoryId],
        phase,
        dt,
        cycleLengthSec,
      ),
      layers: Object.freeze(Object.fromEntries(
        CORONARY_LAYER_IDS_V2.map((layerId) => [layerId, Object.freeze({
          r1: phaseLedger(
            samples,
            (sample) => sample.flowMlPerSec
              .r1ByTerritoryLayer[territoryId][layerId],
            phase,
            dt,
            cycleLengthSec,
          ),
          qmInternal: phaseLedger(
            samples,
            (sample) => sample.flowMlPerSec
              .qmInternalByTerritoryLayer[territoryId][layerId],
            phase,
            dt,
            cycleLengthSec,
          ),
          tissue: phaseLedger(
            samples,
            (sample) => sample.flowMlPerSec
              .qmInternalByTerritoryLayer[territoryId][layerId],
            phase,
            dt,
            cycleLengthSec,
          ),
          r2: phaseLedger(
            samples,
            (sample) => sample.flowMlPerSec
              .r2ByTerritoryLayer[territoryId][layerId],
            phase,
            dt,
            cycleLengthSec,
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
    cycleLengthSec,
  );
  const commonVenousOutlet = phaseLedger(
    samples,
    (sample) => sample.flowMlPerSec.commonVenousOutlet,
    phase,
    dt,
    cycleLengthSec,
  );
  const meanQmInternalFlowByLayer = Object.freeze(Object.fromEntries(
    CORONARY_TERRITORY_IDS_V2.map((territoryId) => [territoryId,
      Object.freeze(Object.fromEntries(CORONARY_LAYER_IDS_V2.map((layerId) => [
        layerId,
        mean(samples.map((sample) => sample.flowMlPerSec
          .qmInternalByTerritoryLayer[territoryId][layerId])) * 60,
      ]))),
    ]),
  )) as LayerNumbers;
  const endocardialToEpicardialMeanQmInternalRatio = copyTerritory(
    Object.fromEntries(CORONARY_TERRITORY_IDS_V2.map((territoryId) => [
      territoryId,
      meanQmInternalFlowByLayer[territoryId].subendocardial
        / meanQmInternalFlowByLayer[territoryId].subepicardial,
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
    meanQmInternalFlowMlPerMinByTerritoryLayer: meanQmInternalFlowByLayer,
    /** @deprecated Mean Qm is not an instantaneous tissue-flow observable. */
    meanTissueFlowMlPerMinByTerritoryLayer: meanQmInternalFlowByLayer,
    endocardialToEpicardialMeanQmInternalRatio,
    /** @deprecated Use endocardialToEpicardialMeanQmInternalRatio. */
    endocardialToEpicardialTissueFlowRatio:
      endocardialToEpicardialMeanQmInternalRatio,
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
          .qmInternalByTerritoryLayer[territoryId][layerId]));
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
  const meanQmInternalFlowMlPerMinByTerritoryLayer = Object.freeze(
    Object.fromEntries(CORONARY_TERRITORY_IDS_V2.map((territoryId) => [
      territoryId,
      Object.freeze(Object.fromEntries(CORONARY_LAYER_IDS_V2.map((layerId) => [
        layerId,
        mean(samples.map((sample) => sample.flowMlPerSec
          .qmInternalByTerritoryLayer[territoryId][layerId])) * 60,
      ]))),
    ])),
  ) as LayerNumbers;
  const endocardialToEpicardialMeanQmInternalRatio = copyTerritory(
    Object.fromEntries(CORONARY_TERRITORY_IDS_V2.map((territoryId) => [
      territoryId,
      meanQmInternalFlowMlPerMinByTerritoryLayer[territoryId].subendocardial
        / meanQmInternalFlowMlPerMinByTerritoryLayer[territoryId].subepicardial,
    ])) as TerritoryNumbers,
  );
  return Object.freeze({
    meanTotalInletMlPerMin: mean(samples.map(
      (sample) => sample.flowMlPerSec.totalInlet,
    )) * 60,
    endocardialToEpicardialMeanQmInternalRatio,
    /** @deprecated Use endocardialToEpicardialMeanQmInternalRatio. */
    endocardialToEpicardialTissueFlowRatio:
      endocardialToEpicardialMeanQmInternalRatio,
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
  cycleLengthSec: number,
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
    cyclicElapsed(sample.cyclePhase01, phase.aorticClosurePhase01)
      * cycleLengthSec < 0.2);
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
  const diastolicForwardOnsetDelaySec = Math.min(
    ...diastolic
      .filter((sample) => read(sample) > 0)
      .map((sample) => cyclicElapsed(
        sample.cyclePhase01,
        phase.aorticClosurePhase01,
      ) * cycleLengthSec),
  );
  const systolicPeakAtMitralClosureBoundary =
    s.peakForwardPhase01 === null
      ? null
      : sameCyclicSamplePhase(
        s.peakForwardPhase01,
        phase.mitralClosurePhase01,
        dt,
        cycleLengthSec,
      );
  const ejectionPeakAtIntervalBoundary =
    ej.peakForwardPhase01 === null
      ? null
      : sameCyclicSamplePhase(
        ej.peakForwardPhase01,
        phase.aorticOpeningPhase01,
        dt,
        cycleLengthSec,
      ) || sameCyclicSamplePhase(
        ej.peakForwardPhase01,
        phase.aorticClosurePhase01,
        dt,
        cycleLengthSec,
      );
  const diastolicPeakDelaySec = d.peakForwardPhase01 === null
    ? null
    : cyclicElapsed(
      d.peakForwardPhase01,
      phase.aorticClosurePhase01,
    ) * cycleLengthSec;
  const peakDiastolicToFullSystoleForwardFlowRatio =
    s.peakForwardFlowMlPerSec === 0
      ? null
      : d.peakForwardFlowMlPerSec / s.peakForwardFlowMlPerSec;
  const diastolicToFullSystoleMeanNetFlowRatio =
    s.durationSec === 0
      || (s.forwardVolumeMl - s.reverseVolumeMl) === 0
      ? null
      : ((d.forwardVolumeMl - d.reverseVolumeMl) / d.durationSec)
        / ((s.forwardVolumeMl - s.reverseVolumeMl) / s.durationSec);
  return Object.freeze({
    systole: s,
    diastole: d,
    ejection: ej,
    earlyDiastole: early,
    diastolicForwardVolumeFraction01:
      totalForward === 0 ? null : d.forwardVolumeMl / totalForward,
    peakDiastolicToFullSystoleForwardFlowRatio,
    /** @deprecated Use peakDiastolicToFullSystoleForwardFlowRatio. */
    peakDiastolicToSystolicForwardFlowRatio:
      peakDiastolicToFullSystoleForwardFlowRatio,
    peakDiastolicToEjectionForwardFlowRatio:
      ej.peakForwardFlowMlPerSec === 0
        ? null
        : d.peakForwardFlowMlPerSec / ej.peakForwardFlowMlPerSec,
    peakDiastolicToFullSystoleDenominatorAtMitralClosureBoundary:
      systolicPeakAtMitralClosureBoundary,
    peakDiastolicToEjectionDenominatorAtIntervalBoundary:
      ejectionPeakAtIntervalBoundary,
    diastolicToFullSystoleMeanNetFlowRatio,
    /** @deprecated Use diastolicToFullSystoleMeanNetFlowRatio. */
    diastolicToSystolicMeanNetFlowRatio:
      diastolicToFullSystoleMeanNetFlowRatio,
    earlyDiastolicForwardVolumeFractionOfDiastole01:
      d.forwardVolumeMl === 0
        ? null
        : early.forwardVolumeMl / d.forwardVolumeMl,
    diastolicForwardFlowCentroidAfterAorticClosureSec:
      d.forwardVolumeMl === 0
        ? null
        : sum(diastolic.map((sample) =>
          cyclicElapsed(sample.cyclePhase01, phase.aorticClosurePhase01)
          * cycleLengthSec
          * Math.max(0, read(sample)) * dt)) / d.forwardVolumeMl,
    diastolicForwardFlowOnsetDelayAfterAorticClosureSec:
      Number.isFinite(diastolicForwardOnsetDelaySec)
        ? diastolicForwardOnsetDelaySec
        : null,
    diastolicPeakDelayAfterForwardFlowOnsetSec:
      diastolicPeakDelaySec === null
        || !Number.isFinite(diastolicForwardOnsetDelaySec)
        ? null
        : Math.max(0, diastolicPeakDelaySec - diastolicForwardOnsetDelaySec),
    diastolicPeakDelayAfterAorticClosureSec: diastolicPeakDelaySec,
  });
}

function sameCyclicSamplePhase(
  leftPhase01: number,
  rightPhase01: number,
  dtSec: number,
  cycleLengthSec: number,
): boolean {
  const cyclicDistance01 = Math.min(
    cyclicElapsed(leftPhase01, rightPhase01),
    cyclicElapsed(rightPhase01, leftPhase01),
  );
  return cyclicDistance01 * cycleLengthSec <= 0.5 * dtSec + 1e-12;
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

function calibrationFromAcceptedToneReport(
  reportPath: string,
  sourceReport: SourceReport,
  boundaryFingerprint: string,
  resistancePartitionMode: ResistancePartitionMode,
  largeArterialComplianceScale: number,
  largeArterialPressureDropFraction01: number,
  intramyocardialC1ComplianceScale: number,
  intramyocardialC2ComplianceScale: number,
  impMechanism: CoronaryV2ShadowImpMechanism,
  collapseMode: "enabled" | "disabled-mechanism-ablation",
  collapseResidualHydraulicAreaFraction: number,
) {
  const report = JSON.parse(
    readFileSync(reportPath, "utf8"),
  ) as R1ReferenceSourceReport;
  if (
    !report.completed
    || report.configuration.toneMode !== "accepted-layer-autoregulation"
    || report.configuration.sourceSchema !== sourceReport.schema
    || report.configuration.dtSec !== sourceReport.configuration.dtSec
    || report.configuration.cycleLengthSec
      !== sourceReport.configuration.cycleLengthSec
    || report.configuration.boundaryFingerprint !== boundaryFingerprint
    || report.configuration.resistancePartitionMode
      !== resistancePartitionMode
    || report.configuration.largeArterialComplianceScale
      !== largeArterialComplianceScale
    || (report.configuration.largeArterialPressureDropFraction01 ?? 0.25)
      !== largeArterialPressureDropFraction01
    || (report.configuration.intramyocardialC1ComplianceScale ?? 1)
      !== intramyocardialC1ComplianceScale
    || (report.configuration.intramyocardialC2ComplianceScale ?? 1)
      !== intramyocardialC2ComplianceScale
    || (report.configuration.r1ReferenceMode ?? "static-pressure-construction")
      !== "static-pressure-construction"
    || (report.configuration.impMechanism ?? "source-cep-land-active")
      !== impMechanism
    || (report.configuration.collapseMode ?? "enabled") !== collapseMode
    || (report.configuration.collapseResidualHydraulicAreaFraction ?? 0.10)
      !== collapseResidualHydraulicAreaFraction
  ) {
    throw new Error("R1 reference report does not match the construction boundary");
  }
  const referenceNumericalAudit =
    validateCoronaryV2R1ReferenceNumerics(report);
  if (
    report.finalSummary.toneClosure.maximumAbsoluteLogResistanceScaleChange
      > 1e-3
  ) {
    throw new Error("R1 reference report has not converged its accepted tone");
  }
  const scale = copyLayers(
    report.finalSummary.toneResistanceScaleByTerritoryLayer,
  );
  return Object.freeze({
    source: Object.freeze({
      reportPath,
      sourceRequestedBeatCount:
        report.configuration.requestedBeatCount ?? null,
      sourceToneLaw: report.configuration.toneLaw ?? null,
      sourceToneUpdateWindowSec:
        report.configuration.toneUpdateWindowSec ?? null,
      sourceToneClosureMaximumAbsoluteLogChange:
        report.finalSummary.toneClosure
          .maximumAbsoluteLogResistanceScaleChange,
      sourceVolumeClosureMaximumRelative01:
        report.finalSummary.closure.maximumRelative01,
      sourceMaximumAbsoluteLedgerResidualMl:
        report.runHealth.maximumAbsoluteLedgerResidualMl,
      sourceMaximumSolverResidualInfinityNormMl:
        report.finalSummary.summary.maximumSolverResidualInfinityNormMl,
      sourceMinimumPassivePowerMmHgMlPerSec:
        report.runHealth.minimumEdgeDissipatedPowerMmHgMlPerSec,
      sourceMaximumRelativeMeanQmTargetError01:
        referenceNumericalAudit.maximumRelativeMeanQmTargetError01,
      sourceNonInteriorLayerCount:
        referenceNumericalAudit.nonInteriorLayerCount,
      algebraicIdentity:
        "R1_base*accepted_tone == R1_rebased*unit_tone" as const,
      provisionalFixedBoundaryOnly: true as const,
    }),
    descriptor: Object.freeze({
      calibrationId: "beating-reference-r1-mean-qm-v1" as const,
      proximalArteriolarScaleByTerritoryLayer: scale,
      boundaryFingerprint,
      calibrationToneResistanceScale: 1 as const,
      targetOwner: "mass-territory-layer-resting-flow-prior" as const,
      objective: "accepted-cycle-mean-qm-only" as const,
      waveformObjectiveUsed: false as const,
    }),
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
    for (const [name, value] of [
      ["LV", sample.pressureMmHg.LV],
      ["RV", sample.pressureMmHg.RV],
      ["perivascular external", sample.pressureMmHg.perivascularExternal],
    ] as const) {
      if (!Number.isFinite(value)) {
        throw new Error(`source report lacks finite ${name} pressure`);
      }
    }
    for (const wallId of ["LVFW", "SEP", "RVFW"] as const) {
      if (
        !Number.isFinite(
          sample.mechanics?.effectiveFiberLogStrainByWall?.[wallId],
        )
      ) {
        throw new Error(
          `source report lacks finite ${wallId} effective fiber log strain`,
        );
      }
    }
    for (const chamberId of ["LV", "RV"] as const) {
      if (
        !Number.isFinite(
          sample.mechanics?.chamberTransmuralPressureMmHg?.[chamberId],
        )
      ) {
        throw new Error(
          `source report lacks finite ${chamberId} chamber transmural pressure`,
        );
      }
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

function fractionArgument(flag: string, fallback: number): number {
  const index = process.argv.indexOf(flag);
  const value = index < 0 ? fallback : Number(process.argv[index + 1]);
  if (!Number.isFinite(value) || value <= 0 || value >= 1) {
    throw new RangeError(`${flag} must lie in (0, 1)`);
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

function r1ReferenceModeArgument(
  flag: string,
  fallback: "static-pressure-construction" | "rebased-accepted-tone",
): "static-pressure-construction" | "rebased-accepted-tone" {
  const index = process.argv.indexOf(flag);
  const value = index < 0 ? fallback : process.argv[index + 1];
  if (
    value !== "static-pressure-construction"
    && value !== "rebased-accepted-tone"
  ) {
    throw new RangeError(
      `${flag} must be static-pressure-construction or rebased-accepted-tone`,
    );
  }
  return value;
}

function impMechanismArgument(
  flag: string,
  fallback: CoronaryV2ShadowImpMechanism,
): CoronaryV2ShadowImpMechanism {
  const index = process.argv.indexOf(flag);
  const value = index < 0 ? fallback : process.argv[index + 1];
  if (
    value !== "source-cep-land-active"
    && value !== "cep-only-control"
    && value !== "cep-shortening-induced"
  ) {
    throw new RangeError(
      `${flag} must be source-cep-land-active, cep-only-control, or cep-shortening-induced`,
    );
  }
  return value;
}

function collapseModeArgument(
  flag: string,
  fallback: "enabled" | "disabled-mechanism-ablation",
): "enabled" | "disabled-mechanism-ablation" {
  const index = process.argv.indexOf(flag);
  const value = index < 0 ? fallback : process.argv[index + 1];
  if (value !== "enabled" && value !== "disabled-mechanism-ablation") {
    throw new RangeError(
      `${flag} must be enabled or disabled-mechanism-ablation`,
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
  fallback: ResistancePartitionMode,
): ResistancePartitionMode {
  const index = process.argv.indexOf(flag);
  const value = index < 0 ? fallback : process.argv[index + 1];
  if (
    value !== "symmetric-60-30-10"
    && value !== "chilian-directional-transmural"
    && value !== "low-rm-70-15-15-ablation"
  ) {
    throw new RangeError(
      `${flag} must be symmetric-60-30-10, chilian-directional-transmural, or low-rm-70-15-15-ablation`,
    );
  }
  return value;
}
