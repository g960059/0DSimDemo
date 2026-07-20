import { describe, expect, it, vi } from "vitest";

import {
  SCIENTIFIC_PRODUCT_QUICK_CHECK_PROVENANCE_V1,
  ScientificProductQuickCheckCoordinatorV1,
  type ScientificProductQuickCheckClientV1,
  type ScientificProductQuickCheckCompleteEventV1,
  type ScientificProductQuickCheckErrorEventV1,
} from "@/components/scientificProduct/ScientificProductQuickCheckCoordinatorV1";
import {
  SCIENTIFIC_PRODUCT_CASE_CATALOG_V1,
} from "@/components/scientificProduct/scientificProductCaseCatalogV1";
import {
  createMainWireScientificQuickCheckCoordinatorV1,
} from "@/components/scientificVerification/MainWireScientificQuickCheckCoordinatorV1";
import {
  MainWireScientificQuickCheckVerificationErrorV1,
  evaluateMainWireScientificQuickCheckV1,
  type MainWireScientificQuickCheckInputV1,
  type MainWireScientificQuickCheckResultV1,
} from "@/components/scientificVerification/MainWireScientificQuickCheckDomainV1";
import type {
  ScientificWorkbenchResearchControlSnapshotV0,
} from "@/components/scientificWorkbench/ScientificWorkbenchResearchControlStoreV0";
import {
  createMainWireScientificResearchControlBaselineTargetStateV0,
  createMainWireScientificResearchControlTargetStateV0,
  type MainWireScientificResearchControlTargetStateV0,
} from "@/engine/scientific/controls/MainWireScientificResearchControlTargetStateV0";
import {
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_CATALOG_V1,
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_FRAME_V1_ID,
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_ID,
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_SCHEMA_VERSION,
  type MainWireScientificObservableFrameV1,
  type MainWireScientificObservableIdV1,
} from "@/engine/scientific/observables";
import type {
  MainWireScientificSessionObservationV1,
} from "@/engine/scientific/runtime/MainWireScientificSessionV1";
import type {
  ScientificCommandV1,
  ScientificResearchControlContextV0,
} from "@/engine/scientific/worker/scientificCommandProtocolV1";
import type {
  MainWireScientificWorkerResponseV1,
} from "@/engine/scientificBrowser/MainWireScientificWorkerClientV1";

const TEST_RELEASE = Object.freeze({
  id: "quick-check-test-release",
  version: "0.0.0",
  sha256: "a".repeat(64),
});
const HASH_A = "1".repeat(64);
const HASH_B = "2".repeat(64);
const HASH_C = "3".repeat(64);
const HASH_D = "4".repeat(64);

