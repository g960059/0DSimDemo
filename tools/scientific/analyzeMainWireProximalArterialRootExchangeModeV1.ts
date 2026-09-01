import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  vascularPvLawFromNodeV1,
} from "@/engine/core/circulationGraphKernelV1";
import {
  MAIN_WIRE_SELECTED_AORTIC_OUTFLOW_CIRCULATION_PROFILE_V1,
} from "@/engine/core/MainWireSelectedAorticOutflowCirculationProfileV1";
import { buildEdges, buildNodes } from "@/engine/core/topology";
import {
  MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
} from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";
import { complianceFromPtm } from "@/engine/vascularPv";

export const MAIN_WIRE_PROXIMAL_ARTERIAL_ROOT_EXCHANGE_MODE_ANALYSIS_V1_ID =
  "main-wire-proximal-arterial-root-exchange-mode-analysis-v1" as const;

const inputPath = path.resolve(argument(
  "--input",
  "artifacts/proximal-root-ablation/standard66-source-inertance.json",
));
const outputPath = path.resolve(argument(
  "--output",
  "artifacts/proximal-root-ablation/root-exchange-mode-analysis.json",
));
const artifact = readArtifact(inputPath);
const context = artifact.protocol.researchContext?.hemodynamicResearchInputs
  ?? MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3;
if (
  artifact.construction.selectedAorticOutflow !== true
  || artifact.construction.proximalRootResearchProfile !== null
) {
  throw new Error(
    "root exchange-mode analysis requires selected Standard66 source inertance",
  );
}
if (context.peepCmH2O !== 0) {
  throw new Error(
    "V1 root exchange-mode analysis is restricted to zero-PEEP baseline",
  );
}

const nodes = buildNodes();
const edges = buildEdges();
const selected = MAIN_WIRE_SELECTED_AORTIC_OUTFLOW_CIRCULATION_PROFILE_V1;
const aorticEdge = requiredEdge("Ao_SA");
const pulmonaryEdge = requiredEdge("PA_PArt");
const cycleDurationSec = artifact.terminal.cycleDurationSec;
const aorticMeanFlowEstimateMlPerSec =
  artifact.terminal.valve.AoV.forwardVolumeMl / cycleDurationSec;
const pulmonaryMeanFlowEstimateMlPerSec =
  artifact.terminal.valve.PV.forwardVolumeMl / cycleDurationSec;
const aorticResistanceMmHgSecPerMl =
  selected.residualDownstreamResistanceMmHgSecPerMl
    * context.systemicResistance;
const pulmonaryResistanceMmHgSecPerMl =
  pulmonaryEdge.R * context.pulmonaryResistance;
const aorticUpstreamMeanPressureMmHg =
  artifact.terminal.pressure.AoNode.timeWeightedMean;
const pulmonaryUpstreamMeanPressureMmHg =
  artifact.terminal.pressure.PAP.timeWeightedMean;
const aorticDownstreamMeanPressureEstimateMmHg =
  aorticUpstreamMeanPressureMmHg
    - aorticResistanceMmHgSecPerMl * aorticMeanFlowEstimateMlPerSec;
const pulmonaryDownstreamMeanPressureEstimateMmHg =
  pulmonaryUpstreamMeanPressureMmHg
    - pulmonaryResistanceMmHgSecPerMl * pulmonaryMeanFlowEstimateMlPerSec;
const vascular = Object.freeze({
  venousTone: context.venousTone,
  arterialStiffness: context.arterialStiffness,
  selectedAorticOutflowProfile: selected,
});

const aortic = exchangeMode({
  edgeId: "Ao_SA",
  upstreamNodeId: "Ao",
  downstreamNodeId: "SA",
  upstreamMeanTransmuralPressureMmHg: aorticUpstreamMeanPressureMmHg,
  downstreamMeanTransmuralPressureMmHg:
    aorticDownstreamMeanPressureEstimateMmHg,
  resistanceMmHgSecPerMl: aorticResistanceMmHgSecPerMl,
  inertanceMmHgSec2PerMl:
    selected.ascendingAorticInertanceMmHgSec2PerMl,
  observedOscillationPeriodSec: observedAorticPeriodSec(artifact),
});
const pulmonary = exchangeMode({
  edgeId: "PA_PArt",
  upstreamNodeId: "PA",
  downstreamNodeId: "PArt",
  upstreamMeanTransmuralPressureMmHg: pulmonaryUpstreamMeanPressureMmHg,
  downstreamMeanTransmuralPressureMmHg:
    pulmonaryDownstreamMeanPressureEstimateMmHg,
  resistanceMmHgSecPerMl: pulmonaryResistanceMmHgSecPerMl,
  inertanceMmHgSec2PerMl: pulmonaryEdge.L ?? 0,
  observedOscillationPeriodSec: observedPulmonaryPeriodSec(artifact),
});

