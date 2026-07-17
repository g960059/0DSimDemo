import { defaultParams } from "@/engine/core/params";
import {
  ACTIVE_NORMAL_OFFICIAL_TARGET_BLOOD_VOLUME_ML,
} from "@/engine/caseBaselines";
import {
  buildAuthoritativeCirculationGraphV1,
} from "@/engine/core/circulationGraphKernelV1";
import {
  buildNonCoronaryCirculationGraphV1,
  createInitialNonCoronaryCirculationStateV1,
  NON_CORONARY_CIRCULATION_SCOPE_V1,
  NON_CORONARY_CIRCULATION_NEWTON_POLICY_V1,
  type NonCoronaryCirculationRuntimeParamsV1,
  type NonCoronaryValveNameV1,
} from "@/engine/core/nonCoronaryCirculationBackwardEulerV1";
import { MV_PRESSURE_DEADBAND_MMHG } from "@/engine/core/topology";
import type { CoreRuntimeParams } from "@/engine/protocol";
import {
  mainWireQuasiSteadyOrificeValveParamsFromEdgeV1,
  type MainWireQuasiSteadyOrificeValveParamsV1,
} from "@/engine/mechanics2/valve/MainWireQuasiSteadyOrificeValveV1";
import {
  sanitizeForStableHash,
  stableCanonicalStringify,
  stableHash,
} from "@/engine/myocardium/kinematics/stableHash";

export const MAIN_WIRE_NORMAL_ADULT_CIRCULATION_CONFIGURATION_V1_ID =
  "main-wire-normal-adult-circulation-configuration-v1" as const;

export const MAIN_WIRE_NORMAL_ADULT_CIRCULATION_CONFIGURATION_CLAIM_V1 =
  Object.freeze({
    sourceTopologyOwner: "main-wire-buildNodes-buildEdges" as const,
    sourceRuntimeOwner: "defaultParams" as const,
    effectiveCirculationOwner:
      "main-wire-derived-noncoronary-experimental-backward-euler" as const,
    snapshotChangesNumericalConfiguration: false as const,
    officialMainWireTargetBloodVolumeApplied: false as const,
    nodeOverridesSupported: false as const,
    edgeOverridesSupported: false as const,
    coronaryCirculationIncluded: false as const,
    collapsibleTubeChiApplied: false as const,
    respiratoryOscillationApplied: false as const,
    dynamicValveFlowMemoryApplied: false as const,
    pulmonaryVenousOstialInertanceApplied: false as const,
    unsupportedConfigurationPolicy: "fail-closed" as const,
  });

type ValveScalarSnapshotV1 = Readonly<{
  referenceAreaCm2: number;
  maximumAreaCm2: number;
  physiologicalLeakAreaCm2: number;
  openingGainPerMmHg: number;
  openingTimeConstantSec: number;
  closingTimeConstantSec: number;
  openResistanceMmHgSecPerMl: number;
  sourceInertanceMmHgSec2PerMl: number;
  sourceQuadraticLossMmHgSec2PerMl2: number;
}>;