describe("main-wire scientific Quick Check V1", () => {
  it("evaluates diagnostics only on a complete existing P1 following cycle", () => {
    const frames = followingCycleFramesV1(10_000, 20, {
      boundaryMechanicsResidual: 99,
    });
    const result = evaluateMainWireScientificQuickCheckV1(
      quickCheckInputV1(HASH_A, frames),
    );

    expect(result.status).toBe("findings");
    expect(result.evidence).toMatchObject({
      cycleContract: "verified-existing-period1-following-cycle",
      periodicSteadyStateEvidencePresent: true,
      frameCount: 501,
      acceptedStepFrameCount: 500,
    });
    expect(result.numericalIntegrity.assessmentScope).toBe(
      "verified-existing-period1-following-cycle",
    );
    expect(result.numericalIntegrity.metrics.find(({ observableId }) =>
      observableId === "solver.mechanics.residual_norm"
    )).toMatchObject({
      maximumAbsoluteValue: 1e-9,
      availability: "complete",
      withinQuickThreshold: true,
      acceptedStepCount: 500,
    });
    expect(result.summary.errorCount).toBe(0);
    expect(result.observables.unavailableModeledObservableIds).toEqual([]);
    expect(result.observables.declaredNotModeledObservableIds).toEqual([
      "coronary.flow.total",
      "device.LVAD.flow",
    ]);
    expect(result.claim).toMatchObject({
      fullVerificationAndValidationClaimed: false,
      physiologyAcceptanceClaimed: false,
      timeStepRefinementClaimed: false,
      multiStartOrBasinEvidenceClaimed: false,
    });
  });

  it("withholds transient diagnostics and fails closed on malformed P1 evidence", () => {
    const transientFrames = [observableFrameV1(
      10,
      1,
      "accepted-step",
      { "solver.mechanics.residual_norm": 100 },
    )];
    const transient = evaluateMainWireScientificQuickCheckV1(
      quickCheckInputV1(
        HASH_A,
        transientFrames,
        "open-transient-no-periodic-claim",
      ),
    );
    expect(transient.numericalIntegrity.assessmentScope).toBe(
      "not-assessed-open-transient",
    );
    expect(transient.numericalIntegrity.metrics.every((metric) =>
      metric.maximumAbsoluteValue === null
      && metric.withinQuickThreshold === null
    )).toBe(true);
    expect(transient.findings.map(({ code }) => code)).toEqual([
      "open-transient-has-no-periodic-claim",
      "steady-state-diagnostics-withheld",
    ]);
    expect(transient.summary.errorCount).toBe(0);

    const excessive = evaluateMainWireScientificQuickCheckV1(
      quickCheckInputV1(
        HASH_A,
        followingCycleFramesV1(100, 2, {
          acceptedMechanicsResidual: 1e-4,
        }),
      ),
    );
    expect(excessive.findings).toContainEqual(expect.objectContaining({
      code: "numerical-threshold-exceeded",
      severity: "error",
      observableIds: ["solver.mechanics.residual_norm"],
    }));

    const malformed = followingCycleFramesV1(1_000, 4).slice(0, -1);
    expect(() => evaluateMainWireScientificQuickCheckV1(
      quickCheckInputV1(HASH_A, malformed),
    )).toThrow(MainWireScientificQuickCheckVerificationErrorV1);
  });

  it("ignores draft-only updates and enforces committed latest-wins plus cache", async () => {
    const snapshotA = presentationSnapshotV1(
      HASH_A,
      followingCycleFramesV1(1_000, 10),
      1,
    );
    const store = new FakePresentationStoreV1(snapshotA);
    const evaluations: Array<Readonly<{
      input: MainWireScientificQuickCheckInputV1;
      deferred: DeferredV1<MainWireScientificQuickCheckResultV1>;
    }>> = [];
    const coordinator = createMainWireScientificQuickCheckCoordinatorV1(
      store,
      {
        evaluate: (input) => {
          const deferred = deferredV1<MainWireScientificQuickCheckResultV1>();
          evaluations.push({ input, deferred });
          return deferred.promise;
        },
      },
    );
    await waitForV1(() => evaluations.length === 1);
    evaluations[0]!.deferred.resolve(
      evaluateMainWireScientificQuickCheckV1(evaluations[0]!.input),
    );
    await waitForV1(() => coordinator.getSnapshot().status === "findings");

    store.publish(Object.freeze({
      ...snapshotA,
      draft: Object.freeze({ ...snapshotA.draft, venousTone: 1.2 }),
    }));
    await flushV1();
    expect(evaluations).toHaveLength(1);

    const waitingB = Object.freeze({
      ...snapshotA,
      targetControlStateSha256: HASH_B,
    });
    store.publish(waitingB);
    expect(coordinator.getSnapshot()).toMatchObject({
      status: "checking",
      waitingForCommittedEvidence: true,
      requestedIdentity: { committedControlStateSha256: HASH_B },
    });
    expect(evaluations).toHaveLength(1);

    const snapshotB = presentationSnapshotV1(
      HASH_B,
      followingCycleFramesV1(2_000, 12),
      2,
    );
    store.publish(snapshotB);
    await waitForV1(() => evaluations.length === 2);
    const snapshotC = presentationSnapshotV1(
      HASH_C,
      followingCycleFramesV1(3_000, 14),
      3,
    );
    store.publish(snapshotC);
    await waitForV1(() => evaluations.length === 3);

    evaluations[1]!.deferred.resolve(
      evaluateMainWireScientificQuickCheckV1(evaluations[1]!.input),
    );
    await flushV1();
    expect(coordinator.getSnapshot()).toMatchObject({
      status: "checking",
      requestedIdentity: { committedControlStateSha256: HASH_C },
    });
    evaluations[2]!.deferred.resolve(
      evaluateMainWireScientificQuickCheckV1(evaluations[2]!.input),
    );
    await waitForV1(() => coordinator.getSnapshot().status === "findings");
    expect(coordinator.getSnapshot().result?.source.committedControlStateSha256)
      .toBe(HASH_C);

    store.publish(snapshotA);
    await waitForV1(() => coordinator.getSnapshot().cacheHit);
    expect(evaluations).toHaveLength(3);
    expect(coordinator.getSnapshot().result?.source.committedControlStateSha256)
      .toBe(HASH_A);

    store.publish(presentationSnapshotV1(
      HASH_D,
      followingCycleFramesV1(4_000, 16),
      4,
    ));
    await waitForV1(() => evaluations.length === 4);
    evaluations[3]!.deferred.reject(new Error("verification exploded"));
    await waitForV1(() =>
      coordinator.getSnapshot().status === "verification-error"
    );
    expect(coordinator.getSnapshot().errorMessage).toContain(
      "verification exploded",
    );

    coordinator.dispose();
    expect(store.listenerCount).toBe(0);
  });
});