const report = Object.freeze({
  artifactSchemaVersion: 1 as const,
  analysisId:
    MAIN_WIRE_PROXIMAL_ARTERIAL_ROOT_EXCHANGE_MODE_ANALYSIS_V1_ID,
  inputPath,
  sourceProtocol: artifact.protocol,
  linearization: Object.freeze({
    system:
      "C1*dP1/dt=-q; C2*dP2/dt=q; L*dq/dt+R*q=P1-P2" as const,
    pressureDifferenceEquation:
      "d2DeltaP/dt2+(R/L)*dDeltaP/dt+((1/C1+1/C2)/L)*DeltaP=0" as const,
    localComplianceEvaluatedAtCycleMeanPressure: true as const,
    downstreamMeanPressureInferredFromMeanResistiveDrop: true as const,
    aorticMeanRootFlowApproximation:
      "AoV forward volume per cycle; coronary diversion omitted" as const,
    pulmonaryMeanRootFlowApproximation:
      "PV forward volume per cycle" as const,
  }),
  root: Object.freeze({ aortic, pulmonary }),
  interpretationBoundary: Object.freeze({
    localTwoComplianceLinearizationOnly: true as const,
    downstreamNetworkAndVentricularCouplingOmitted: true as const,
    observedPeriodReadFromRawAcceptedEndpointMorphology: true as const,
    fittedParameterUsed: false as const,
    agreementDoesNotByItselfEstablishClinicalValidity: true as const,
  }),
});

mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify({
  outputPath,
  aortic,
  pulmonary,
})}\n`);

function exchangeMode(input: Readonly<{
  edgeId: "Ao_SA" | "PA_PArt";
  upstreamNodeId: "Ao" | "PA";
  downstreamNodeId: "SA" | "PArt";
  upstreamMeanTransmuralPressureMmHg: number;
  downstreamMeanTransmuralPressureMmHg: number;
  resistanceMmHgSecPerMl: number;
  inertanceMmHgSec2PerMl: number;
  observedOscillationPeriodSec: number;
}>) {
  if (!(input.inertanceMmHgSec2PerMl > 0)) {
    throw new Error(`${input.edgeId} inertance must be positive`);
  }
  const upstreamComplianceMlPerMmHg = complianceAtPressure(
    input.upstreamNodeId,
    input.upstreamMeanTransmuralPressureMmHg,
  );
  const downstreamComplianceMlPerMmHg = complianceAtPressure(
    input.downstreamNodeId,
    input.downstreamMeanTransmuralPressureMmHg,
  );
  const reciprocalComplianceSumMmHgPerMl =
    1 / upstreamComplianceMlPerMmHg
      + 1 / downstreamComplianceMlPerMmHg;
  const undampedAngularFrequencyRadPerSec = Math.sqrt(
    reciprocalComplianceSumMmHgPerMl / input.inertanceMmHgSec2PerMl,
  );
  const exponentialDecayRatePerSec =
    input.resistanceMmHgSecPerMl / (2 * input.inertanceMmHgSec2PerMl);
  const dampingRatio = exponentialDecayRatePerSec
    / undampedAngularFrequencyRadPerSec;
  const dampedAngularFrequencyRadPerSec = Math.sqrt(
    Math.max(
      0,
      undampedAngularFrequencyRadPerSec ** 2
        - exponentialDecayRatePerSec ** 2,
    ),
  );
  if (!(dampedAngularFrequencyRadPerSec > 0)) {
    throw new Error(`${input.edgeId} local exchange mode is not underdamped`);
  }
  const predictedDampedPeriodSec =
    2 * Math.PI / dampedAngularFrequencyRadPerSec;
  return Object.freeze({
    ...input,
    upstreamComplianceMlPerMmHg,
    downstreamComplianceMlPerMmHg,
    reciprocalComplianceSumMmHgPerMl,
    undampedAngularFrequencyRadPerSec,
    exponentialDecayRatePerSec,
    dampingRatio,
    dampedAngularFrequencyRadPerSec,
    predictedDampedPeriodSec,
    predictedHalfPeriodSec: predictedDampedPeriodSec / 2,
    predictedAmplitudeRatioAfterOnePeriod:
      Math.exp(-exponentialDecayRatePerSec * predictedDampedPeriodSec),
    observedToPredictedPeriodRatio:
      input.observedOscillationPeriodSec / predictedDampedPeriodSec,
    absolutePeriodDifferenceSec:
      input.observedOscillationPeriodSec - predictedDampedPeriodSec,
  });
}

function complianceAtPressure(
  nodeId: "Ao" | "SA" | "PA" | "PArt",
  pressureMmHg: number,
): number {
  const node = nodes.find((candidate) => candidate.name === nodeId);
  if (node === undefined) throw new Error(`${nodeId} node is missing`);
  return complianceFromPtm(
    vascularPvLawFromNodeV1(node, vascular),
    pressureMmHg,
  );
}

function observedAorticPeriodSec(artifactToRead: Artifact): number {
  const maxima = artifactToRead.terminal.morphology.aorticEjection.AoP.extrema
    .filter((extremum) => extremum.kind === "maximum");
  if (maxima.length < 2) {
    throw new Error("AoP morphology lacks two ejection maxima");
  }
  return maxima[1]!.timeSec - maxima[0]!.timeSec;
}

function observedPulmonaryPeriodSec(artifactToRead: Artifact): number {
  const maxima = artifactToRead.terminal.morphology.pulmonaryEjection.PAP.extrema
    .filter((extremum) => extremum.kind === "maximum");
  const reboundMaximumTimeSec = artifactToRead.terminal.morphology
    .pulmonaryArteryDiastolicRebound.reboundMaximumTimeSec;
  if (maxima.length < 1 || reboundMaximumTimeSec === null) {
    throw new Error("PAP morphology lacks systolic/rebound maxima");
  }
  return reboundMaximumTimeSec - maxima[0]!.timeSec;
}

function requiredEdge(edgeId: "Ao_SA" | "PA_PArt") {
  const edge = edges.find((candidate) => candidate.name === edgeId);
  if (edge === undefined) throw new Error(`${edgeId} edge is missing`);
  return edge;
}

type Artifact = Readonly<{
  construction: Readonly<{
    selectedAorticOutflow: boolean;
    proximalRootResearchProfile: unknown | null;
  }>;
  protocol: Readonly<{
    nominalDtSec: number;
    cycleCount: number;
    researchContext?: Readonly<{
      hemodynamicResearchInputs: typeof MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3;
    }> | null;
  }>;
  terminal: Readonly<{
    cycleDurationSec: number;
    pressure: Readonly<{
      AoNode: Readonly<{ timeWeightedMean: number }>;
      PAP: Readonly<{ timeWeightedMean: number }>;
    }>;
    valve: Readonly<{
      AoV: Readonly<{ forwardVolumeMl: number }>;
      PV: Readonly<{ forwardVolumeMl: number }>;
    }>;
    morphology: Readonly<{
      aorticEjection: Readonly<{
        AoP: Readonly<{
          extrema: readonly Readonly<{
            kind: "minimum" | "maximum";
            timeSec: number;
          }>[];
        }>;
      }>;
      pulmonaryEjection: Readonly<{
        PAP: Readonly<{
          extrema: readonly Readonly<{
            kind: "minimum" | "maximum";
            timeSec: number;
          }>[];
        }>;
      }>;
      pulmonaryArteryDiastolicRebound: Readonly<{
        reboundMaximumTimeSec: number | null;
      }>;
    }>;
  }>;
}>;

function readArtifact(filePath: string): Artifact {
  return JSON.parse(readFileSync(filePath, "utf8")) as Artifact;
}

function argument(name: string, fallback: string): string {
  const index = process.argv.indexOf(name);
  if (index < 0) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${name} requires a value`);
  return value;
}