export type MainWireNormalAdultCirculationConfigurationSnapshotV1 = Readonly<{
  configurationId:
    typeof MAIN_WIRE_NORMAL_ADULT_CIRCULATION_CONFIGURATION_V1_ID;
  source: Readonly<{
    officialOperatingPoint: Readonly<{
      baselineId: "active-normal";
      fullGraphTargetBloodVolumeMl: 5600;
    }>;
    runtimeParameterSet: Readonly<{
      vascular: Readonly<{
        venousTone: number;
        arterialStiffness: number;
      }>;
      losses: Readonly<{
        systemicResistance: number;
        pulmonaryResistance: number;
      }>;
      respiratory: Readonly<{
        PEEP: number;
        Pth0: number;
        respAmpTh: number;
        respAmpAlv: number;
        respRate: number;
      }>;
      bloodVolumeLedger: Readonly<{
        projectTBV: true;
        bleedRateMlPerMin: 0;
        fluidRateMlPerMin: 0;
      }>;
      useChiResistance: boolean;
      coronaryEnabled: boolean;
      coronaryControls: Readonly<{
        resistanceScale: number;
        compressionScale: number;
        vasodilator01: number;
        reserveMaximum: number;
        stenosis01: Readonly<{ LAD: number; LCx: number; RCA: number }>;
      }>;
      valves: Readonly<Record<NonCoronaryValveNameV1, ValveScalarSnapshotV1>>;
      nodeOverridesPresent: false;
      edgeOverridesPresent: false;
    }>;
  }>;
  effective: Readonly<{
    runtime: NonCoronaryCirculationRuntimeParamsV1;
    topology: Readonly<{
      topologyId: string;
      nodes: readonly Readonly<Record<string, unknown>>[];
      edges: readonly Readonly<Record<string, unknown>>[];
      scope: typeof NON_CORONARY_CIRCULATION_SCOPE_V1;
    }>;
    valves: Readonly<Record<NonCoronaryValveNameV1, Readonly<{
      modelId: "main-wire-quasi-steady-orifice-valve-v1";
      acceptedMemory: "leaflet-opening-fraction-only";
      flowLaw: "algebraic-linear-plus-bernoulli";
      parameters: Readonly<MainWireQuasiSteadyOrificeValveParamsV1>;
      openingDriveDeadbandMmHg: number;
      sourceInertanceRecordedButNotApplied: number;
      sourceQuadraticLossRecordedButNotApplied: number;
    }>>>;
    numericalPolicy:
      typeof NON_CORONARY_CIRCULATION_NEWTON_POLICY_V1;
    pulmonaryVenousOstium: Readonly<{
      edgeName: "PVein_LA";
      effectiveKind: "resistive";
      resistanceMmHgSecPerMl: number;
      quadraticLossMmHgSec2PerMl2: number;
      sourceInertanceMmHgSec2PerMl: 0;
      inertanceApplied: false;
    }>;
    initialVolumeConstruction: Readonly<{
      method: "main-wire-node-x0-and-venous-pressure-laws";
      dependentBloodVolumeNode: "SV";
      coronaryNodeVolumesIncluded: false;
      nodeVolumesMl: Readonly<Record<string, number>>;
      coldSeedTotalBloodVolumeMl: number;
      officialTargetApplied: false;
      excludedCoronaryColdVolumeMl: number;
      officialTargetMinusExcludedColdSeedVolumeMl: number;
      coldSeedShortfallFromOfficialMinusExcludedColdSeedMl: number;
    }>;
  }>;
  exclusions: Readonly<{
    coronary: Readonly<{
      sourceEnabled: boolean;
      effectiveIncluded: false;
      reason: "noncoronary-sidecar-scope";
    }>;
    collapsibleTubeChi: Readonly<{
      sourceEnabled: false;
      effectiveApplied: false;
      reason: "requires-modelcore-pressure-and-activation-inputs";
    }>;
    respiration: Readonly<{
      sourceRatePerSec: number;
      effectiveRatePerSec: 0;
      sourceAmplitudesAreZero: true;
      reason: "fixed-no-respiratory-oscillation-protocol";
    }>;
    valveFlowMemory: Readonly<{
      sourceInertancesRecorded: true;
      effectiveApplied: false;
      reason: "quasi-steady-complementarity-valve-v1";
    }>;
  }>;
  claim: typeof MAIN_WIRE_NORMAL_ADULT_CIRCULATION_CONFIGURATION_CLAIM_V1;
}>;

export type MainWireNormalAdultCirculationConfigurationResolvedV1 = Readonly<{
  runtime: NonCoronaryCirculationRuntimeParamsV1;
  snapshot: MainWireNormalAdultCirculationConfigurationSnapshotV1;
  snapshotStableHash: string;
}>;

const VALVES = Object.freeze(["MV", "AoV", "TV", "PV"] as const);

/**
 * Materialize the exact main-wire-derived configuration used by the sidecar.
 * This is an evidence boundary, not a parameter adapter. Unsupported main-wire
 * features are rejected instead of being silently ignored.
 */