describe("scientific product hidden Worker Quick Check V1", () => {
  it("forks the committed target, captures the complete following P1 cycle, and caches by hash", async () => {
    const fixture = await targetFixtureV1();
    const client = new FakeQuickCheckClientV1(fixture.baseline);
    const completions: ScientificProductQuickCheckCompleteEventV1[] = [];
    const errors: ScientificProductQuickCheckErrorEventV1[] = [];
    const coordinator = hiddenCoordinatorV1(client, completions, errors);

    coordinator.requestLatest(hiddenRequestV1("target-a", 1, fixture.targetA));
    await waitForV1(() => completions.length === 1);

    const first = completions[0]!;
    expect(errors).toEqual([]);
    expect(first).toMatchObject({
      requestToken: "target-a",
      cacheHit: false,
      evidence: {
        provenance: SCIENTIFIC_PRODUCT_QUICK_CHECK_PROVENANCE_V1,
        targetControlStateSha256: fixture.targetA.targetStateSha256,
        periodicSteadyStateClaimed: true,
        period2OrbitSuspected: false,
        followingCompleteCycleCaptured: true,
        claim: {
          quickPeriod1VerificationOnly: true,
          committedTargetSteadyStateDiagnosticsOnly: true,
          fullVerificationAndValidationClaimed: false,
          physiologyAcceptanceClaimed: false,
          timeStepRefinementClaimed: false,
          multiStartEvidenceClaimed: false,
        },
      },
    });
    expect(first.evidence.periodicity.status).toBe("period1-converged");
    expect(first.evidence.terminalCycle.frames).toHaveLength(501);
    expect(first.evidence.terminalCycle.frames[0]).toBe(
      first.evidence.period1BoundaryFrame,
    );
    expect(first.evidence.terminalCycle.frames.at(-1)).toBe(
      first.evidence.finalObservableFrame,
    );
    expect(client.commands.filter(({ kind }) => kind === "runTransient"))
      .toHaveLength(125);
    expect(client.commands.some(({ kind }) =>
      kind === "startGuytonStarlingProtocolJob"
    )).toBe(false);

    const domainSummary = evaluateMainWireScientificQuickCheckV1({
      source: Object.freeze({
        releaseRef: first.evidence.releaseRef,
        committedControlStateSha256:
          first.evidence.targetControlStateSha256,
        parameterEpoch: first.evidence.parameterEpoch,
        displayedFrameOwner: "candidate",
        firstRevision: first.evidence.terminalCycle.firstRevision,
        finalRevision: first.evidence.terminalCycle.finalRevision,
        firstAcceptedTimeSec:
          first.evidence.terminalCycle.firstAcceptedTimeSec,
        finalAcceptedTimeSec:
          first.evidence.terminalCycle.finalAcceptedTimeSec,
      }),
      displayedEvidence: "target-period1-and-following-cycle-validated",
      frames: first.evidence.terminalCycle.frames,
    });
    expect(domainSummary.numericalIntegrity.assessmentScope).toBe(
      "verified-existing-period1-following-cycle",
    );
    expect(domainSummary.summary.errorCount).toBe(0);

    const commandCount = client.commands.length;
    coordinator.requestLatest(hiddenRequestV1("target-a-repeat", 2, fixture.targetA));
    await waitForV1(() => completions.length === 2);
    expect(completions[1]).toMatchObject({
      requestToken: "target-a-repeat",
      cacheHit: true,
    });
    expect(client.commands).toHaveLength(commandCount);

    await coordinator.dispose();
    expect(client.terminate).toHaveBeenCalledOnce();
  });

  it("coalesces an in-flight same-hash request and publishes its latest token", async () => {
    const fixture = await targetFixtureV1();
    const client = new FakeQuickCheckClientV1(fixture.baseline);
    const settlementGate = deferredV1<void>();
    client.nextSettlementGate = settlementGate;
    const completions: ScientificProductQuickCheckCompleteEventV1[] = [];
    const coordinator = hiddenCoordinatorV1(client, completions, []);

    coordinator.requestLatest(hiddenRequestV1("first", 1, fixture.targetA));
    await waitForV1(() => client.commands.some(({ kind }) =>
      kind === "settlePeriodic"
    ));
    coordinator.requestLatest(hiddenRequestV1("latest", 2, fixture.targetA));
    settlementGate.resolve();
    await waitForV1(() => completions.length === 1);

    expect(completions[0]?.requestToken).toBe("latest");
    expect(client.commands.filter(({ kind }) =>
      kind === "forkResearchControlSession"
    )).toHaveLength(1);
    expect(client.commands.filter(({ kind }) => kind === "settlePeriodic"))
      .toHaveLength(1);
    await coordinator.dispose();
  });

  it("reports a coalesced same-hash failure against the latest visible identity", async () => {
    const fixture = await targetFixtureV1();
    const client = new FakeQuickCheckClientV1(fixture.baseline);
    const settlementGate = deferredV1<void>();
    client.nextSettlementGate = settlementGate;
    client.nextSettlementStatus = "period2-suspect";
    const errors: ScientificProductQuickCheckErrorEventV1[] = [];
    const coordinator = hiddenCoordinatorV1(client, [], errors);

    coordinator.requestLatest(hiddenRequestV1("first", 1, fixture.targetA));
    await waitForV1(() => client.commands.some(({ kind }) =>
      kind === "settlePeriodic"
    ));
    coordinator.requestLatest(hiddenRequestV1("latest", 2, fixture.targetA));
    settlementGate.resolve();
    await waitForV1(() => errors.length === 1);

    expect(errors[0]).toMatchObject({
      requestToken: "latest",
      visibleParameterEpoch: 2,
      visibleControlStateSha256: fixture.targetA.targetStateSha256,
      phase: "settlement",
    });
    await coordinator.dispose();
  });

  it("rebuilds the hidden Worker after a failed check and verifies the next commit", async () => {
    const fixture = await targetFixtureV1();
    const failedClient = new FakeQuickCheckClientV1(fixture.baseline);
    failedClient.failNextSettlement = true;
    const recoveredClient = new FakeQuickCheckClientV1(fixture.baseline);
    const clients = [failedClient, recoveredClient];
    let createdClientCount = 0;
    const completions: ScientificProductQuickCheckCompleteEventV1[] = [];
    const errors: ScientificProductQuickCheckErrorEventV1[] = [];
    const coordinator = new ScientificProductQuickCheckCoordinatorV1({
      caseEntry: SCIENTIFIC_PRODUCT_CASE_CATALOG_V1[0]!,
      createClient: () => clients[createdClientCount++]!,
      loadBootstrapSource: async (_caseEntry, loadedClient) =>
        (loadedClient as FakeQuickCheckClientV1).bootstrapSource,
      onComplete: (event) => completions.push(event),
      onError: (event) => errors.push(event),
    });

    coordinator.requestLatest(hiddenRequestV1("fails", 1, fixture.targetA));
    await waitForV1(() => errors.length === 1);
    expect(errors[0]?.phase).toBe("settlement");
    expect(errors[0]?.message).toContain("request capacity exhausted");
    expect(failedClient.terminate).toHaveBeenCalledOnce();

    coordinator.requestLatest(hiddenRequestV1("recovers", 2, fixture.targetB));
    await waitForV1(() => completions.length === 1);
    expect(createdClientCount).toBe(2);
    expect(completions[0]).toMatchObject({
      requestToken: "recovers",
      cacheHit: false,
      evidence: {
        targetControlStateSha256: fixture.targetB.targetStateSha256,
        periodicSteadyStateClaimed: true,
      },
    });
    expect(recoveredClient.commands.some(({ kind }) =>
      kind === "forkResearchControlSession"
    )).toBe(true);

    await coordinator.dispose();
    expect(recoveredClient.terminate).toHaveBeenCalledOnce();
  });

  it("suppresses stale target evidence and verifies only the latest committed hash", async () => {
    const fixture = await targetFixtureV1();
    const client = new FakeQuickCheckClientV1(fixture.baseline);
    const settlementGate = deferredV1<void>();
    client.nextSettlementGate = settlementGate;
    const completions: ScientificProductQuickCheckCompleteEventV1[] = [];
    const coordinator = hiddenCoordinatorV1(client, completions, []);

    coordinator.requestLatest(hiddenRequestV1("target-a", 1, fixture.targetA));
    await waitForV1(() => client.commands.some(({ kind }) =>
      kind === "settlePeriodic"
    ));
    coordinator.requestLatest(hiddenRequestV1("target-b", 2, fixture.targetB));
    settlementGate.resolve();
    await waitForV1(() => completions.length === 1);

    expect(completions.map(({ requestToken }) => requestToken)).toEqual([
      "target-b",
    ]);
    expect(completions[0]?.evidence.targetControlStateSha256).toBe(
      fixture.targetB.targetStateSha256,
    );
    expect(client.commands.filter(({ kind }) =>
      kind === "forkResearchControlSession"
    )).toHaveLength(2);
    await coordinator.dispose();
  });

  it("suppresses callbacks after dispose and reports request, fork, and settlement phases", async () => {
    const fixture = await targetFixtureV1();
    const client = new FakeQuickCheckClientV1(fixture.baseline);
    const captureGate = deferredV1<void>();
    client.nextCaptureGate = captureGate;
    const completions: ScientificProductQuickCheckCompleteEventV1[] = [];
    const errors: ScientificProductQuickCheckErrorEventV1[] = [];
    const coordinator = hiddenCoordinatorV1(client, completions, errors);

    coordinator.requestLatest(hiddenRequestV1("dispose-me", 1, fixture.targetA));
    await waitForV1(() => client.commands.some(({ kind }) =>
      kind === "runTransient"
    ));
    const disposal = coordinator.dispose();
    captureGate.resolve();
    await disposal;
    expect(completions).toEqual([]);
    expect(errors).toEqual([]);
    expect(client.terminate).toHaveBeenCalledOnce();

    const invalidErrors: ScientificProductQuickCheckErrorEventV1[] = [];
    const invalidCoordinator = hiddenCoordinatorV1(
      new FakeQuickCheckClientV1(fixture.baseline),
      [],
      invalidErrors,
    );
    invalidCoordinator.requestLatest({
      ...hiddenRequestV1("invalid", 1, fixture.targetA),
      visibleControlStateSha256: fixture.targetB.targetStateSha256,
    });
    await waitForV1(() => invalidErrors.length === 1);
    expect(invalidErrors[0]?.phase).toBe("request-validation");
    await invalidCoordinator.dispose();

    const bootstrapClient = new FakeQuickCheckClientV1(fixture.baseline);
    const bootstrapErrors: ScientificProductQuickCheckErrorEventV1[] = [];
    const bootstrapCoordinator = new ScientificProductQuickCheckCoordinatorV1({
      caseEntry: SCIENTIFIC_PRODUCT_CASE_CATALOG_V1[0]!,
      createClient: () => bootstrapClient,
      loadBootstrapSource: async () => {
        throw new Error("synthetic bootstrap failure");
      },
      onComplete: () => undefined,
      onError: (event) => bootstrapErrors.push(event),
    });
    bootstrapCoordinator.requestLatest(hiddenRequestV1(
      "bootstrap",
      1,
      fixture.targetA,
    ));
    await waitForV1(() => bootstrapErrors.length === 1);
    expect(bootstrapErrors[0]).toMatchObject({
      phase: "bootstrap",
      requestToken: "bootstrap",
    });
    expect(bootstrapClient.terminate).toHaveBeenCalledOnce();
    await bootstrapCoordinator.dispose();

    const forkClient = new FakeQuickCheckClientV1(fixture.baseline);
    forkClient.failNextFork = true;
    const forkErrors: ScientificProductQuickCheckErrorEventV1[] = [];
    const forkCoordinator = hiddenCoordinatorV1(forkClient, [], forkErrors);
    forkCoordinator.requestLatest(hiddenRequestV1("fork", 1, fixture.targetA));
    await waitForV1(() => forkErrors.length === 1);
    expect(forkErrors[0]?.phase).toBe("fork");
    await forkCoordinator.dispose();

    const settlementClient = new FakeQuickCheckClientV1(fixture.baseline);
    settlementClient.nextSettlementStatus = "period2-suspect";
    const settlementErrors: ScientificProductQuickCheckErrorEventV1[] = [];
    const settlementCoordinator = hiddenCoordinatorV1(
      settlementClient,
      [],
      settlementErrors,
    );
    settlementCoordinator.requestLatest(hiddenRequestV1(
      "settlement",
      1,
      fixture.targetA,
    ));
    await waitForV1(() => settlementErrors.length === 1);
    expect(settlementErrors[0]).toMatchObject({
      phase: "settlement",
      requestToken: "settlement",
    });
    expect(settlementErrors[0]?.message).toContain("period-2-suspect");
    await settlementCoordinator.dispose();
  });
});

