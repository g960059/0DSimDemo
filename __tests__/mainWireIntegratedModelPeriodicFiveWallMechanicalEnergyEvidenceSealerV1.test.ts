import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  MAIN_WIRE_FIVE_WALL_MECHANICAL_ENERGY_CHAMBER_IDS_V1,
  MAIN_WIRE_FIVE_WALL_MECHANICAL_ENERGY_WALL_IDS_V1,
  type MainWireFiveWallMechanicalEnergyLedgerAcceptedStepSampleV1,
  type MainWireFiveWallMechanicalEnergyLedgerV1,
  type MainWireFiveWallMechanicalEnergyWallRecordV1,
} from "@/engine/myocardium/diagnostics/MainWireFiveWallMechanicalEnergyLedgerV1";
import { MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_PHYSICAL_METRIC_IDS_V1 } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyAdmissionV1";
import {
  remeasureMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceV1,
  remeasureMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyQuadratureBridgesV1,
  runMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceV1,
  type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_CLAIM_V1,
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_POLICY_V1,
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_V1_ID,
  type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyAlgebraicResidualV1,
  type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyConjugacyV1,
  type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyPhysicalMetricV1,
  type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyQualifiedV1,
  type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyResultV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyV1";
import { MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_WORK_REFINEMENT_ACCESS_V1_ID } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import { sha256CanonicalJsonHex } from "@/engine/integrity";
import {
  createMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyExecutionFailureArtifactPayloadV1,
  preflightMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceOutputV1,
  writeMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceArtifactCreateOnlyV1,
} from "@/tools/scientific/MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceArtifactV1";

type SyntheticSteadySourceV1 = Readonly<{
  nominalDtSec: 0.001 | 0.0005;
}>;

const dependencies = vi.hoisted(() => ({
  steady: vi.fn(),
  singleArm: vi.fn(),
  admission: vi.fn(),
  actualAdmission: null as null | ((...args: unknown[]) => unknown),
}));

vi.mock(
  "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyAdmissionV1",
  async (importOriginal) => {
    const actual = await importOriginal<Record<string, unknown>>();
    dependencies.actualAdmission =
      actual.assessMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyAdmissionV1 as (
        ...args: unknown[]
      ) => unknown;
    return {
      ...actual,
      assessMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyAdmissionV1:
        dependencies.admission,
    };
  },
);

vi.mock(
  "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3",
  async (importOriginal) => {
    const actual = await importOriginal<Record<string, unknown>>();
    return {
      ...actual,
      runMainWireIntegratedModelPeriodicSteadyForWorkRefinementV1:
        dependencies.steady,
    };
  },
);

vi.mock(
  "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyV1",
  async (importOriginal) => {
    const actual = await importOriginal<Record<string, unknown>>();
    return {
      ...actual,
      runMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyV1:
        dependencies.singleArm,
    };
  },
);

describe("periodic five-wall mechanical-energy canonical sealer V1", () => {
  beforeEach(() => {
    dependencies.steady.mockReset();
    dependencies.singleArm.mockReset();
    dependencies.admission.mockReset();
    dependencies.admission.mockImplementation((...args: unknown[]) =>
      dependencies.actualAdmission!(...args),
    );
  });

  it("seals a valid synthetic pair through both arms, admission, and the official flag", async () => {
    const pair = await syntheticPairV1();
    installSyntheticDependenciesV1(pair.coarse, pair.fine);

    const result =
      await runMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceV1();

    expect(dependencies.steady).toHaveBeenCalledTimes(2);
    expect(dependencies.steady.mock.calls).toEqual([
      [
        {
          nominalDtSec: 0.001,
          maximumCycleCount: 250,
          executionPurpose: "canonical-evidence",
        },
      ],
      [
        {
          nominalDtSec: 0.0005,
          maximumCycleCount: 250,
          executionPurpose: "canonical-evidence",
        },
      ],
    ]);
    expect(dependencies.singleArm).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({
      status: "sealed-admission-assessed",
      coarse: { status: "projection-sealed", failureReasons: [] },
      fine: { status: "projection-sealed", failureReasons: [] },
      admission: {
        status: "comparison-passed",
        numericalAdmissionConjunctionPassed: true,
        officialSealedMechanicalEnergyAnalysisEligible: false,
      },
      officialSealedMechanicalEnergyAnalysisEligible: true,
      activeDeliveryAbsorptionSplitEstablished: false,
      instantaneousPowerEstablished: false,
      publicLiveOutputCatalogAdmissionEstablished: false,
      publicGraphCatalogAdmissionEstablished: false,
      PEEstablished: false,
      PVAEstablished: false,
      MVO2Established: false,
      ATPUseEstablished: false,
      mechanicalEfficiencyEstablished: false,
      physiologicalValidationEstablished: false,
      clinicalValidationClaimed: false,
    });
    expect(result.pairSealedPayloadSha256).toMatch(/^[0-9a-f]{64}$/);
    expect(result.coarse.compactProjectionSha256).toMatch(/^[0-9a-f]{64}$/);
    expect(result.fine.compactProjectionSha256).toMatch(/^[0-9a-f]{64}$/);
  });

  it("labels a coarse periodic-source exception for the failure artifact", async () => {
    dependencies.steady.mockRejectedValueOnce(
      new Error("synthetic source failure"),
    );

    await expect(
      runMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceV1(),
    ).rejects.toMatchObject({
      arm: "coarse",
      stage: "periodic-source",
    });
    expect(dependencies.singleArm).not.toHaveBeenCalled();
  });

  it("labels a single-arm ledger exception for the failure artifact", async () => {
    dependencies.steady.mockResolvedValueOnce(
      Object.freeze({ nominalDtSec: 0.001 }),
    );
    dependencies.singleArm.mockRejectedValueOnce(
      new Error("synthetic ledger failure"),
    );

    await expect(
      runMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceV1(),
    ).rejects.toMatchObject({
      arm: "coarse",
      stage: "single-arm-mechanical-ledger",
    });
  });

  it("retains a sealed coarse arm when the fine source fails", async () => {
    const pair = await syntheticPairV1();
    installSyntheticDependenciesV1(pair.coarse, pair.fine);
    dependencies.steady.mockImplementation(
      async (options: Readonly<{ nominalDtSec: 0.001 | 0.0005 }>) => {
        if (options.nominalDtSec === 0.0005) {
          throw new Error("synthetic fine source failure");
        }
        return Object.freeze({ nominalDtSec: options.nominalDtSec });
      },
    );

    const failure = await captureOfficialFailureV1();

    expectRetainedArmFailureV1(failure, "fine", "periodic-source", false);
  });

  it("retains a sealed coarse arm when the fine ledger fails", async () => {
    const pair = await syntheticPairV1();
    installSyntheticDependenciesV1(pair.coarse, pair.fine);
    dependencies.singleArm.mockImplementation(
      async (input: Readonly<{ source: SyntheticSteadySourceV1 }>) => {
        if (input.source.nominalDtSec === 0.0005) {
          throw new Error("synthetic fine ledger failure");
        }
        return pair.coarse;
      },
    );

    const failure = await captureOfficialFailureV1();

    expectRetainedArmFailureV1(
      failure,
      "fine",
      "single-arm-mechanical-ledger",
      false,
    );
  });

  it("retains a sealed coarse arm when fine arm sealing fails", async () => {
    const pair = await syntheticPairV1();
    const throwingFine = new Proxy(pair.fine, {
      get(target, property, receiver) {
        if (property === "status") {
          throw new Error("synthetic fine sealing failure");
        }
        return Reflect.get(target, property, receiver);
      },
    });
    installSyntheticDependenciesV1(pair.coarse, throwingFine);

    const failure = await captureOfficialFailureV1();

    expectRetainedArmFailureV1(failure, "fine", "arm-sealing", false);
  });

  it("retains both sealed arms when pair admission throws", async () => {
    const pair = await syntheticPairV1();
    installSyntheticDependenciesV1(pair.coarse, pair.fine);
    dependencies.admission.mockImplementationOnce(() => {
      throw new Error("synthetic pair admission failure");
    });

    const failure = await captureOfficialFailureV1();

    expectRetainedArmFailureV1(failure, null, "pair-sealing", true);
  });

  it.each([
    ["source checkpoint", "source-checkpoint-sha256-mismatch"],
    ["terminal checkpoint", "terminal-checkpoint-sha256-mismatch"],
    ["raw trace", "raw-mechanical-trace-sha256-mismatch"],
    ["bridge sample", "bridge-terminal-sample-sha256-mismatch"],
    ["material binding", "material-volume-binding-sha256-mismatch"],
  ] as const)(
    "fails closed when the %s preimage is changed",
    async (owner, expectedFailure) => {
      const pair = await syntheticPairV1();
      const coarse = tamperPreimageV1(pair.coarse, owner);
      installSyntheticDependenciesV1(coarse, pair.fine);

      const result =
        await runMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceV1();

      expectUnsealedOfficialFailureV1(result, expectedFailure);
    },
  );

  it("fails closed on a fully rehashed but discontinuous accepted lineage", async () => {
    const pair = await syntheticPairV1();
    const observation =
      pair.coarse.measurementInputEvidence
        .measurementAcceptedStepObservations[0]!;
    const measurementInputEvidence = Object.freeze({
      ...pair.coarse.measurementInputEvidence,
      measurementAcceptedStepObservations: Object.freeze([
        Object.freeze({
          ...observation,
          source: Object.freeze({
            ...observation.source,
            previousAcceptedRevision:
              observation.source.previousAcceptedRevision + 7,
          }),
        }),
      ]),
    });
    const coarse = Object.freeze({
      ...pair.coarse,
      measurementInputEvidence,
      rawMechanicalTraceSha256: await sha256CanonicalJsonHex(
        measurementInputEvidence,
      ),
    }) as MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyQualifiedV1;
    installSyntheticDependenciesV1(coarse, pair.fine);

    const result =
      await runMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceV1();

    expectUnsealedOfficialFailureV1(
      result,
      "accepted-lineage-binding-mismatch",
    );
  });

  it("fails closed when a compact projection value differs from ledger replay", async () => {
    const pair = await syntheticPairV1();
    const physicalMetrics = pair.coarse.physicalMetrics.map((metric, index) =>
      index === 0
        ? Object.freeze({ ...metric, valueMilliJ: metric.valueMilliJ + 1 })
        : metric,
    );
    const coarse = Object.freeze({
      ...pair.coarse,
      physicalMetrics: Object.freeze(physicalMetrics),
    }) as MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyQualifiedV1;
    installSyntheticDependenciesV1(coarse, pair.fine);

    const result =
      await runMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceV1();

    expectUnsealedOfficialFailureV1(
      result,
      "ledger-projection-binding-mismatch",
    );
  });

  it("does not assess or elevate a pair when either arm is not sealed", async () => {
    const pair = await syntheticPairV1();
    const coarse = Object.freeze({
      ...pair.coarse,
      status: "not-qualified" as const,
      failureReasons: Object.freeze(["synthetic-single-arm-failure"]),
    }) as unknown as MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyResultV1;
    installSyntheticDependenciesV1(coarse, pair.fine);

    const result =
      await runMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceV1();

    expect(result).toMatchObject({
      status: "evidence-verification-failed",
      coarse: {
        status: "not-sealed",
        failureReasons: ["single-arm-not-qualified"],
      },
      fine: { status: "projection-sealed" },
      admission: null,
      pairSealedPayloadSha256: null,
      officialSealedMechanicalEnergyAnalysisEligible: false,
    });
  });

  it("preflights an immutable output and uses create-only artifact writes", async () => {
    const temporaryDirectory = mkdtempSync(
      path.join(tmpdir(), "five-wall-energy-evidence-"),
    );
    try {
      const existingPath = path.join(temporaryDirectory, "existing.json");
      writeFileSync(existingPath, "original", "utf8");
      expect(() =>
        preflightMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceOutputV1(
          existingPath,
        ),
      ).toThrow(/refusing to overwrite existing evidence artifact/);
      expect(readFileSync(existingPath, "utf8")).toBe("original");
      expect(dependencies.steady).not.toHaveBeenCalled();
      expect(dependencies.singleArm).not.toHaveBeenCalled();

      const racedPath = path.join(temporaryDirectory, "raced.json");
      const preflightedRace =
        preflightMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceOutputV1(
          racedPath,
        );
      writeFileSync(racedPath, "racer", "utf8");
      await expect(
        writeMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceArtifactCreateOnlyV1(
          preflightedRace,
          Object.freeze({ status: "synthetic" }),
        ),
      ).rejects.toMatchObject({ code: "EEXIST" });
      expect(readFileSync(racedPath, "utf8")).toBe("racer");

      const newPath = path.join(temporaryDirectory, "new.json");
      const preflightedNew =
        preflightMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceOutputV1(
          newPath,
        );
      const retained =
        await writeMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceArtifactCreateOnlyV1(
          preflightedNew,
          Object.freeze({ status: "synthetic" }),
        );
      expect(retained.absoluteOutputPath).toBe(newPath);
      expect(retained.artifactPayloadSha256).toMatch(/^[0-9a-f]{64}$/);
      expect(JSON.parse(readFileSync(newPath, "utf8"))).toMatchObject({
        status: "synthetic",
        artifactPayloadSha256: retained.artifactPayloadSha256,
      });
    } finally {
      rmSync(temporaryDirectory, { recursive: true, force: true });
    }
  });

  it("keeps CLI preflight before the runner and writes before failure exit", () => {
    const cliSource = readFileSync(
      path.resolve(
        "tools/scientific/runMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceV1.ts",
      ),
      "utf8",
    );
    const helperSource = readFileSync(
      path.resolve(
        "tools/scientific/MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceArtifactV1.ts",
      ),
      "utf8",
    );
    expect(helperSource).toContain("rawMechanicalInputsIncluded: false");
    expect(helperSource).toContain('flag: "wx"');
    expect(`${cliSource}\n${helperSource}`).not.toMatch(
      /\bmeasurementInputEvidence\b|\bmaterialVolumeBindingPayload\b|\bbridgeTerminalAcceptedStepSample\b/,
    );
    const preflight = cliSource.indexOf(
      "preflightMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceOutputV1(",
    );
    const runner = cliSource.indexOf(
      "await runMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceV1()",
    );
    const firstWrite = cliSource.indexOf(
      "await writeMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceArtifactCreateOnlyV1(",
    );
    const firstExit = cliSource.indexOf("process.exitCode = 1");
    const lastExit = cliSource.lastIndexOf("process.exitCode = 1");
    expect(preflight).toBeGreaterThan(0);
    expect(runner).toBeGreaterThan(preflight);
    expect(firstWrite).toBeGreaterThan(0);
    expect(firstExit).toBeGreaterThan(firstWrite);
    expect(lastExit).toBeGreaterThan(firstExit);
  });
});

async function captureOfficialFailureV1(): Promise<unknown> {
  try {
    await runMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceV1();
  } catch (error) {
    return error;
  }
  throw new Error("synthetic official evidence run unexpectedly completed");
}

function expectRetainedArmFailureV1(
  failure: unknown,
  arm: "coarse" | "fine" | null,
  stage: string,
  fineRetained: boolean,
): void {
  expect(failure).toMatchObject({
    arm,
    stage,
    completedArms: {
      coarse: { status: "projection-sealed", grid: "coarse" },
      fine: fineRetained ? { status: "projection-sealed", grid: "fine" } : null,
    },
  });
  const payload =
    createMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyExecutionFailureArtifactPayloadV1(
      failure,
    );
  expect(payload).toMatchObject({
    execution: { failure: { arm, stage } },
    coarse: { status: "projection-sealed", grid: "coarse" },
    fine: fineRetained ? { status: "projection-sealed", grid: "fine" } : null,
    officialSealedMechanicalEnergyAnalysisEligible: false,
    activeDeliveryAbsorptionSplitEstablished: false,
    instantaneousPowerEstablished: false,
  });
  expect(JSON.stringify(payload)).not.toMatch(
    /"measurementInputEvidence"|"materialVolumeBindingPayload"|"ledger"/,
  );
  for (const retainedArm of [payload.coarse, payload.fine]) {
    if (retainedArm === null) continue;
    for (const rawField of [
      "measurementInputEvidence",
      "materialVolumeBindingPayload",
      "bridgeTerminalAcceptedStepSample",
      "sourceCheckpoint",
      "terminalCheckpoint",
      "ledger",
    ]) {
      expect(retainedArm).not.toHaveProperty(rawField);
      expect(retainedArm.projection).not.toHaveProperty(rawField);
    }
    expect(retainedArm).toHaveProperty(
      "hashBindings.sourceCheckpoint.recomputedSha256",
    );
    expect(retainedArm).toHaveProperty(
      "hashBindings.terminalCheckpoint.recomputedSha256",
    );
  }
}

function installSyntheticDependenciesV1(
  coarse: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyResultV1,
  fine: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyResultV1,
): void {
  dependencies.steady.mockImplementation(
    async (options: Readonly<{ nominalDtSec: 0.001 | 0.0005 }>) =>
      Object.freeze({ nominalDtSec: options.nominalDtSec }),
  );
  dependencies.singleArm.mockImplementation(
    async (input: Readonly<{ source: SyntheticSteadySourceV1 }>) =>
      input.source.nominalDtSec === 0.001 ? coarse : fine,
  );
}

async function syntheticPairV1(): Promise<
  Readonly<{
    coarse: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyQualifiedV1;
    fine: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyQualifiedV1;
  }>
> {
  const materialVolumeBindingPayload = Object.freeze({
    priorId: "normal-adult-five-wall-prior-v1",
    priorParameterIdentityHash: "prior-identity",
    provider: mechanicsIdentityV1(),
    wallMaterialVolumeMlByWall: wallRecordV1(() => 1_000),
  });
  const materialVolumeBindingSha256 = await sha256CanonicalJsonHex(
    materialVolumeBindingPayload,
  );
  const coarse = await syntheticQualifiedArmV1({
    nominalDtSec: 0.001,
    componentWorkMilliJ: 0.002,
    protocolIdentityHash: "b".repeat(64),
    checkpointMarker: "coarse",
    materialVolumeBindingPayload,
    materialVolumeBindingSha256,
  });
  const fine = await syntheticQualifiedArmV1({
    nominalDtSec: 0.0005,
    componentWorkMilliJ: 0.001,
    protocolIdentityHash: "c".repeat(64),
    checkpointMarker: "fine",
    materialVolumeBindingPayload,
    materialVolumeBindingSha256,
  });
  return Object.freeze({ coarse, fine });
}

async function syntheticQualifiedArmV1(
  input: Readonly<{
    nominalDtSec: 0.001 | 0.0005;
    componentWorkMilliJ: number;
    protocolIdentityHash: string;
    checkpointMarker: string;
    materialVolumeBindingPayload: Readonly<{
      priorId: string;
      priorParameterIdentityHash: string;
      provider: ReturnType<typeof mechanicsIdentityV1>;
      wallMaterialVolumeMlByWall: MainWireFiveWallMechanicalEnergyWallRecordV1<number>;
    }>;
    materialVolumeBindingSha256: string;
  }>,
): Promise<MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyQualifiedV1> {
  const preceding = mechanicalSampleV1(0, input.componentWorkMilliJ);
  const accepted = mechanicalSampleV1(1, input.componentWorkMilliJ);
  const precedingObservation = acceptedObservationV1({
    sample: preceding,
    cycleIndex: 11,
    stepIndex: 1,
    cycleStartTimeSec: 10,
    cycleEndTimeSec: 11,
    previousRevision: 100,
    acceptedRevision: 101,
    previousTimeSec: 10,
    acceptedTimeSec: 11,
  });
  const measurementObservation = acceptedObservationV1({
    sample: accepted,
    cycleIndex: 12,
    stepIndex: 1,
    cycleStartTimeSec: 11,
    cycleEndTimeSec: 12,
    previousRevision: 101,
    acceptedRevision: 102,
    previousTimeSec: 11,
    acceptedTimeSec: 12,
  });
  const measurementInputEvidence = Object.freeze({
    precedingAcceptedStepObservation: precedingObservation,
    measurementAcceptedStepObservations: Object.freeze([
      measurementObservation,
    ]),
  });
  const sourceCheckpoint = await checkpointV1(
    `${input.checkpointMarker}-source`,
    100,
    10,
  );
  const terminalCheckpoint = await checkpointV1(
    `${input.checkpointMarker}-terminal`,
    102,
    12,
  );
  const ledger =
    remeasureMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceV1({
      precedingAcceptedStepSample: preceding,
      measurementAcceptedStepSamples: [accepted],
      wallMaterialVolumeMlByWall:
        input.materialVolumeBindingPayload.wallMaterialVolumeMlByWall,
    });
  const physicalMetrics = physicalMetricsV1(ledger);
  const algebraicResiduals = algebraicResidualsV1(ledger);
  const conjugacy = conjugacyV1(ledger);
  const externalWork = Object.freeze({
    LV: -0.5 * accepted.chamberTransmuralPressureMmHg.LV,
    RV: -0.5 * accepted.chamberTransmuralPressureMmHg.RV,
  });
  const quadratureBridges =
    remeasureMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyQuadratureBridgesV1(
      {
        precedingAcceptedStepSample: preceding,
        measurementAcceptedStepSamples: [accepted],
        wallMaterialVolumeMlByWall:
          input.materialVolumeBindingPayload.wallMaterialVolumeMlByWall,
        ledger,
        trapezoidalExternalWorkMmHgMl: externalWork,
      },
    );
  const allFiveSls = MAIN_WIRE_FIVE_WALL_MECHANICAL_ENERGY_WALL_IDS_V1.reduce(
    (sum, wallId) =>
      sum +
      ledger.perWall[wallId].parallelSls
        .backwardEulerNumericalDissipationMilliJ,
    0,
  );
  const allFivePassive =
    MAIN_WIRE_FIVE_WALL_MECHANICAL_ENERGY_WALL_IDS_V1.reduce(
      (sum, wallId) =>
        sum +
        ledger.perWall[wallId].equilibriumPassiveBackwardEulerRemainderMilliJ,
      0,
    );
  const rawMechanicalTraceSha256 = await sha256CanonicalJsonHex(
    measurementInputEvidence,
  );
  const bridgeTerminalAcceptedStepSampleSha256 =
    await sha256CanonicalJsonHex(preceding);
  return Object.freeze({
    qualificationId:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_V1_ID,
    status: "qualified-for-refinement-comparison" as const,
    protocolIdentityHash: input.protocolIdentityHash,
    modelConditionIdentityHash: "a".repeat(64),
    executionPurpose: "canonical-evidence" as const,
    numericalAccessId:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_WORK_REFINEMENT_ACCESS_V1_ID,
    requestedMaximumCycleCount: 250,
    nominalDtSec: input.nominalDtSec,
    sourceCycleIndex: 10,
    sourceAcceptedStepCount: 1,
    bridgeCycleIndex: 11,
    bridgeAcceptedStepCount: 1,
    measurementCycleIndex: 12,
    measurementAcceptedStepCount: 1,
    gates: allSingleArmGatesPassedV1(),
    materialVolumeBindingSha256: input.materialVolumeBindingSha256,
    rawMechanicalTraceSha256,
    bridgeTerminalAcceptedStepSampleSha256,
    sourceCheckpointSha256: sourceCheckpoint.checkpointSha256,
    sourceCheckpoint,
    terminalCheckpointSha256: terminalCheckpoint.checkpointSha256,
    bridgeTerminalAcceptedStepSample: preceding,
    measurementAcceptedStepSamples: Object.freeze([accepted]),
    measurementInputEvidence,
    materialVolumeBindingPayload: input.materialVolumeBindingPayload,
    terminalCheckpoint,
    perStepSlsResidualEvidence: Object.freeze({
      assessedAcceptedStepCount: 1,
      assessedWallStepCount: 5,
      maximumAbsoluteReconstructedResidualDensityJPerM3: 0,
      maximumAbsoluteReadbackAgreementResidualDensityJPerM3: 0,
      maximumReconstructedResidualToleranceRatio: 0,
      maximumReadbackAgreementToleranceRatio: 0,
      perWall: wallRecordV1(() =>
        Object.freeze({
          assessedStepCount: 1,
          maximumAbsoluteReconstructedResidualDensityJPerM3: 0,
          maximumAbsoluteReadbackAgreementResidualDensityJPerM3: 0,
          maximumReconstructedResidualToleranceRatio: 0,
          maximumReadbackAgreementToleranceRatio: 0,
        }),
      ),
    }),
    ledger,
    measurementExternalWork: Object.freeze({
      leftVentricle: Object.freeze({
        externalWorkMmHgMl: externalWork.LV,
      }),
      rightVentricle: Object.freeze({
        externalWorkMmHgMl: externalWork.RV,
      }),
    }),
    physicalMetrics,
    allFiveSlsBackwardEulerNumericalDissipationMilliJ: allFiveSls,
    allFiveEquilibriumPassiveBackwardEulerRemainderMilliJ: allFivePassive,
    conjugacy,
    algebraicResiduals,
    quadratureBridges,
    sourceCheckpointExactRoundTripVerified: true as const,
    continuationCheckpointExactRoundTripVerified: true as const,
    failureReasons: Object.freeze([]),
    policy:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_POLICY_V1,
    claim:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_CLAIM_V1,
  }) as unknown as MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyQualifiedV1;
}

function mechanicalSampleV1(
  strain: 0 | 1,
  componentWorkMilliJ: number,
): MainWireFiveWallMechanicalEnergyLedgerAcceptedStepSampleV1 {
  const totalWorkMilliJ = componentWorkMilliJ * 2;
  const conversion =
    MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_POLICY_V1.pressureVolumeConversionMilliJPerMmHgMl;
  return Object.freeze({
    nodeVolumeMl: Object.freeze({
      LA: 10 + strain,
      LV: 20 + strain,
      RA: 30 + strain,
      RV: 40 + strain,
    }),
    chamberTransmuralPressureMmHg: Object.freeze({
      LA: strain === 0 ? 0 : totalWorkMilliJ / conversion,
      LV: strain === 0 ? 0 : (1.5 * totalWorkMilliJ) / conversion,
      RA: strain === 0 ? 0 : totalWorkMilliJ / conversion,
      RV: strain === 0 ? 0 : (1.5 * totalWorkMilliJ) / conversion,
    }),
    commonPericardium: Object.freeze({
      excessPressureMmHg: 0,
      storedEnergyMilliJ: 0,
    }),
    wallStressPa: wallRecordV1(() =>
      Object.freeze({
        total: strain === 0 ? 0 : totalWorkMilliJ,
        landActive: 0,
        equilibriumPassive: strain === 0 ? 0 : componentWorkMilliJ,
        parallelSls: strain === 0 ? 0 : componentWorkMilliJ,
      }),
    ),
    wallFiberLogStrain: wallRecordV1(() => strain),
    wallEnergyLedgerDensity: wallRecordV1(() =>
      Object.freeze({
        equilibriumPassiveStoredEnergyDensityJPerM3: 0,
        slsPreviousStoredEnergyDensityJPerM3: 0,
        slsNextStoredEnergyDensityJPerM3: 0,
        slsPhysicalDissipationIncrementDensityJPerM3: 0,
        slsBackwardEulerNumericalDissipationIncrementDensityJPerM3:
          strain === 0 ? 0 : componentWorkMilliJ,
        slsDiscreteEnergyBalanceResidualJPerM3: 0,
      }),
    ),
  });
}

function acceptedObservationV1(
  input: Readonly<{
    sample: MainWireFiveWallMechanicalEnergyLedgerAcceptedStepSampleV1;
    cycleIndex: number;
    stepIndex: number;
    cycleStartTimeSec: number;
    cycleEndTimeSec: number;
    previousRevision: number;
    acceptedRevision: number;
    previousTimeSec: number;
    acceptedTimeSec: number;
  }>,
) {
  return Object.freeze({
    sample: input.sample,
    source: Object.freeze({
      cycleIndex: input.cycleIndex,
      acceptedStepIndexWithinCycle: input.stepIndex,
      cycleStartTimeSec: input.cycleStartTimeSec,
      cycleEndTimeSec: input.cycleEndTimeSec,
      previousAcceptedRevision: input.previousRevision,
      acceptedRevision: input.acceptedRevision,
      previousAcceptedTimeSec: input.previousTimeSec,
      acceptedTimeSec: input.acceptedTimeSec,
      acceptedDtSec: input.acceptedTimeSec - input.previousTimeSec,
      candidateMaterialStateFingerprint: "0".repeat(8),
      providerReadbackOwner: Object.freeze({
        providerModelId: "main-wire-five-wall-land-triseg-provider-v1",
        solveMode: "trial",
        hiddenBloodVolumeMl: 0,
        pistonVolumeApplied: false,
      }),
      mechanicsIdentity: mechanicsIdentityV1(),
      wallSourceByWall: wallRecordV1((wallId) =>
        Object.freeze({
          adapterId: "synthetic-adapter",
          wallId,
          passiveModelId: "synthetic-passive",
          passiveParameterIdentityHash: "synthetic-passive-identity",
          landParameterSetStableHash: "synthetic-land-identity",
          slsPassive: true,
          landThermodynamicStoredEnergyClaimed: false,
          totalThermodynamicPotentialIncludingLandClaimed: false,
        }),
      ),
    }),
  });
}

function mechanicsIdentityV1() {
  return Object.freeze({
    contractId: "synthetic-contract",
    providerId: "synthetic-provider",
    parameterSetId: "synthetic-parameters",
    parameterIdentityHash: "synthetic-parameter-identity",
    stateSchemaVersion: 1,
  });
}

async function checkpointV1(
  marker: string,
  revision: number,
  acceptedTimeSec: number,
) {
  const payload = Object.freeze({ marker, revision, acceptedTimeSec });
  return Object.freeze({
    ...payload,
    checkpointSha256: await sha256CanonicalJsonHex(payload),
  });
}

function allSingleArmGatesPassedV1() {
  return Object.freeze({
    protocolIdentityValid: true,
    modelConditionIdentityValid: true,
    normalDefaultConditionPassed: true,
    canonicalLatestPeriod1Source: true,
    sourceCycleIntegrityPassed: true,
    sourceCheckpointExactParityPassed: true,
    continuationPeriod1Passed: true,
    acceptedPathTraceComplete: true,
    finiteAcceptedReadback: true,
    materialVolumeIdentityPassed: true,
    mechanicalSourceIdentityPassed: true,
    perStepSlsPassivityPassed: true,
    perStepSlsResidualReconstructionPassed: true,
    cycleIntegratedSlsDissipationNonnegative: true,
    equilibriumPassiveBackwardEulerRemainderNonnegative: true,
    algebraicResidualsPassed: true,
    measurementExternalWorkQualified: true,
    quadratureBridgePassed: true,
    continuationCheckpointExactParityPassed: true,
  });
}

function physicalMetricsV1(
  ledger: MainWireFiveWallMechanicalEnergyLedgerV1,
): readonly MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyPhysicalMetricV1[] {
  const byId = new Map<string, number>();
  for (const wallId of MAIN_WIRE_FIVE_WALL_MECHANICAL_ENERGY_WALL_IDS_V1) {
    const wall = ledger.perWall[wallId];
    byId.set(
      `wall.${wallId}.stress-work.total`,
      wall.stressWorkOnWallMilliJ.total,
    );
    byId.set(
      `wall.${wallId}.stress-work.land-active`,
      wall.stressWorkOnWallMilliJ.landActive,
    );
    byId.set(
      `wall.${wallId}.stress-work.equilibrium-passive`,
      wall.stressWorkOnWallMilliJ.equilibriumPassive,
    );
    byId.set(
      `wall.${wallId}.stress-work.parallel-sls`,
      wall.stressWorkOnWallMilliJ.parallelSls,
    );
    byId.set(
      `wall.${wallId}.equilibrium-passive-stored-energy-change`,
      wall.equilibriumPassiveStoredEnergyChangeMilliJ,
    );
    byId.set(
      `wall.${wallId}.parallel-sls-stored-energy-change`,
      wall.parallelSls.storedEnergyChangeMilliJ,
    );
    byId.set(
      `wall.${wallId}.sls-physical-dissipation`,
      wall.parallelSls.physicalDissipationMilliJ,
    );
  }
  for (const chamber of MAIN_WIRE_FIVE_WALL_MECHANICAL_ENERGY_CHAMBER_IDS_V1) {
    byId.set(
      `cavity.${chamber}.work-on-wall`,
      ledger.cavityWorkOnWallMilliJ[chamber],
    );
  }
  for (const [aggregateId, wallIds] of [
    ["all-five", MAIN_WIRE_FIVE_WALL_MECHANICAL_ENERGY_WALL_IDS_V1],
    ["ventricular-walls", ["LVFW", "SEP", "RVFW"] as const],
  ] as const) {
    for (const [metricSuffix, value] of [
      [
        "stress-work.total",
        sumWallsV1(
          ledger,
          wallIds,
          (wall) => wall.stressWorkOnWallMilliJ.total,
        ),
      ],
      [
        "stress-work.land-active",
        sumWallsV1(
          ledger,
          wallIds,
          (wall) => wall.stressWorkOnWallMilliJ.landActive,
        ),
      ],
      [
        "stress-work.equilibrium-passive",
        sumWallsV1(
          ledger,
          wallIds,
          (wall) => wall.stressWorkOnWallMilliJ.equilibriumPassive,
        ),
      ],
      [
        "stress-work.parallel-sls",
        sumWallsV1(
          ledger,
          wallIds,
          (wall) => wall.stressWorkOnWallMilliJ.parallelSls,
        ),
      ],
      [
        "equilibrium-passive-stored-energy-change",
        sumWallsV1(
          ledger,
          wallIds,
          (wall) => wall.equilibriumPassiveStoredEnergyChangeMilliJ,
        ),
      ],
      [
        "parallel-sls-stored-energy-change",
        sumWallsV1(
          ledger,
          wallIds,
          (wall) => wall.parallelSls.storedEnergyChangeMilliJ,
        ),
      ],
      [
        "sls-physical-dissipation",
        sumWallsV1(
          ledger,
          wallIds,
          (wall) => wall.parallelSls.physicalDissipationMilliJ,
        ),
      ],
    ] as const) {
      byId.set(`aggregate.${aggregateId}.${metricSuffix}`, value);
    }
  }
  return Object.freeze(
    MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_PHYSICAL_METRIC_IDS_V1.map(
      (metricId) =>
        Object.freeze({ metricId, valueMilliJ: byId.get(metricId)! }),
    ),
  );
}

function algebraicResidualsV1(
  ledger: MainWireFiveWallMechanicalEnergyLedgerV1,
): readonly MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyAlgebraicResidualV1[] {
  return Object.freeze(
    MAIN_WIRE_FIVE_WALL_MECHANICAL_ENERGY_WALL_IDS_V1.flatMap((wallId) => {
      const wall = ledger.perWall[wallId];
      return [
        ["stress-assembly", wall.stressAssemblyResidualMilliJ],
        [
          "parallel-sls.reported-balance",
          wall.parallelSls.reportedDiscreteBalanceResidualMilliJ,
        ],
        [
          "parallel-sls.reconstructed-balance",
          wall.parallelSls.reconstructedDiscreteBalanceResidualMilliJ,
        ],
        [
          "parallel-sls.readback-agreement",
          wall.parallelSls.readbackAgreementResidualMilliJ,
        ],
      ].map(([suffix, valueMilliJ]) =>
        Object.freeze({
          residualId: `wall.${wallId}.${suffix}`,
          valueMilliJ: valueMilliJ as number,
          passed: Math.abs(valueMilliJ as number) <= 1e-8,
        }),
      );
    }),
  );
}

function conjugacyV1(
  ledger: MainWireFiveWallMechanicalEnergyLedgerV1,
): readonly MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyConjugacyV1[] {
  const wall = ledger.perWall;
  const cavity = ledger.cavityWorkOnWallMilliJ;
  const ventricularWall =
    wall.LVFW.stressWorkOnWallMilliJ.total +
    wall.SEP.stressWorkOnWallMilliJ.total +
    wall.RVFW.stressWorkOnWallMilliJ.total;
  const ventricularCavity = cavity.LV + cavity.RV;
  const allWall =
    wall.LA.stressWorkOnWallMilliJ.total +
    ventricularWall +
    wall.RA.stressWorkOnWallMilliJ.total;
  const allCavity = cavity.LA + ventricularCavity + cavity.RA;
  return Object.freeze([
    conjugacyEntryV1(
      "left-atrium",
      wall.LA.stressWorkOnWallMilliJ.total,
      cavity.LA,
    ),
    conjugacyEntryV1(
      "right-atrium",
      wall.RA.stressWorkOnWallMilliJ.total,
      cavity.RA,
    ),
    conjugacyEntryV1("ventricles-combined", ventricularWall, ventricularCavity),
    conjugacyEntryV1("whole-heart", allWall, allCavity),
  ]);
}

function conjugacyEntryV1(
  aggregateId: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyConjugacyV1["aggregateId"],
  wallWorkMilliJ: number,
  cavityWorkMilliJ: number,
) {
  return Object.freeze({
    aggregateId,
    residualMilliJ: wallWorkMilliJ - cavityWorkMilliJ,
    wallWorkMilliJ,
    cavityWorkMilliJ,
  });
}

function sumWallsV1(
  ledger: MainWireFiveWallMechanicalEnergyLedgerV1,
  wallIds: readonly (typeof MAIN_WIRE_FIVE_WALL_MECHANICAL_ENERGY_WALL_IDS_V1)[number][],
  select: (
    wall: MainWireFiveWallMechanicalEnergyLedgerV1["perWall"]["LA"],
  ) => number,
): number {
  return wallIds.reduce(
    (sum, wallId) => sum + select(ledger.perWall[wallId]),
    0,
  );
}

function wallRecordV1<T>(
  build: (
    wallId: (typeof MAIN_WIRE_FIVE_WALL_MECHANICAL_ENERGY_WALL_IDS_V1)[number],
  ) => T,
): MainWireFiveWallMechanicalEnergyWallRecordV1<T> {
  return Object.freeze(
    Object.fromEntries(
      MAIN_WIRE_FIVE_WALL_MECHANICAL_ENERGY_WALL_IDS_V1.map((wallId) => [
        wallId,
        build(wallId),
      ]),
    ),
  ) as MainWireFiveWallMechanicalEnergyWallRecordV1<T>;
}

function tamperPreimageV1(
  source: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyQualifiedV1,
  owner:
    | "source checkpoint"
    | "terminal checkpoint"
    | "raw trace"
    | "bridge sample"
    | "material binding",
): MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyQualifiedV1 {
  if (owner === "source checkpoint") {
    return Object.freeze({
      ...source,
      sourceCheckpoint: Object.freeze({
        ...source.sourceCheckpoint,
        syntheticTamper: true,
      }),
    }) as MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyQualifiedV1;
  }
  if (owner === "terminal checkpoint") {
    return Object.freeze({
      ...source,
      terminalCheckpoint: Object.freeze({
        ...source.terminalCheckpoint,
        syntheticTamper: true,
      }),
    }) as MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyQualifiedV1;
  }
  if (owner === "raw trace") {
    return Object.freeze({
      ...source,
      measurementInputEvidence: Object.freeze({
        ...source.measurementInputEvidence,
        syntheticTamper: true,
      }),
    }) as MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyQualifiedV1;
  }
  if (owner === "bridge sample") {
    return Object.freeze({
      ...source,
      bridgeTerminalAcceptedStepSample: Object.freeze({
        ...source.bridgeTerminalAcceptedStepSample,
        syntheticTamper: true,
      }),
    }) as MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyQualifiedV1;
  }
  return Object.freeze({
    ...source,
    materialVolumeBindingPayload: Object.freeze({
      ...source.materialVolumeBindingPayload,
      syntheticTamper: true,
    }),
  }) as MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyQualifiedV1;
}

function expectUnsealedOfficialFailureV1(
  result: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceV1,
  expectedFailure: string,
): void {
  expect(result.status).toBe("evidence-verification-failed");
  expect(result.coarse.status).toBe("not-sealed");
  expect(result.coarse.failureReasons).toContain(expectedFailure);
  expect(result.admission).toBeNull();
  expect(result.pairSealedPayloadSha256).toBeNull();
  expect(result.officialSealedMechanicalEnergyAnalysisEligible).toBe(false);
}