export function resolveMainWireNormalAdultCirculationConfigurationV1(
  source: CoreRuntimeParams = defaultParams(),
): MainWireNormalAdultCirculationConfigurationResolvedV1 {
  assertSupportedSourceConfiguration(source);
  const runtime = deepFreeze({
    vascular: {
      venousTone: source.venousTone,
      arterialStiffness: source.arterialStiffness,
    },
    losses: {
      systemicResistance: source.systemicResistance,
      pulmonaryResistance: source.pulmonaryResistance,
    },
    respiratory: {
      PEEP: source.PEEP,
      Pth0: source.Pth0,
      respAmpTh: 0,
      respAmpAlv: 0,
      respRate: 0,
    },
  }) as NonCoronaryCirculationRuntimeParamsV1;
  const graph = buildNonCoronaryCirculationGraphV1();
  const authoritativeGraph = buildAuthoritativeCirculationGraphV1();
  const includedNodeNames = new Set(graph.nodes.map((node) => node.name));
  const excludedCoronaryColdVolumeMl = authoritativeGraph.nodes
    .filter((node) => !includedNodeNames.has(node.name))
    .reduce((sum, node) => sum + node.x0, 0);
  const officialTargetMinusExcludedColdSeedVolumeMl =
    ACTIVE_NORMAL_OFFICIAL_TARGET_BLOOD_VOLUME_ML
      - excludedCoronaryColdVolumeMl;
  const sourceValves = valveRecord((valveName) => {
    return Object.freeze({
      referenceAreaCm2: valveSourceValue(source, valveName, "Aref"),
      maximumAreaCm2: valveSourceValue(source, valveName, "Amax"),
      physiologicalLeakAreaCm2: valveSourceValue(source, valveName, "Aleak"),
      openingGainPerMmHg: valveSourceValue(source, valveName, "kOpen"),
      openingTimeConstantSec: valveSourceValue(source, valveName, "tauOpen"),
      closingTimeConstantSec: valveSourceValue(source, valveName, "tauClose"),
      openResistanceMmHgSecPerMl: valveSourceValue(source, valveName, "R"),
      sourceInertanceMmHgSec2PerMl: valveSourceValue(source, valveName, "L"),
      sourceQuadraticLossMmHgSec2PerMl2: valveSourceValue(source, valveName, "B"),
    });
  });
  const effectiveValves = valveRecord((valveName) => {
    const edge = graph.edges[graph.edgeIndex.get(valveName)!]!;
    const params = mainWireQuasiSteadyOrificeValveParamsFromEdgeV1(edge);
    return Object.freeze({
      modelId: "main-wire-quasi-steady-orifice-valve-v1" as const,
      acceptedMemory: "leaflet-opening-fraction-only" as const,
      flowLaw: "algebraic-linear-plus-bernoulli" as const,
      parameters: params,
      openingDriveDeadbandMmHg:
        valveName === "MV" ? MV_PRESSURE_DEADBAND_MMHG : 0,
      sourceInertanceRecordedButNotApplied: edge.L ?? 0,
      sourceQuadraticLossRecordedButNotApplied: edge.B ?? 0,
    });
  });
  const initial = createInitialNonCoronaryCirculationStateV1({
    timeSec: 0,
    runtime,
  });
  const pvEdge = graph.edges[graph.edgeIndex.get("PVein_LA")!]!;
  const pvInertance = pvEdge.pvOstialInertanceL ?? pvEdge.L ?? 0;
  if (pvEdge.kind !== "resistive" || pvInertance !== 0) {
    throw new Error(
      "unsupported PVein_LA configuration: only zero-inertance resistive ostial flow is implemented",
    );
  }
  const snapshot = deepFreeze({
    configurationId: MAIN_WIRE_NORMAL_ADULT_CIRCULATION_CONFIGURATION_V1_ID,
    source: {
      officialOperatingPoint: {
        baselineId: "active-normal" as const,
        fullGraphTargetBloodVolumeMl:
          ACTIVE_NORMAL_OFFICIAL_TARGET_BLOOD_VOLUME_ML,
      },
      runtimeParameterSet: {
        vascular: {
          venousTone: source.venousTone,
          arterialStiffness: source.arterialStiffness,
        },
        losses: {
          systemicResistance: source.systemicResistance,
          pulmonaryResistance: source.pulmonaryResistance,
        },
        respiratory: {
          PEEP: source.PEEP,
          Pth0: source.Pth0,
          respAmpTh: source.respAmpTh,
          respAmpAlv: source.respAmpAlv,
          respRate: source.respRate,
        },
      bloodVolumeLedger: {
        projectTBV: true as const,
        bleedRateMlPerMin: 0 as const,
        fluidRateMlPerMin: 0 as const,
        },
        useChiResistance: source.useChiResistance,
        coronaryEnabled: source.coronaryEnabled,
        coronaryControls: {
          resistanceScale: source.coronaryResistanceScale,
          compressionScale: source.coronaryCompressionScale,
          vasodilator01: source.coronaryVasodilator,
          reserveMaximum: source.coronaryReserveMax,
          stenosis01: {
            LAD: source.LADStenosis,
            LCx: source.LCxStenosis,
            RCA: source.RCAStenosis,
          },
        },
        valves: sourceValves,
        nodeOverridesPresent: false as const,
        edgeOverridesPresent: false as const,
      },
    },
    effective: {
      runtime,
      topology: {
        topologyId: graph.topologyId,
        nodes: graph.nodes,
        edges: graph.edges,
        scope: graph.scope,
      },
      valves: effectiveValves,
      numericalPolicy: NON_CORONARY_CIRCULATION_NEWTON_POLICY_V1,
      pulmonaryVenousOstium: {
        edgeName: "PVein_LA" as const,
        effectiveKind: "resistive" as const,
        resistanceMmHgSecPerMl:
          pvEdge.pvOstialResistanceR ?? pvEdge.R,
        quadraticLossMmHgSec2PerMl2:
          pvEdge.pvOstialQuadraticB ?? pvEdge.B ?? 0,
        sourceInertanceMmHgSec2PerMl: 0 as const,
        inertanceApplied: false as const,
      },
      initialVolumeConstruction: {
        method: "main-wire-node-x0-and-venous-pressure-laws" as const,
        dependentBloodVolumeNode:
          NON_CORONARY_CIRCULATION_SCOPE_V1.dependentBloodVolumeNode,
        coronaryNodeVolumesIncluded: false as const,
        nodeVolumesMl: initial.nodeVolumesMl,
        coldSeedTotalBloodVolumeMl: initial.totalBloodVolumeMl,
        officialTargetApplied: false as const,
        excludedCoronaryColdVolumeMl,
        officialTargetMinusExcludedColdSeedVolumeMl,
        coldSeedShortfallFromOfficialMinusExcludedColdSeedMl:
          officialTargetMinusExcludedColdSeedVolumeMl
            - initial.totalBloodVolumeMl,
      },
    },
    exclusions: {
      coronary: {
        sourceEnabled: source.coronaryEnabled,
        effectiveIncluded: false as const,
        reason: "noncoronary-sidecar-scope" as const,
      },
      collapsibleTubeChi: {
        sourceEnabled: false as const,
        effectiveApplied: false as const,
        reason: "requires-modelcore-pressure-and-activation-inputs" as const,
      },
      respiration: {
        sourceRatePerSec: source.respRate,
        effectiveRatePerSec: 0 as const,
        sourceAmplitudesAreZero: true as const,
        reason: "fixed-no-respiratory-oscillation-protocol" as const,
      },
      valveFlowMemory: {
        sourceInertancesRecorded: true as const,
        effectiveApplied: false as const,
        reason: "quasi-steady-complementarity-valve-v1" as const,
      },
    },
    claim: MAIN_WIRE_NORMAL_ADULT_CIRCULATION_CONFIGURATION_CLAIM_V1,
  }) as MainWireNormalAdultCirculationConfigurationSnapshotV1;
  assertSourceAndEffectiveValveParity(sourceValves, effectiveValves);
  return Object.freeze({
    runtime,
    snapshot,
    snapshotStableHash: stableHash(sanitizeForStableHash(snapshot)),
  });
}