type FrameOverridesV1 = Readonly<Partial<Record<
  MainWireScientificObservableIdV1,
  number
>>>;

function followingCycleFramesV1(
  firstRevision: number,
  firstAcceptedTimeSec: number,
  options: Readonly<{
    boundaryMechanicsResidual?: number;
    acceptedMechanicsResidual?: number;
  }> = {},
): readonly MainWireScientificObservableFrameV1[] {
  return Object.freeze(Array.from({ length: 501 }, (_, index) =>
    observableFrameV1(
      firstRevision + index,
      firstAcceptedTimeSec + index * 0.002,
      index === 0 ? "exact-checkpoint-restore" : "accepted-step",
      index === 0
        ? {
            "solver.mechanics.residual_norm":
              options.boundaryMechanicsResidual ?? 1e-9,
          }
        : {
            "solver.mechanics.residual_norm":
              options.acceptedMechanicsResidual ?? 1e-9,
          },
    )
  ));
}

function observableFrameV1(
  revision: number,
  acceptedTimeSec: number,
  source: MainWireScientificSessionObservationV1["source"],
  overrides: FrameOverridesV1 = {},
  releaseRef: MainWireScientificObservableFrameV1["releaseRef"] = TEST_RELEASE,
): MainWireScientificObservableFrameV1 {
  const diagnosticDefaults: Partial<Record<
    MainWireScientificObservableIdV1,
    number
  >> = {
    "solver.mechanics.residual_norm": 1e-9,
    "solver.circulation.scaled_residual_infinity_norm": 1e-9,
    "solver.continuity.maximum_residual": 1e-9,
    "conservation.total_blood_volume.error": 1e-12,
  };
  const values = Object.fromEntries(
    MAIN_WIRE_SCIENTIFIC_OBSERVABLE_CATALOG_V1.map((definition) => {
      if (definition.modelingStatus === "not-modeled") {
        return [definition.observableId, Object.freeze({
          observableId: definition.observableId,
          value: null,
          availability: "not-modeled" as const,
          quality: "not-assessed" as const,
        })];
      }
      const value = overrides[definition.observableId]
        ?? diagnosticDefaults[definition.observableId]
        ?? 1;
      return [definition.observableId, Object.freeze({
        observableId: definition.observableId,
        value,
        availability: "available" as const,
        quality: definition.sourceKind === "solver-diagnostic"
          ? "solver-diagnostic" as const
          : definition.sourceKind === "accepted-state"
            ? "authoritative-state" as const
            : "accepted-derived" as const,
      })];
    }),
  ) as MainWireScientificObservableFrameV1["values"];
  return Object.freeze({
    frameId: MAIN_WIRE_SCIENTIFIC_OBSERVABLE_FRAME_V1_ID,
    registryId: MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_ID,
    schemaVersion: MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_SCHEMA_VERSION,
    releaseRef,
    sourceObservationId: "main-wire-scientific-session-observation-v1",
    source,
    revision,
    acceptedTimeSec,
    values: Object.freeze(values),
  });
}

