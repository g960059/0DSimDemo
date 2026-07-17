import { describe, expect, it } from "vitest";
import {
  NON_CORONARY_CIRCULATION_BE_V1_ID,
} from "@/engine/core/nonCoronaryCirculationBackwardEulerV1";
import {
  MAIN_WIRE_FIVE_WALL_NONCORONARY_TRANSACTION_V1_ID,
} from "@/engine/myocardium/MainWireFiveWallNonCoronaryTransactionV1";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_V1_ID,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_DIAGNOSTIC_SAMPLE_V2_ID,
} from "@/engine/myocardium/diagnostics/MainWireNormalAdultFiveWallDiagnosticSampleV2";
import {
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CLOSED_LOOP_V1_ID,
  normalAdultMainWireRuntimeV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";
import {
  resolveMainWireNormalAdultBloodVolumeOperatingPointV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultBloodVolumeOperatingPointV1";
import {
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_STEADY_V1_ID,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  MAIN_WIRE_FIVE_WALL_LAND_TRISEG_PROVIDER_V1_ID,
} from "@/engine/myocardium/mechanics/MainWireFiveWallLandTriSegProviderV1";
import {
  createMainWireNormalAdultCommonPericardiumV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultCommonPericardiumV1";
import {
  NORMAL_ADULT_FIVE_WALL_PRIOR_V1,
} from "@/engine/myocardium/mechanics/normalAdultFiveWallPriorV1";
import {
  MAIN_WIRE_FOUR_VALVE_DISEASE_BRACKETS_V1,
  MAIN_WIRE_FOUR_VALVE_DISEASE_PRESETS_V1,
  MAIN_WIRE_FOUR_VALVE_NORMAL_PRESET_V1,
} from "@/engine/mechanics2/valve/MainWireFourValveDiseasePresetV1";
import {
  MAIN_WIRE_QUASI_STEADY_ORIFICE_VALVE_V2_ID,
} from "@/engine/mechanics2/valve/MainWireQuasiSteadyOrificeValveV2";
import {
  createMainWireAdultFiveWallNonCoronaryReleaseV1,
  MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_EVIDENCE_V1,
  MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_INITIALIZATION_PROTOCOL_V1_ID,
  MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_RELEASE_V1_ID,
  MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_RELEASE_V1_VERSION,
  MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_SOURCE_V1,
  mainWireAdultFiveWallNonCoronaryReleaseInputV1,
} from "@/engine/scientific/assembly";
import {
  CanonicalJsonError,
  canonicalJsonStringify,
  createSimulationReleaseV1,
  loadSimulationReleaseRefV1,
  loadSimulationReleaseV1,
  sameSimulationReleaseRefV1,
  sha256CanonicalJsonHex,
  type SimulationReleaseV1,
  SimulationReleaseValidationError,
} from "@/engine/scientific/release";

describe("canonical release JSON", () => {
  it("orders object keys recursively and has a known SHA-256 identity", async () => {
    const first = { b: 2, a: 1 };
    const second = Object.assign(Object.create(null), { a: 1, b: 2 });

    expect(canonicalJsonStringify(first)).toBe('{"a":1,"b":2}');
    expect(canonicalJsonStringify(second)).toBe(canonicalJsonStringify(first));
    await expect(sha256CanonicalJsonHex(first)).resolves.toBe(
      "43258cff783fe7036d8a43033f830adfc60ec037382473548ac742b888292777",
    );
    await expect(sha256CanonicalJsonHex(second)).resolves.toBe(
      "43258cff783fe7036d8a43033f830adfc60ec037382473548ac742b888292777",
    );
  });

  it("rejects values JSON.stringify would silently omit or coerce", () => {
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    const sparse = Array(1);
    const accessor = {};
    Object.defineProperty(accessor, "hiddenComputation", {
      enumerable: true,
      get: () => 1,
    });
    class NotJson {
      value = 1;
    }

    const rejected = [
      { value: undefined },
      { value: Number.NaN },
      { value: Number.POSITIVE_INFINITY },
      { value: 1n },
      { value: Symbol("hidden") },
      { value: "\ud800" },
      cyclic,
      sparse,
      accessor,
      new NotJson(),
    ];
    for (const value of rejected) {
      expect(() => canonicalJsonStringify(value)).toThrow(CanonicalJsonError);
    }
  });
});

describe("SimulationRelease V1", () => {
  it("pins current main-wire identities in separated immutable sections", async () => {
    const canonicalInput = mainWireAdultFiveWallNonCoronaryReleaseInputV1();
    const secondCanonicalInput = mainWireAdultFiveWallNonCoronaryReleaseInputV1();
    expect(canonicalInput).not.toBe(secondCanonicalInput);
    expect(Object.isFrozen(canonicalInput)).toBe(true);
    expect(Object.isFrozen(canonicalInput.scientificModel.snapshot)).toBe(true);

    const input = mutableReleaseInput();
    const originalTransactionId = (
      input.scientificModel.snapshot as { transaction: { id: string } }
    ).transaction.id;
    const release = await createSimulationReleaseV1(input);
    const productionRelease =
      await createMainWireAdultFiveWallNonCoronaryReleaseV1();
    expect(productionRelease).toEqual(release);

    expect(release.ref).toEqual({
      id: MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_RELEASE_V1_ID,
      version: MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_RELEASE_V1_VERSION,
      sha256: expect.stringMatching(/^[0-9a-f]{64}$/),
    });
    expect(release.ref.sha256).toBe(
      await sha256CanonicalJsonHex(release.manifest),
    );
    expect(release.manifest.lifecycleStatus).toBe("candidate");
    expect(release.manifest.evidenceStatus).toBe("verified-research");
    expect(release.manifest.evidence).toMatchObject({
      evidenceSetId:
        MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_EVIDENCE_V1.evidenceSetId,
      evidenceSetVersion:
        MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_EVIDENCE_V1.evidenceSetVersion,
      status: "verified-research",
      snapshot: {
        artifactPath:
          "data/scientific/releases/0.1.0/oracle-pack-v1.json",
        source: {
          commitSha: "f229143d5e7cb728227dd41d07d55e186c131063",
        },
        clinicalValidationClaimed: false,
      },
    });
    expect(release.manifest.identityPolicy.legacyStableHash32)
      .toBe("cache-only-never-release-identity");
    expect(release.manifest.scientificModel.snapshot).toMatchObject({
      capabilities: {
        scientificCore: "single-atomic-main-wire-transaction",
        commonPericardium: true,
        valveBulkFlowState: false,
      },
      transaction: { id: MAIN_WIRE_FIVE_WALL_NONCORONARY_TRANSACTION_V1_ID },
      mechanics: { providerId: MAIN_WIRE_FIVE_WALL_LAND_TRISEG_PROVIDER_V1_ID },
      activation: { driveId: FIVE_WALL_NORMAL_CALCIUM_DRIVE_V1_ID },
      valve: { modelId: MAIN_WIRE_QUASI_STEADY_ORIFICE_VALVE_V2_ID },
    });
    const scientificSnapshot = release.manifest.scientificModel.snapshot as any;
    const numericalSnapshot = release.manifest.numericalRuntime.snapshot as any;
    const expectedRuntime = normalAdultMainWireRuntimeV1();
    const expectedBloodVolume =
      resolveMainWireNormalAdultBloodVolumeOperatingPointV1(expectedRuntime);
    expect(scientificSnapshot.implementationProvenance)
      .toEqual(MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_SOURCE_V1);
    expect(numericalSnapshot.implementationProvenance)
      .toEqual(MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_SOURCE_V1);
    expect(scientificSnapshot.mechanics.resolvedNormalAdultPrior)
      .toEqual(NORMAL_ADULT_FIVE_WALL_PRIOR_V1);
    expect(numericalSnapshot.fixedHealthyRuntime).toEqual(expectedRuntime);
    expect(scientificSnapshot.commonPericardium).toEqual({
      mode: "on",
      caseId: "healthy-slack",
      resolvedBinding: createMainWireNormalAdultCommonPericardiumV1(
        "on",
        "healthy-slack",
      ),
    });
    expect(scientificSnapshot.initialization.bloodVolumeOperatingPoint)
      .toEqual({
        identity: expectedBloodVolume.identity,
        fixedTotalBloodVolumeMl: expectedBloodVolume.fixedTotalBloodVolumeMl,
        resolvedNodeVolumesMl: expectedBloodVolume.nodeVolumesMl,
        audit: expectedBloodVolume.audit,
      });
    expect(scientificSnapshot.valve.healthyPreset)
      .toEqual(MAIN_WIRE_FOUR_VALVE_NORMAL_PRESET_V1);
    expect(scientificSnapshot.valve.researchBracketCatalog)
      .toEqual(MAIN_WIRE_FOUR_VALVE_DISEASE_BRACKETS_V1);
    expect(scientificSnapshot.valve.researchPresetCatalog)
      .toEqual(MAIN_WIRE_FOUR_VALVE_DISEASE_PRESETS_V1);
    expect(release.manifest.numericalRuntime.snapshot).toMatchObject({
      circulationSolverId: NON_CORONARY_CIRCULATION_BE_V1_ID,
    });
    expect(release.manifest.stateSchema.snapshot).toMatchObject({
      transactionId: MAIN_WIRE_FIVE_WALL_NONCORONARY_TRANSACTION_V1_ID,
      valveAcceptedMemory: "leaflet-opening-fraction-only",
    });
    expect(release.manifest.observableSchema.snapshot).toMatchObject({
      diagnosticSampleId:
        MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_DIAGNOSTIC_SAMPLE_V2_ID,
    });
    expect(release.manifest.approvedProtocols.map(({ protocolId }) => protocolId))
      .toEqual([
        MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CLOSED_LOOP_V1_ID,
        MAIN_WIRE_ADULT_FIVE_WALL_NONCORONARY_INITIALIZATION_PROTOCOL_V1_ID,
        MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_STEADY_V1_ID,
      ]);
    expect(release.manifest.claims).toEqual([
      "atomic whole-system commit and rollback",
      "non-coronary verified-research release",
    ]);
    expect(Object.isFrozen(release)).toBe(true);
    expect(Object.isFrozen(release.ref)).toBe(true);
    expect(Object.isFrozen(release.manifest)).toBe(true);
    expect(Object.isFrozen(release.manifest.scientificModel.snapshot)).toBe(true);
    expect(Object.isFrozen(
      release.manifest.scientificModel.snapshot.transaction as object,
    )).toBe(true);

    (input.scientificModel.snapshot as { transaction: { id: string } })
      .transaction.id = "mutated-after-release";
    expect(originalTransactionId).toBe(
      MAIN_WIRE_FIVE_WALL_NONCORONARY_TRANSACTION_V1_ID,
    );
    expect((release.manifest.scientificModel.snapshot.transaction as { id: string }).id)
      .toBe(MAIN_WIRE_FIVE_WALL_NONCORONARY_TRANSACTION_V1_ID);

    const loaded = await loadSimulationReleaseV1(JSON.parse(JSON.stringify(release)));
    expect(loaded).toEqual(release);
    expect(Object.isFrozen(loaded.manifest.approvedProtocols[0].snapshot)).toBe(true);
    expect(sameSimulationReleaseRefV1(loaded.ref, release.ref)).toBe(true);
    const standaloneRef = loadSimulationReleaseRefV1(JSON.parse(JSON.stringify(release.ref)));
    expect(standaloneRef).toEqual(release.ref);
    expect(Object.isFrozen(standaloneRef)).toBe(true);
  });

  it("produces the same release identity across input property/protocol order", async () => {
    const firstInput = mutableReleaseInput();
    const secondInput = mutableReleaseInput();
    secondInput.approvedProtocols.reverse();
    (secondInput.scientificModel as { snapshot: unknown }).snapshot =
      reverseObjectKeys(secondInput.scientificModel.snapshot);

    const first = await createSimulationReleaseV1(firstInput);
    const second = await createSimulationReleaseV1(secondInput);
    expect(second.ref).toEqual(first.ref);
    expect(canonicalJsonStringify(second.manifest))
      .toBe(canonicalJsonStringify(first.manifest));
  });

  it("fails closed for manifest/ref tampering and legacy 32-bit hashes", async () => {
    const invalidInput = {
      ...mutableReleaseInput(),
      version: "0.1",
      silentFallback: true,
    };
    await expect(createSimulationReleaseV1(invalidInput as any)).rejects.toThrow(
      /manifest input.silentFallback is not allowed/,
    );
    const conflatedStatus = mutableReleaseInput();
    conflatedStatus.lifecycleStatus = "verified-research";
    await expect(createSimulationReleaseV1(conflatedStatus)).rejects.toThrow(
      /manifest.lifecycleStatus is unsupported/,
    );
    const mismatchedEvidence = mutableReleaseInput();
    mismatchedEvidence.evidenceStatus = "unverified";
    await expect(createSimulationReleaseV1(mismatchedEvidence)).rejects.toThrow(
      /manifest.evidence.status must match manifest.evidenceStatus/,
    );

    const release = await createMainWireAdultFiveWallNonCoronaryReleaseV1();

    const manifestTamper = mutableRelease(release);
    manifestTamper.manifest.scientificModel.snapshot.transaction = {
      id: "tampered-transaction",
    };
    await expect(loadSimulationReleaseV1(manifestTamper)).rejects.toMatchObject({
      issues: ["ref.sha256 does not match the canonical manifest digest"],
    });

    const refTamper = mutableRelease(release);
    refTamper.ref.id = "circleheart/different-release";
    await expect(loadSimulationReleaseV1(refTamper)).rejects.toThrow(
      SimulationReleaseValidationError,
    );

    const legacyHash = mutableRelease(release);
    legacyHash.ref.sha256 = "deadbeef";
    await expect(loadSimulationReleaseV1(legacyHash)).rejects.toThrow(
      /lowercase 64-character SHA-256/,
    );
    expect(() => loadSimulationReleaseRefV1(legacyHash.ref)).toThrow(
      /lowercase 64-character SHA-256/,
    );

    const unknownField = mutableRelease(release) as Record<string, unknown>;
    unknownField.silentFallback = true;
    await expect(loadSimulationReleaseV1(unknownField)).rejects.toThrow(
      /release.silentFallback is not allowed/,
    );
  });

  it("rejects semantically non-canonical protocol ordering even with a valid digest", async () => {
    const release = await createMainWireAdultFiveWallNonCoronaryReleaseV1();
    const reordered = mutableRelease(release);
    reordered.manifest.approvedProtocols.reverse();
    reordered.ref.sha256 = await sha256CanonicalJsonHex(reordered.manifest);

    await expect(loadSimulationReleaseV1(reordered)).rejects.toThrow(
      /approvedProtocols must be sorted/,
    );
  });
});

function mutableReleaseInput(): any {
  return JSON.parse(JSON.stringify(
    mainWireAdultFiveWallNonCoronaryReleaseInputV1(),
  ));
}

function mutableRelease(release: SimulationReleaseV1): any {
  return JSON.parse(JSON.stringify(release));
}

function reverseObjectKeys(value: unknown): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).reverse());
}