export function assertMainWireNormalAdultCirculationConfigurationMatchesFixedRegistryV1(
  snapshot: MainWireNormalAdultCirculationConfigurationSnapshotV1,
): void {
  if (
    snapshot === null
    || typeof snapshot !== "object"
    || typeof (snapshot as Partial<
      MainWireNormalAdultCirculationConfigurationSnapshotV1
    >).configurationId !== "string"
  ) {
    throw new Error("circulation configuration snapshot is missing or malformed");
  }
  const expected = resolveMainWireNormalAdultCirculationConfigurationV1();
  const actualSanitized = sanitizeForStableHash(snapshot);
  const expectedSanitized = sanitizeForStableHash(expected.snapshot);
  if (
    snapshot.configurationId
      !== MAIN_WIRE_NORMAL_ADULT_CIRCULATION_CONFIGURATION_V1_ID
    || stableHash(actualSanitized) !== expected.snapshotStableHash
    || stableCanonicalStringify(actualSanitized)
      !== stableCanonicalStringify(expectedSanitized)
  ) {
    throw new Error(
      "circulation configuration snapshot does not match the fixed main-wire registry",
    );
  }
}

function assertSupportedSourceConfiguration(source: CoreRuntimeParams): void {
  const baseline = defaultParams();
  if (source.nodeOverrides && Object.keys(source.nodeOverrides).length > 0) {
    throw new Error(
      "unsupported main-wire circulation configuration: nodeOverrides are not materialized by V1",
    );
  }
  if (source.edgeOverrides && Object.keys(source.edgeOverrides).length > 0) {
    throw new Error(
      "unsupported main-wire circulation configuration: edgeOverrides are not materialized by V1",
    );
  }
  if (source.useChiResistance) {
    throw new Error(
      "unsupported main-wire circulation configuration: collapsible-tube chi requires ModelCore inputs",
    );
  }
  if (source.respAmpTh !== 0 || source.respAmpAlv !== 0) {
    throw new Error(
      "unsupported main-wire circulation configuration: nonzero respiratory oscillation is not applied",
    );
  }
  if (source.bleedRate !== 0 || source.fluidRate !== 0 || !source.projectTBV) {
    throw new Error(
      "unsupported main-wire circulation configuration: V1 requires a fixed projected TBV ledger with zero bleed and fluid rates",
    );
  }
  const coronaryControls = [
    "coronaryEnabled",
    "coronaryResistanceScale",
    "coronaryCompressionScale",
    "coronaryVasodilator",
    "coronaryReserveMax",
    "LADStenosis",
    "LCxStenosis",
    "RCAStenosis",
  ] as const;
  for (const field of coronaryControls) {
    if (source[field] !== baseline[field]) {
      throw new Error(
        `unsupported main-wire circulation configuration: ${field} changed inside the explicitly excluded coronary subsystem`,
      );
    }
  }
}