function quickCheckInputV1(
  committedControlStateSha256: string,
  frames: readonly MainWireScientificObservableFrameV1[],
  displayedEvidence:
    MainWireScientificQuickCheckInputV1["displayedEvidence"] =
      "target-period1-and-following-cycle-validated",
): MainWireScientificQuickCheckInputV1 {
  const first = frames[0]!;
  const last = frames.at(-1)!;
  return Object.freeze({
    source: Object.freeze({
      releaseRef: first.releaseRef,
      committedControlStateSha256,
      parameterEpoch: 1,
      displayedFrameOwner: "source" as const,
      firstRevision: first.revision,
      finalRevision: last.revision,
      firstAcceptedTimeSec: first.acceptedTimeSec,
      finalAcceptedTimeSec: last.acceptedTimeSec,
    }),
    displayedEvidence,
    frames,
  });
}

function presentationSnapshotV1(
  displayedControlStateSha256: string,
  frames: readonly MainWireScientificObservableFrameV1[],
  displayedParameterEpoch: number,
): ScientificWorkbenchResearchControlSnapshotV0 {
  return {
    frames,
    source: { frames },
    targetControlStateSha256: null,
    provenance: {
      displayedControlStateSha256,
      displayedParameterEpoch,
      displayedFrameOwner: "source",
      displayedEvidence: "target-period1-and-following-cycle-validated",
    },
    draft: {
      systemic: 1,
      pulmonary: 1,
      venousTone: 1,
      arterialStiffness: 1,
      peepCmH2O: 0,
      pericardialFluidVolumeMl: 0,
    },
  } as unknown as ScientificWorkbenchResearchControlSnapshotV0;
}

