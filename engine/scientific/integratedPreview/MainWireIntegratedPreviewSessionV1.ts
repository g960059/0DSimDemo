import {
  createDynamicMechanicalSupportAcceptedStateV1,
  type DynamicMechanicalSupportInertanceProfileV1,
} from "@/engine/devices/dynamicNetworkV1";
import {
  mechanicalSupportPresetV1,
} from "@/engine/devices/presetsV1";
import type {
  MechanicalSupportConfigV1,
} from "@/engine/devices/typesV1";
import {
  checkpointMainWireIntegratedModelV3,
  restoreMainWireIntegratedModelV3,
  type MainWireIntegratedModelCheckpointContextV3,
  type MainWireIntegratedModelCheckpointV3,
} from "@/engine/myocardium/MainWireIntegratedModelCheckpointV3";
import {
  maximumMainWireIntegratedModelStepDurationV3,
  stepMainWireIntegratedModelV3,
  wrapMainWireIntegratedModelAcceptedStateV3,
  type MainWireIntegratedModelAcceptedStateV3,
  type MainWireIntegratedModelStepSuccessV3,
} from "@/engine/myocardium/MainWireIntegratedModelTransactionV3";
import {
  createMainWireIntegratedHeartMateIiLvadOnlyVerificationProfileV2,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelNumericalVerificationV2";
import {
  createMainWireIntegratedModelRegularSinusAllOffFixtureV3,
  type MainWireIntegratedModelPeriodicTerminalTraceSampleV3,
  type MainWireIntegratedModelRegularSinusAllOffFixtureV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import type {
  MainWireNormalAdultFiveWallMechanicsStateV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";
import {
  loadMainWireAdultFiveWallIntegratedPreviewReleaseV1,
  MAIN_WIRE_INTEGRATED_PREVIEW_TRANSIENT_POLICY_V1,
} from "@/engine/scientific/assembly";
import {
  cloneAndFreezeCanonicalJson,
  sha256CanonicalJsonHex,
  type CanonicalJsonObject,
  type SimulationReleaseRef,
} from "@/engine/scientific/release";
import {
  loadMainWireIntegratedPreviewSeedRunV1,
  type MainWireIntegratedPreviewSeedRunV1,
} from "@/engine/scientific/integratedPreview/MainWireIntegratedPreviewSeedRunV1";

export const MAIN_WIRE_INTEGRATED_PREVIEW_SESSION_V1_ID =
  "circleheart-main-wire-integrated-preview-session-v1" as const;

export const MAIN_WIRE_INTEGRATED_PREVIEW_MCS_PRESET_IDS_V1 = Object.freeze([
  "all-off",
  "lvad-hmii-9000-one-beat-transient",
] as const);
export type MainWireIntegratedPreviewMcsPresetIdV1 =
  typeof MAIN_WIRE_INTEGRATED_PREVIEW_MCS_PRESET_IDS_V1[number];

export type MainWireIntegratedPreviewSimulationInputSpecV1 = Readonly<{
  schemaId: "circleheart-integrated-simulation-input-spec-v1";
  schemaVersion: 1;
  releaseRef: SimulationReleaseRef;
  modelAssembly: "base+coronary-v3+dynamic-mcs+composed-rhythm-v2";
  fixedGlobalTotalBloodVolumeMl: 5_600;
  rhythm: Readonly<{
    presetId: "composed-regular-sinus-60-v1";
    heartRateBpm: 60;
    cycleLengthSec: 1;
    externalAfOwnerIncluded: false;
  }>;
  mechanicalSupport: Readonly<{
    presetId: MainWireIntegratedPreviewMcsPresetIdV1;
    activeDeviceIds: readonly [] | readonly ["LVAD"];
    interpretation:
      | "numerically-periodic-all-off-seed"
      | "one-unsteady-post-activation-beat";
  }>;
  nominalDtSec: 0.002;
  seedRunPayloadSha256: string;
}>;

export type MainWireIntegratedPreviewRunArtifactV1 = Readonly<{
  artifactId: "circleheart-main-wire-integrated-preview-run-artifact-v1";
  schemaVersion: 1;
  releaseRef: SimulationReleaseRef;
  simulationInputSpec: MainWireIntegratedPreviewSimulationInputSpecV1;
  simulationInputSpecSha256: string;
  sourceSeed: Readonly<{
    payloadSha256: string;
    checkpointSha256: string;
    numericalPeriod1Established: true;
  }>;
  run: Readonly<{
    kind: "bundled-p1-seed" | "one-beat-continuation";
    execution:
      | Readonly<{
        operation: "project-bundled-p1-seed";
        continuationBeatCountFromSeed: 0;
      }>
      | Readonly<{
        operation: "advance-one-fixed-sinus-cycle";
        requestedDurationSec: 1;
        continuationBeatOrdinalFromSeed: number;
      }>;
    startAcceptedTimeSec: number;
    endAcceptedTimeSec: number;
    acceptedStepCount: number;
    trace: readonly MainWireIntegratedModelPeriodicTerminalTraceSampleV3[];
    allValuesFinite: true;
    maximumTotalBloodVolumeErrorMl: number;
    maximumCoronaryBloodVolumeLedgerResidualMl: number;
    maximumDynamicMcsConservationResidualMlPerSec: number;
    numericalPeriod1Established:
      | true
      | "not-assessed-for-this-continuation";
    physiologicalAcceptanceEstablished: false;
    clinicalValidationClaimed: false;
  }>;
  modelState: MainWireIntegratedModelCheckpointV3;
  artifactSha256: string;
}>;

export type MainWireIntegratedPreviewRunPresentationV1 = Readonly<{
  artifactId: MainWireIntegratedPreviewRunArtifactV1["artifactId"];
  schemaVersion: 1;
  artifactSha256: string;
  releaseRef: SimulationReleaseRef;
  simulationInputSpec: MainWireIntegratedPreviewSimulationInputSpecV1;
  simulationInputSpecSha256: string;
  sourceSeed: MainWireIntegratedPreviewRunArtifactV1["sourceSeed"];
  run: Omit<MainWireIntegratedPreviewRunArtifactV1["run"], "trace">;
  trace: readonly MainWireIntegratedModelPeriodicTerminalTraceSampleV3[];
  modelStateRef: Readonly<{
    checkpointId: MainWireIntegratedModelCheckpointV3["checkpointId"];
    schemaVersion: 3;
    checkpointSha256: string;
    acceptedTimeSec: number;
    revision: number;
  }>;
}>;

type Fixture = MainWireIntegratedModelRegularSinusAllOffFixtureV3;
type AcceptedState = MainWireIntegratedModelAcceptedStateV3<
  MainWireNormalAdultFiveWallMechanicsStateV1
>;
type SuccessfulStep = MainWireIntegratedModelStepSuccessV3<
  MainWireNormalAdultFiveWallMechanicsStateV1
>;

export class MainWireIntegratedPreviewSessionV1 {
  readonly sessionId = MAIN_WIRE_INTEGRATED_PREVIEW_SESSION_V1_ID;
  readonly releaseRef: SimulationReleaseRef;
  readonly inputSpec: MainWireIntegratedPreviewSimulationInputSpecV1;
  readonly inputSpecSha256: string;

  private readonly fixture: Fixture;
  private readonly seed: MainWireIntegratedPreviewSeedRunV1;
  private readonly dynamicProfile: DynamicMechanicalSupportInertanceProfileV1;
  private readonly dynamicConfig: MechanicalSupportConfigV1;
  private acceptedState: AcceptedState;
  private continuationBeatCountFromSeed = 0;

  private constructor(
    releaseRef: SimulationReleaseRef,
    inputSpec: MainWireIntegratedPreviewSimulationInputSpecV1,
    inputSpecSha256: string,
    fixture: Fixture,
    seed: MainWireIntegratedPreviewSeedRunV1,
    dynamicProfile: DynamicMechanicalSupportInertanceProfileV1,
    dynamicConfig: MechanicalSupportConfigV1,
    acceptedState: AcceptedState,
  ) {
    this.releaseRef = releaseRef;
    this.inputSpec = inputSpec;
    this.inputSpecSha256 = inputSpecSha256;
    this.fixture = fixture;
    this.seed = seed;
    this.dynamicProfile = dynamicProfile;
    this.dynamicConfig = dynamicConfig;
    this.acceptedState = acceptedState;
  }

  static async create(
    mcsPresetId: MainWireIntegratedPreviewMcsPresetIdV1 = "all-off",
  ): Promise<MainWireIntegratedPreviewSessionV1> {
    if (!MAIN_WIRE_INTEGRATED_PREVIEW_MCS_PRESET_IDS_V1.includes(mcsPresetId)) {
      throw new Error("integrated preview MCS preset is not allowlisted");
    }
    const [release, seed] = await Promise.all([
      loadMainWireAdultFiveWallIntegratedPreviewReleaseV1(),
      loadMainWireIntegratedPreviewSeedRunV1(),
    ]);
    const fixture =
      createMainWireIntegratedModelRegularSinusAllOffFixtureV3();
    const seedState = await restoreMainWireIntegratedModelV3(
      checkpointContext(fixture, fixture.profile, fixture.config),
      seed.payload.modelState,
    );
    const active = mcsPresetId === "lvad-hmii-9000-one-beat-transient";
    const dynamicProfile = active
      ? createMainWireIntegratedHeartMateIiLvadOnlyVerificationProfileV2()
      : fixture.profile;
    const dynamicConfig = active
      ? mechanicalSupportPresetV1("lvad-hmii-9000")
      : fixture.config;
    const acceptedState = active
      ? wrapMainWireIntegratedModelAcceptedStateV3(
        seedState.coronary,
        seedState.composedRhythm,
        createDynamicMechanicalSupportAcceptedStateV1(
          dynamicProfile,
          dynamicConfig,
        ),
        { configuration: fixture.rhythm.configuration },
        dynamicProfile,
        dynamicConfig,
      )
      : seedState;
    const inputSpec = cloneAndFreezeCanonicalJson({
      schemaId: "circleheart-integrated-simulation-input-spec-v1",
      schemaVersion: 1,
      releaseRef: release.ref,
      modelAssembly:
        "base+coronary-v3+dynamic-mcs+composed-rhythm-v2",
      fixedGlobalTotalBloodVolumeMl: 5_600,
      rhythm: {
        presetId: "composed-regular-sinus-60-v1",
        heartRateBpm: 60,
        cycleLengthSec: 1,
        externalAfOwnerIncluded: false,
      },
      mechanicalSupport: {
        presetId: mcsPresetId,
        activeDeviceIds: active ? ["LVAD"] : [],
        interpretation: active
          ? "one-unsteady-post-activation-beat"
          : "numerically-periodic-all-off-seed",
      },
      nominalDtSec:
        MAIN_WIRE_INTEGRATED_PREVIEW_TRANSIENT_POLICY_V1.nominalDtSec,
      seedRunPayloadSha256: seed.payloadSha256,
    }) as unknown as MainWireIntegratedPreviewSimulationInputSpecV1;
    return new MainWireIntegratedPreviewSessionV1(
      release.ref,
      inputSpec,
      await sha256CanonicalJsonHex(inputSpec),
      fixture,
      seed,
      dynamicProfile,
      dynamicConfig,
      acceptedState,
    );
  }

  async seedRunArtifact(): Promise<MainWireIntegratedPreviewRunArtifactV1> {
    if (this.inputSpec.mechanicalSupport.presetId !== "all-off") {
      throw new Error("active MCS session has no periodic seed presentation");
    }
    return this.buildArtifact({
      kind: "bundled-p1-seed",
      execution: Object.freeze({
        operation: "project-bundled-p1-seed",
        continuationBeatCountFromSeed: 0,
      }),
      startAcceptedTimeSec:
        this.seed.payload.displaySeed.terminalCycleTrace.startTimeSec,
      endAcceptedTimeSec:
        this.seed.payload.displaySeed.terminalCycleTrace.endTimeSec,
      trace: this.seed.payload.displaySeed.terminalCycleTrace.samples,
      numericalPeriod1Established: true,
      modelState: this.seed.payload.modelState,
    });
  }

  async runNextBeatArtifact():
  Promise<MainWireIntegratedPreviewRunArtifactV1> {
    const retainedAcceptedState = this.acceptedState;
    const retainedContinuationBeatCount = this.continuationBeatCountFromSeed;
    try {
      const artifact = await this.advanceOneBeatArtifact();
      this.continuationBeatCountFromSeed += 1;
      return artifact;
    } catch (error) {
      this.acceptedState = retainedAcceptedState;
      this.continuationBeatCountFromSeed = retainedContinuationBeatCount;
      throw error;
    }
  }

  private async advanceOneBeatArtifact():
  Promise<MainWireIntegratedPreviewRunArtifactV1> {
    const startAcceptedTimeSec = this.acceptedState.acceptedTimeSec;
    const endAcceptedTimeSec = startAcceptedTimeSec + 1;
    const trace: MainWireIntegratedModelPeriodicTerminalTraceSampleV3[] = [];
    let acceptedStepCount = 0;
    let nominalGridIndex = 1;
    while (this.acceptedState.acceptedTimeSec < endAcceptedTimeSec) {
      if (
        acceptedStepCount >=
          MAIN_WIRE_INTEGRATED_PREVIEW_TRANSIENT_POLICY_V1
            .maximumAcceptedStepCountPerBeat
      ) throw new Error("integrated preview beat exceeded its step bound");
      const nominalTarget = Math.min(
        endAcceptedTimeSec,
        startAcceptedTimeSec
          + nominalGridIndex
            * MAIN_WIRE_INTEGRATED_PREVIEW_TRANSIENT_POLICY_V1.nominalDtSec,
      );
      const requestedStepSec =
        nominalTarget - this.acceptedState.acceptedTimeSec;
      if (!(requestedStepSec > 0)) {
        nominalGridIndex += 1;
        continue;
      }
      const maximum = maximumMainWireIntegratedModelStepDurationV3(
        this.acceptedState,
        requestedStepSec,
        {
          configuration: this.fixture.rhythm.configuration,
          externalAfNextBoundaryTimeSec: null,
        },
        this.dynamicProfile,
        this.dynamicConfig,
      );
      const stepped = stepMainWireIntegratedModelV3(
        this.fixture.provider,
        this.acceptedState,
        {
          dtSec: maximum.maximumStepSec,
          coronary: this.fixture.coronaryStepInput,
          rhythm: {
            configuration: this.fixture.rhythm.configuration,
            externalAfNextBoundaryTimeSec: null,
            externalAtrialSourceBatch: null,
          },
          dynamicMechanicalSupport: {
            config: this.dynamicConfig,
            heartRateBpm: 60,
            profile: this.dynamicProfile,
          },
        },
      );
      if (stepped.converged === false) {
        throw new Error(`integrated preview step failed: ${stepped.message}`);
      }
      this.acceptedState = stepped.acceptedState;
      acceptedStepCount += 1;
      trace.push(traceSample(
        Math.floor(startAcceptedTimeSec) + 1,
        acceptedStepCount,
        startAcceptedTimeSec,
        maximum.maximumStepSec,
        stepped,
      ));
      if (
        Math.abs(this.acceptedState.acceptedTimeSec - nominalTarget) <= 1e-14
      ) nominalGridIndex += 1;
    }
    const modelState = await checkpointMainWireIntegratedModelV3(
      checkpointContext(
        this.fixture,
        this.dynamicProfile,
        this.dynamicConfig,
      ),
      this.acceptedState,
    );
    return this.buildArtifact({
      kind: "one-beat-continuation",
      execution: Object.freeze({
        operation: "advance-one-fixed-sinus-cycle",
        requestedDurationSec: 1,
        continuationBeatOrdinalFromSeed:
          this.continuationBeatCountFromSeed + 1,
      }),
      startAcceptedTimeSec,
      endAcceptedTimeSec,
      trace,
      numericalPeriod1Established:
        "not-assessed-for-this-continuation",
      modelState,
    });
  }

  private async buildArtifact(input: Readonly<{
    kind: MainWireIntegratedPreviewRunArtifactV1["run"]["kind"];
    execution: MainWireIntegratedPreviewRunArtifactV1["run"]["execution"];
    startAcceptedTimeSec: number;
    endAcceptedTimeSec: number;
    trace: readonly MainWireIntegratedModelPeriodicTerminalTraceSampleV3[];
    numericalPeriod1Established:
      MainWireIntegratedPreviewRunArtifactV1["run"]["numericalPeriod1Established"];
    modelState: MainWireIntegratedModelCheckpointV3;
  }>): Promise<MainWireIntegratedPreviewRunArtifactV1> {
    if (input.trace.length === 0 || !allNumericLeavesFinite(input.trace)) {
      throw new Error("integrated preview run trace is empty or nonfinite");
    }
    const run = Object.freeze({
      kind: input.kind,
      execution: input.execution,
      startAcceptedTimeSec: input.startAcceptedTimeSec,
      endAcceptedTimeSec: input.endAcceptedTimeSec,
      acceptedStepCount: input.trace.length,
      trace: Object.freeze([...input.trace]),
      allValuesFinite: true as const,
      maximumTotalBloodVolumeErrorMl: maximumAbsolute(
        input.trace,
        (sample) => sample.diagnostics.totalBloodVolumeErrorMl,
      ),
      maximumCoronaryBloodVolumeLedgerResidualMl: maximumAbsolute(
        input.trace,
        (sample) => sample.diagnostics.coronaryBloodVolumeLedgerResidualMl,
      ),
      maximumDynamicMcsConservationResidualMlPerSec: maximumAbsolute(
        input.trace,
        (sample) =>
          sample.diagnostics.dynamicMcsConservationResidualMlPerSec,
      ),
      numericalPeriod1Established: input.numericalPeriod1Established,
      physiologicalAcceptanceEstablished: false as const,
      clinicalValidationClaimed: false as const,
    });
    const payload = cloneAndFreezeCanonicalJson<CanonicalJsonObject>({
      artifactId:
        "circleheart-main-wire-integrated-preview-run-artifact-v1",
      schemaVersion: 1,
      releaseRef: this.releaseRef,
      simulationInputSpec: this.inputSpec,
      simulationInputSpecSha256: this.inputSpecSha256,
      sourceSeed: {
        payloadSha256: this.seed.payloadSha256,
        checkpointSha256:
          this.seed.payload.modelState.checkpointSha256,
        numericalPeriod1Established: true,
      },
      run,
      modelState: input.modelState,
    });
    return cloneAndFreezeCanonicalJson({
      ...payload,
      artifactSha256: await sha256CanonicalJsonHex(payload),
    }) as unknown as MainWireIntegratedPreviewRunArtifactV1;
  }
}

export function projectMainWireIntegratedPreviewRunV1(
  artifact: MainWireIntegratedPreviewRunArtifactV1,
): MainWireIntegratedPreviewRunPresentationV1 {
  const { trace, ...run } = artifact.run;
  return Object.freeze({
    artifactId: artifact.artifactId,
    schemaVersion: artifact.schemaVersion,
    artifactSha256: artifact.artifactSha256,
    releaseRef: artifact.releaseRef,
    simulationInputSpec: artifact.simulationInputSpec,
    simulationInputSpecSha256: artifact.simulationInputSpecSha256,
    sourceSeed: artifact.sourceSeed,
    run,
    trace,
    modelStateRef: Object.freeze({
      checkpointId: artifact.modelState.checkpointId,
      schemaVersion: artifact.modelState.schemaVersion,
      checkpointSha256: artifact.modelState.checkpointSha256,
      acceptedTimeSec: artifact.modelState.acceptedTimeSec,
      revision: artifact.modelState.revision,
    }),
  });
}

function checkpointContext(
  fixture: Fixture,
  dynamicMechanicalSupportProfile: DynamicMechanicalSupportInertanceProfileV1,
  dynamicMechanicalSupportConfig: MechanicalSupportConfigV1,
): MainWireIntegratedModelCheckpointContextV3<
  MainWireNormalAdultFiveWallMechanicsStateV1
> {
  return Object.freeze({
    provider: fixture.provider,
    coronaryPrior: fixture.coronaryStepInput.coronaryPrior,
    collapseHydraulics: fixture.coronaryStepInput.collapseHydraulics,
    impMechanism: fixture.coronaryStepInput.impMechanism,
    shorteningImpPrior: fixture.coronaryStepInput.shorteningImpPrior,
    coronaryAutoregulationBinding:
      fixture.cold.acceptedState.coronary.coronaryAutoregulationBinding,
    rhythm: Object.freeze({ configuration: fixture.rhythm.configuration }),
    dynamicMechanicalSupportProfile,
    dynamicMechanicalSupportConfig,
  });
}

function traceSample(
  cycleIndex: number,
  acceptedStepIndexWithinCycle: number,
  cycleStartTimeSec: number,
  acceptedDtSec: number,
  stepped: SuccessfulStep,
): MainWireIntegratedModelPeriodicTerminalTraceSampleV3 {
  const base = stepped.coronaryStep.baseStep;
  const circulation = base.circulationTrial;
  const pressures = circulation.nodeAbsolutePressuresMmHg;
  const volumes = circulation.candidateNodeVolumesMl;
  const valves = circulation.valveEvaluations;
  const hydraulics = base.coronaryTrial.diagnostics.hydraulics;
  const candidate = stepped.composedRhythmCandidate;
  return cloneAndFreezeCanonicalJson({
    cycleIndex,
    acceptedStepIndexWithinCycle,
    acceptedTimeSec: stepped.acceptedState.acceptedTimeSec,
    cyclePhase01: stepped.acceptedState.acceptedTimeSec - cycleStartTimeSec,
    acceptedDtSec,
    chamberVolumeMl: {
      LA: volumes.LA,
      LV: volumes.LV,
      RA: volumes.RA,
      RV: volumes.RV,
    },
    absolutePressureMmHg: {
      LA: pressures.LA,
      LV: pressures.LV,
      RA: pressures.RA,
      RV: pressures.RV,
      Ao: pressures.Ao,
      PA: pressures.PA,
      PVein: pressures.PVein,
    },
    valveFlowMlPerSec: {
      MV: valves.MV.flowMlPerSec,
      AoV: valves.AoV.flowMlPerSec,
      TV: valves.TV.flowMlPerSec,
      PV: valves.PV.flowMlPerSec,
    },
    pulmonaryCirculation: {
      nodeVolumeMl: {
        PA: volumes.PA,
        PArt: volumes.PArt,
        PCap: volumes.PCap,
        PVen: volumes.PVen,
        PVein: volumes.PVein,
      },
      absolutePressureMmHg: {
        PA: pressures.PA,
        PArt: pressures.PArt,
        PCap: pressures.PCap,
        PVen: pressures.PVen,
        PVein: pressures.PVein,
      },
      edgeFlowMlPerSec: {
        PV: valves.PV.flowMlPerSec,
        PA_PArt: circulation.edgeFlowsMlPerSec.PA_PArt,
        PArt_PCap: circulation.edgeFlowsMlPerSec.PArt_PCap,
        PCap_PVen: circulation.edgeFlowsMlPerSec.PCap_PVen,
        PVen_PVein: circulation.edgeFlowsMlPerSec.PVen_PVein,
        PVein_LA: circulation.edgeFlowsMlPerSec.PVein_LA,
      },
    },
    coronary: {
      totalInletFlowMlPerSec: hydraulics.totalInletFlowMlPerSec,
      ladSubendocardialQmFlowMlPerSec:
        hydraulics.layerQmInternalFlowMlPerSecByTerritory.LAD.subendocardial,
    },
    freeCalciumUMByWall: stepped.calciumDrive.freeCalciumUMByWall,
    dynamicMcsAcceptedFlowMlPerSec:
      stepped.acceptedState.dynamicMechanicalSupport.acceptedFlowMlPerSec,
    acceptedEventIdentity: {
      atrialCapturedActivationId:
        candidate.capturedAtrialActivation?.capturedActivationId ?? null,
      ventricularCapturedActivationId:
        candidate.capturedVentricularActivation?.capturedActivationId ?? null,
      deliveredCalciumDepositIds: candidate.deliveredCalciumDeposits.map(
        (deposit) => deposit.depositId,
      ),
      scheduledCalciumDepositIds: candidate.scheduledCalciumDeposits.map(
        (deposit) => deposit.depositId,
      ),
    },
    diagnostics: {
      mechanicsResidualNorm: base.mechanicsTrial.diagnostics.residualNorm,
      circulationScaledResidualInfinityNorm:
        circulation.diagnostics.finalScaledResidualInfinityNorm,
      maximumContinuityResidualMl:
        circulation.diagnostics.finalMaximumContinuityResidualMl,
      totalBloodVolumeErrorMl: circulation.diagnostics.totalBloodVolumeErrorMl,
      coronaryBloodVolumeLedgerResidualMl:
        base.coronaryTrial.diagnostics.exactBloodVolumeLedgerResidualMl,
      dynamicMcsConservationResidualMlPerSec:
        stepped.dynamicMechanicalSupportTrial.conservationResidualMlPerSec,
    },
  }) as unknown as MainWireIntegratedModelPeriodicTerminalTraceSampleV3;
}

function maximumAbsolute(
  trace: readonly MainWireIntegratedModelPeriodicTerminalTraceSampleV3[],
  read: (sample: MainWireIntegratedModelPeriodicTerminalTraceSampleV3) => number,
): number {
  return Math.max(...trace.map((sample) => Math.abs(read(sample))));
}

function allNumericLeavesFinite(value: unknown): boolean {
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(allNumericLeavesFinite);
  if (typeof value !== "object" || value === null) return true;
  return Object.values(value).every(allNumericLeavesFinite);
}