function assertSourceAndEffectiveValveParity(
  source: Readonly<Record<NonCoronaryValveNameV1, ValveScalarSnapshotV1>>,
  effective: MainWireNormalAdultCirculationConfigurationSnapshotV1[
    "effective"
  ]["valves"],
): void {
  for (const valveName of VALVES) {
    const left = source[valveName];
    const right = effective[valveName];
    const parameters = right.parameters;
    const comparisons = [
      ["Aref", left.referenceAreaCm2, parameters.referenceAreaCm2],
      ["Amax", left.maximumAreaCm2, parameters.maximumAreaCm2],
      ["Aleak", left.physiologicalLeakAreaCm2,
        parameters.physiologicalLeakAreaCm2],
      ["kOpen", left.openingGainPerMmHg, parameters.openingGainPerMmHg],
      ["tauOpen", left.openingTimeConstantSec,
        parameters.openingTimeConstantSec],
      ["tauClose", left.closingTimeConstantSec,
        parameters.closingTimeConstantSec],
      ["R", left.openResistanceMmHgSecPerMl,
        parameters.openResistanceMmHgSecPerMl],
    ] as const;
    for (const [field, sourceValue, effectiveValue] of comparisons) {
      if (sourceValue !== effectiveValue) {
        throw new Error(
          `unsupported main-wire valve scalar override: ${valveName}_${field} differs from topology`,
        );
      }
    }
    if (
      left.sourceInertanceMmHgSec2PerMl
        !== right.sourceInertanceRecordedButNotApplied
      || left.sourceQuadraticLossMmHgSec2PerMl2
        !== right.sourceQuadraticLossRecordedButNotApplied
    ) {
      throw new Error(
        `unsupported main-wire valve source mismatch: ${valveName} L/B differs from topology`,
      );
    }
  }
}

function valveSourceValue(
  source: CoreRuntimeParams,
  valveName: NonCoronaryValveNameV1,
  field: "Aref" | "Amax" | "Aleak" | "kOpen" | "tauOpen" | "tauClose"
    | "R" | "L" | "B",
): number {
  const value = source[`${valveName}_${field}` as keyof CoreRuntimeParams];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`main-wire valve scalar ${valveName}_${field} is not finite`);
  }
  return value;
}

function valveRecord<T>(
  build: (valveName: NonCoronaryValveNameV1) => T,
): Readonly<Record<NonCoronaryValveNameV1, T>> {
  return Object.freeze(Object.fromEntries(
    VALVES.map((valveName) => [valveName, build(valveName)]),
  )) as Readonly<Record<NonCoronaryValveNameV1, T>>;
}

function deepFreeze<T>(value: T): Readonly<T> {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
    Object.freeze(value);
  }
  return value;
}