class FakePresentationStoreV1 {
  private snapshot: ScientificWorkbenchResearchControlSnapshotV0;
  private readonly listeners = new Set<() => void>();

  constructor(snapshot: ScientificWorkbenchResearchControlSnapshotV0) {
    this.snapshot = snapshot;
  }

  get listenerCount(): number {
    return this.listeners.size;
  }

  readonly getSnapshot = (): ScientificWorkbenchResearchControlSnapshotV0 =>
    this.snapshot;

  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  publish(snapshot: ScientificWorkbenchResearchControlSnapshotV0): void {
    this.snapshot = snapshot;
    for (const listener of [...this.listeners]) listener();
  }
}

async function targetFixtureV1() {
  const baseline =
    await createMainWireScientificResearchControlBaselineTargetStateV0();
  const targetA = await createMainWireScientificResearchControlTargetStateV0({
    ...baseline.controls,
    "circulation.systemic-vascular-resistance-scale": 1.5,
  });
  const targetB = await createMainWireScientificResearchControlTargetStateV0({
    ...baseline.controls,
    "circulation.pulmonary-vascular-resistance-scale": 1.5,
  });
  return { baseline, targetA, targetB };
}

function hiddenCoordinatorV1(
  client: FakeQuickCheckClientV1,
  completions: ScientificProductQuickCheckCompleteEventV1[],
  errors: ScientificProductQuickCheckErrorEventV1[],
): ScientificProductQuickCheckCoordinatorV1 {
  return new ScientificProductQuickCheckCoordinatorV1({
    caseEntry: SCIENTIFIC_PRODUCT_CASE_CATALOG_V1[0]!,
    createClient: () => client,
    loadBootstrapSource: async (_caseEntry, loadedClient) => {
      expect(loadedClient).toBe(client);
      return client.bootstrapSource;
    },
    onComplete: (event) => completions.push(event),
    onError: (event) => errors.push(event),
  });
}

function hiddenRequestV1(
  requestToken: string,
  visibleParameterEpoch: number,
  targetControlState: MainWireScientificResearchControlTargetStateV0,
) {
  return Object.freeze({
    requestToken,
    targetControlState,
    visibleParameterEpoch,
    visibleControlStateSha256: targetControlState.targetStateSha256,
  });
}

class FakeQuickCheckClientV1 implements ScientificProductQuickCheckClientV1 {
  status: "open" | "terminated" = "open";
  readonly terminate = vi.fn(() => {
    this.status = "terminated";
  });
  readonly commands: ScientificCommandV1[] = [];
  nextSettlementGate: DeferredV1<void> | null = null;
  nextCaptureGate: DeferredV1<void> | null = null;
  nextSettlementStatus: "period1-converged" | "period2-suspect" =
    "period1-converged";
  failNextFork = false;
  failNextSettlement = false;
  private readonly contexts = new Map<string, ScientificResearchControlContextV0>();

  readonly bootstrapSource: Readonly<{
    sessionId: string;
    context: ScientificResearchControlContextV0;
  }>;

  constructor(baseline: MainWireScientificResearchControlTargetStateV0) {
    const context = hiddenContextV1(baseline, 0, 10, 1_000);
    this.bootstrapSource = Object.freeze({
      sessionId: "hidden-quick-check-bootstrap",
      context,
    });
    this.contexts.set(this.bootstrapSource.sessionId, context);
  }

  async request(
    command: ScientificCommandV1,
  ): Promise<MainWireScientificWorkerResponseV1> {
    this.commands.push(command);
    if (command.kind === "forkResearchControlSession") {
      if (this.failNextFork) {
        this.failNextFork = false;
        throw new Error("synthetic fork failure");
      }
      const source = this.contexts.get(command.sourceSessionId)!;
      const context = hiddenContextV1(
        command.targetControlState,
        source.parameterEpoch + 1,
        source.stateIdentity.acceptedTimeSec,
        source.stateIdentity.revision,
      );
      this.contexts.set(command.sessionId, context);
      return workerResponseV1({
        ok: true,
        commandKind: command.kind,
        releaseRef: command.targetControlState.releaseRef,
        payload: {
          kind: "researchControlSessionForked",
          sourceSessionId: command.sourceSessionId,
          targetStateIdentity: context.stateIdentity,
          targetControlState: context.controlState,
          parameterEpoch: context.parameterEpoch,
        },
      });
    }
    if (command.kind === "settlePeriodic") {
      if (this.failNextSettlement) {
        this.failNextSettlement = false;
        throw new Error("synthetic request capacity exhausted");
      }
      const gate = this.nextSettlementGate;
      this.nextSettlementGate = null;
      await gate?.promise;
      const status = this.nextSettlementStatus;
      this.nextSettlementStatus = "period1-converged";
      const previous = this.contexts.get(command.sessionId)!;
      const context = hiddenContextV1(
        previous.controlState,
        previous.parameterEpoch,
        previous.stateIdentity.acceptedTimeSec + 1,
        previous.stateIdentity.revision + 500,
      );
      this.contexts.set(command.sessionId, context);
      return workerResponseV1({
        ok: true,
        commandKind: command.kind,
        releaseRef: context.controlState.releaseRef,
        payload: {
          kind: "periodic-settlement-progress",
          status,
          periodicSteadyStateClaimed: status === "period1-converged",
          period2OrbitSuspected: status === "period2-suspect",
          completedBeatCount: 3,
          periodicity: periodicityV1(status),
          finalObservableFrame: hiddenFrameV1(context, "accepted-step"),
        },
      });
    }
    if (command.kind === "runTransient") {
      const gate = this.nextCaptureGate;
      this.nextCaptureGate = null;
      await gate?.promise;
      let context = this.contexts.get(command.sessionId)!;
      const frames: MainWireScientificObservableFrameV1[] = [];
      for (let index = 0; index < command.stepCount; index += 1) {
        context = hiddenContextV1(
          context.controlState,
          context.parameterEpoch,
          context.stateIdentity.acceptedTimeSec + command.dtSec,
          context.stateIdentity.revision + 1,
        );
        frames.push(hiddenFrameV1(context, "accepted-step"));
      }
      this.contexts.set(command.sessionId, context);
      return workerResponseV1({
        ok: true,
        commandKind: command.kind,
        releaseRef: context.controlState.releaseRef,
        payload: {
          kind: "transientCompleted",
          requestedStepCount: command.stepCount,
          completedStepCount: command.stepCount,
          executionProtocol: {
            dtSec: command.dtSec,
            observationPolicy: { stride: command.observationStride },
          },
          observableFrames: frames,
          finalObservableFrame: frames.at(-1),
        },
      });
    }
    if (command.kind === "disposeSession") {
      this.contexts.delete(command.sessionId);
      return workerResponseV1({
        ok: true,
        commandKind: command.kind,
        payload: {
          kind: "sessionDisposed",
          disposedSessionId: command.sessionId,
        },
      });
    }
    throw new Error(`unexpected hidden Quick Check command ${command.kind}`);
  }
}

function hiddenContextV1(
  controlState: MainWireScientificResearchControlTargetStateV0,
  parameterEpoch: number,
  acceptedTimeSec: number,
  revision: number,
): ScientificResearchControlContextV0 {
  return Object.freeze({
    stateIdentity: Object.freeze({
      revision,
      acceptedTimeSec,
      totalBloodVolumeMl: 5_000,
    }),
    controlState,
    parameterEpoch,
  });
}

function hiddenFrameV1(
  context: ScientificResearchControlContextV0,
  source: MainWireScientificSessionObservationV1["source"],
): MainWireScientificObservableFrameV1 {
  return observableFrameV1(
    context.stateIdentity.revision,
    context.stateIdentity.acceptedTimeSec,
    source,
    {},
    context.controlState.releaseRef,
  );
}

function periodicityV1(
  status: "period1-converged" | "period2-suspect",
) {
  return Object.freeze({
    status,
    latestBeatIndex: 3,
    consecutiveBeatsRequired: 3,
    evidenceBeatIndices: Object.freeze([1, 2, 3]),
    latestPeriod1MaximumNormalizedDelta: status === "period1-converged"
      ? 1e-5
      : 1e-2,
    latestPeriod2MaximumNormalizedDelta: status === "period2-suspect"
      ? 1e-5
      : 1e-2,
  });
}

function workerResponseV1(value: unknown): MainWireScientificWorkerResponseV1 {
  return value as MainWireScientificWorkerResponseV1;
}

type DeferredV1<T> = Readonly<{
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
}>;

function deferredV1<T>(): DeferredV1<T> {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

async function flushV1(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

async function waitForV1(predicate: () => boolean): Promise<void> {
  for (let attempt = 0; attempt < 300; attempt += 1) {
    if (predicate()) return;
    await flushV1();
  }
  throw new Error("timed out waiting for Quick Check test state");
}
