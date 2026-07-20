import type {
  ScientificWorkbenchResearchControlSnapshotV0,
} from "@/components/scientificWorkbench/ScientificWorkbenchResearchControlStoreV0";
import type {
  MainWireScientificValidatedTerminalCycleV1,
} from "@/engine/scientific/metrics";
import type {
  ScientificResearchControlContextV0,
} from "@/engine/scientific/worker/scientificCommandProtocolV1";
import type {
  ScientificEvidenceBundleV2,
} from "@/engine/scientific/evidence/ScientificEvidenceContractV2";
import type {
  MainWireScientificWorkerClientV1,
} from "@/engine/scientificBrowser";

import {
  ScientificProductQuickCheckCoordinatorV1,
  type ScientificProductQuickCheckCompleteEventV1,
  type ScientificProductQuickCheckErrorEventV1,
  type ScientificProductQuickCheckEvidenceV1,
} from "./ScientificProductQuickCheckCoordinatorV1";
import {
  createScientificProductEvidenceBundleV2,
} from "./ScientificProductEvidenceContractAdapterV2";
import {
  createScientificProductValidationContextV1,
  type ScientificProductValidationContextV1,
} from "./ScientificProductValidationContextV1";
import {
  createScientificProductWorkerClientV1,
  loadScientificProductScenarioRuntimeV1,
  type ScientificProductScenarioDescriptorV1,
  type ScientificProductScenarioRegistryV1,
  type ScientificProductScenarioRuntimeV1,
} from "./ScientificProductScenarioRegistryV1";
import {
  scientificProductCaseByIdV1,
} from "./scientificProductCaseCatalogV1";

export const SCIENTIFIC_PRODUCT_QUICK_CHECK_REGISTRY_V1_ID =
  "scientific-product-quick-check-registry-v1" as const;

export type ScientificProductQuickCheckStatusV1 =
  | "checking"
  | "passed"
  | "verification-error";

export type ScientificProductQuickCheckRecordV1 = Readonly<{
  scenarioId: string;
  scenarioName: string;
  scenarioColor: string;
  sourceCaseId: string;
  status: ScientificProductQuickCheckStatusV1;
  message: string;
  committedControlStateSha256: string | null;
  parameterEpoch: number | null;
  evidenceSource: "loaded-release-cycle" | "hidden-committed-target" | null;
  evidence: ScientificProductQuickCheckEvidenceV1 | null;
  validation: ScientificProductValidationContextV1 | null;
  /** Canonical four-layer evidence contract; the V1 UI remains an adapter consumer. */
  evidenceV2: ScientificEvidenceBundleV2 | null;
  validationFindingCount: number;
  validationUnavailableCount: number;
  verificationIssueCount: number;
  errorPhase:
    | ScientificProductQuickCheckErrorEventV1["phase"]
    | "scenario-calculation"
    | null;
  cacheHit: boolean;
  fullSuiteStatus: "not-run";
}>;

export type ScientificProductQuickCheckRegistrySnapshotV1 = Readonly<{
  registryId: typeof SCIENTIFIC_PRODUCT_QUICK_CHECK_REGISTRY_V1_ID;
  version: number;
  records: readonly ScientificProductQuickCheckRecordV1[];
}>;

type QuickCheckEntryV1 = {
  descriptor: ScientificProductScenarioDescriptorV1;
  runtime: ScientificProductScenarioRuntimeV1;
  coordinator: ScientificProductQuickCheckCoordinatorV1;
  unsubscribeStore: () => void;
  requestedControlStateSha256: string;
  submittedControlStateSha256: string | null;
  requestOrdinal: number;
  record: ScientificProductQuickCheckRecordV1;
};

/**
 * Owns one independent Quick Check worker per ready Workbench scenario.
 * Draft-only edits never enter request selection: only the store's committed
 * target identity can start a check.
 */
export class ScientificProductQuickCheckRegistryV1 {
  private readonly scenarioRegistry: ScientificProductScenarioRegistryV1;
  private readonly entries = new Map<string, QuickCheckEntryV1>();
  private readonly listeners = new Set<() => void>();
  private readonly unsubscribeDescriptors: () => void;
  private snapshot: ScientificProductQuickCheckRegistrySnapshotV1 =
    Object.freeze({
      registryId: SCIENTIFIC_PRODUCT_QUICK_CHECK_REGISTRY_V1_ID,
      version: 0,
      records: Object.freeze([]),
    });
  private disposed = false;

  constructor(scenarioRegistry: ScientificProductScenarioRegistryV1) {
    this.scenarioRegistry = scenarioRegistry;
    this.unsubscribeDescriptors = scenarioRegistry.subscribeDescriptors(
      this.reconcileScenarios,
    );
    this.reconcileScenarios();
  }

  readonly subscribe = (listener: () => void): (() => void) => {
    if (this.disposed) return () => undefined;
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  readonly getSnapshot = (): ScientificProductQuickCheckRegistrySnapshotV1 =>
    this.snapshot;

  getRecord(scenarioId: string): ScientificProductQuickCheckRecordV1 | null {
    return this.entries.get(scenarioId)?.record ?? null;
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.unsubscribeDescriptors();
    for (const entry of this.entries.values()) this.disposeEntry(entry);
    this.entries.clear();
    this.listeners.clear();
  }

  private readonly reconcileScenarios = (): void => {
    if (this.disposed) return;
    const descriptors = this.scenarioRegistry.getDescriptorSnapshot();
    const retained = new Set(descriptors.map(({ id }) => id));
    for (const [scenarioId, entry] of this.entries) {
      if (retained.has(scenarioId)) continue;
      this.disposeEntry(entry);
      this.entries.delete(scenarioId);
    }

    for (const descriptor of descriptors) {
      const runtime = this.scenarioRegistry.getRuntime(descriptor.id);
      const existing = this.entries.get(descriptor.id);
      if (runtime === null) continue;
      if (existing === undefined) {
        this.entries.set(
          descriptor.id,
          this.createEntry(descriptor, runtime),
        );
        continue;
      }
      existing.descriptor = descriptor;
      existing.record = Object.freeze({
        ...existing.record,
        scenarioName: descriptor.name,
        scenarioColor: descriptor.color,
      });
    }
    this.publish();
  };

  private createEntry(
    descriptor: ScientificProductScenarioDescriptorV1,
    runtime: ScientificProductScenarioRuntimeV1,
  ): QuickCheckEntryV1 {
    const source = runtime.controlStore.getSnapshot().source;
    const initialValidation = createScientificProductValidationContextV1(
      runtime.result.terminalCycle as MainWireScientificValidatedTerminalCycleV1,
    );
    const initialAssessment = assessVerificationV1(initialValidation);
    const initialEvidenceV2 = evidenceBundleV2(
      descriptor,
      initialValidation,
      source.context.controlState.targetStateSha256,
      source.context.parameterEpoch,
    );
    const entry = {} as QuickCheckEntryV1;
    const coordinator = new ScientificProductQuickCheckCoordinatorV1({
      caseEntry: requiredCaseEntryV1(descriptor.source.caseId),
      createClient: () => createScientificProductWorkerClientV1(),
      loadBootstrapSource: async (caseEntry, client) => {
        const loaded = await loadScientificProductScenarioRuntimeV1(
          caseEntry,
          undefined,
          client as MainWireScientificWorkerClientV1,
        );
        return Object.freeze({
          sessionId: loaded.sessionId,
          context: loaded.result.researchControlContext,
        });
      },
      onComplete: (event) => this.completeEntry(entry, event),
      onError: (event) => this.failEntry(entry, event),
    });
    Object.assign(entry, {
      descriptor,
      runtime,
      coordinator,
      unsubscribeStore: () => undefined,
      requestedControlStateSha256:
        source.context.controlState.targetStateSha256,
      // The release loader already supplied a validated P1 cycle for this
      // exact hash; do not duplicate it with an invisible first-run check.
      submittedControlStateSha256:
        source.context.controlState.targetStateSha256,
      requestOrdinal: 0,
      record: Object.freeze({
        scenarioId: descriptor.id,
        scenarioName: descriptor.name,
        scenarioColor: descriptor.color,
        sourceCaseId: descriptor.source.caseId,
        status: initialAssessment.issueCount === 0
          ? "passed" as const
          : "verification-error" as const,
        message: initialAssessment.issueCount === 0
          ? "Quick steady-state check passed."
          : verificationIssueMessageV1(initialAssessment.issueCount),
        committedControlStateSha256:
          source.context.controlState.targetStateSha256,
        parameterEpoch: source.context.parameterEpoch,
        evidenceSource: "loaded-release-cycle" as const,
        evidence: null,
        validation: initialValidation,
        evidenceV2: initialEvidenceV2,
        validationFindingCount: referenceFindingCountV1(initialValidation),
        validationUnavailableCount:
          referenceUnavailableCountV1(initialValidation),
        verificationIssueCount: initialAssessment.issueCount,
        errorPhase: null,
        cacheHit: false,
        fullSuiteStatus: "not-run" as const,
      }),
    } satisfies QuickCheckEntryV1);
    entry.unsubscribeStore = runtime.controlStore.subscribe(() => {
      this.reconcileCommittedTarget(entry);
    });
    return entry;
  }

  private reconcileCommittedTarget(entry: QuickCheckEntryV1): void {
    if (this.disposed || this.entries.get(entry.descriptor.id) !== entry) return;
    const snapshot = entry.runtime.controlStore.getSnapshot();

    if (visibleCalculationFailedV1(snapshot)) {
      const failedSha256 = snapshot.targetControlStateSha256
        ?? entry.requestedControlStateSha256;
      const message = snapshot.errorMessage?.trim()
        || snapshot.message.trim()
        || "Scenario calculation failed.";
      entry.requestedControlStateSha256 = failedSha256;
      // A later reset or commit must be allowed to request the same hash again.
      entry.submittedControlStateSha256 = null;
      if (
        entry.record.status === "verification-error"
        && entry.record.errorPhase === "scenario-calculation"
        && entry.record.committedControlStateSha256 === failedSha256
        && entry.record.message === message
      ) return;
      entry.record = Object.freeze({
        ...entry.record,
        status: "verification-error" as const,
        message,
        committedControlStateSha256: failedSha256,
        parameterEpoch: snapshot.candidate?.context.parameterEpoch
          ?? snapshot.source.context.parameterEpoch,
        evidenceSource: null,
        evidence: null,
        validation: null,
        evidenceV2: null,
        validationFindingCount: 0,
        validationUnavailableCount: 0,
        verificationIssueCount: 1,
        errorPhase: "scenario-calculation" as const,
        cacheHit: false,
      });
      this.publish();
      return;
    }

    const selected = committedTargetContextV1(snapshot);
    const requestedSha256 = snapshot.targetControlStateSha256
      ?? snapshot.source.context.controlState.targetStateSha256;
    const recoveringFromVisibleFailure =
      entry.record.errorPhase === "scenario-calculation";

    if (
      requestedSha256 !== entry.requestedControlStateSha256
      || recoveringFromVisibleFailure
    ) {
      entry.requestedControlStateSha256 = requestedSha256;
      entry.submittedControlStateSha256 = null;
      entry.record = Object.freeze({
        ...entry.record,
        status: "checking" as const,
        message: "Checking committed steady state…",
        committedControlStateSha256: requestedSha256,
        parameterEpoch: selected?.parameterEpoch ?? null,
        evidenceSource: null,
        evidence: null,
        validation: null,
        evidenceV2: null,
        validationFindingCount: 0,
        validationUnavailableCount: 0,
        verificationIssueCount: 0,
        errorPhase: null,
        cacheHit: false,
      });
      this.publish();
    }

    if (
      selected === null
      || entry.submittedControlStateSha256 === requestedSha256
    ) return;
    entry.submittedControlStateSha256 = requestedSha256;
    entry.requestOrdinal += 1;
    entry.coordinator.requestLatest(Object.freeze({
      requestToken:
        `${entry.descriptor.id}:${entry.requestOrdinal}:${requestedSha256}`,
      targetControlState: selected.controlState,
      visibleParameterEpoch: selected.parameterEpoch,
      visibleControlStateSha256: requestedSha256,
    }));
  }

  private completeEntry(
    entry: QuickCheckEntryV1,
    event: ScientificProductQuickCheckCompleteEventV1,
  ): void {
    if (
      this.disposed
      || this.entries.get(entry.descriptor.id) !== entry
      || visibleCalculationFailedV1(
        entry.runtime.controlStore.getSnapshot(),
      )
      || event.evidence.targetControlStateSha256
        !== entry.requestedControlStateSha256
    ) return;
    const validation = createScientificProductValidationContextV1(
      event.evidence.terminalCycle as MainWireScientificValidatedTerminalCycleV1,
    );
    const assessment = assessVerificationV1(validation);
    const evidenceV2 = evidenceBundleV2(
      entry.descriptor,
      validation,
      event.evidence.targetControlStateSha256,
      event.visibleParameterEpoch,
    );
    entry.record = Object.freeze({
      ...entry.record,
      status: assessment.issueCount === 0
        ? "passed" as const
        : "verification-error" as const,
      message: assessment.issueCount === 0
        ? "Quick steady-state check passed."
        : verificationIssueMessageV1(assessment.issueCount),
      committedControlStateSha256:
        event.evidence.targetControlStateSha256,
      // The hidden Worker owns an independent epoch sequence. User-facing
      // provenance remains tied to the committed Workbench scenario epoch.
      parameterEpoch: event.visibleParameterEpoch,
      evidenceSource: "hidden-committed-target" as const,
      evidence: event.evidence,
      validation,
      evidenceV2,
      validationFindingCount: referenceFindingCountV1(validation),
      validationUnavailableCount: referenceUnavailableCountV1(validation),
      verificationIssueCount: assessment.issueCount,
      errorPhase: null,
      cacheHit: event.cacheHit,
    });
    this.publish();
  }

  private failEntry(
    entry: QuickCheckEntryV1,
    event: ScientificProductQuickCheckErrorEventV1,
  ): void {
    if (
      this.disposed
      || this.entries.get(entry.descriptor.id) !== entry
      || visibleCalculationFailedV1(
        entry.runtime.controlStore.getSnapshot(),
      )
      || event.visibleControlStateSha256
        !== entry.requestedControlStateSha256
    ) return;
    entry.record = Object.freeze({
      ...entry.record,
      status: "verification-error" as const,
      message: event.message,
      parameterEpoch: event.visibleParameterEpoch,
      evidenceSource: null,
      evidence: null,
      validation: null,
      evidenceV2: null,
      validationFindingCount: 0,
      validationUnavailableCount: 0,
      verificationIssueCount: 1,
      errorPhase: event.phase,
      cacheHit: false,
    });
    this.publish();
  }

  private disposeEntry(entry: QuickCheckEntryV1): void {
    entry.unsubscribeStore();
    void entry.coordinator.dispose();
  }

  private publish(): void {
    if (this.disposed) return;
    const descriptorOrder = new Map(
      this.scenarioRegistry.getDescriptorSnapshot().map(
        ({ id }, index) => [id, index],
      ),
    );
    const records = [...this.entries.values()]
      .sort((left, right) =>
        (descriptorOrder.get(left.descriptor.id) ?? Number.MAX_SAFE_INTEGER)
        - (descriptorOrder.get(right.descriptor.id) ?? Number.MAX_SAFE_INTEGER))
      .map(({ record }) => record);
    this.snapshot = Object.freeze({
      registryId: SCIENTIFIC_PRODUCT_QUICK_CHECK_REGISTRY_V1_ID,
      version: this.snapshot.version + 1,
      records: Object.freeze(records),
    });
    for (const listener of [...this.listeners]) listener();
  }
}

function committedTargetContextV1(
  snapshot: ScientificWorkbenchResearchControlSnapshotV0,
): ScientificResearchControlContextV0 | null {
  const requestedSha256 = snapshot.targetControlStateSha256
    ?? snapshot.source.context.controlState.targetStateSha256;
  if (
    snapshot.candidate?.context.controlState.targetStateSha256
      === requestedSha256
  ) return snapshot.candidate.context;
  if (
    snapshot.source.context.controlState.targetStateSha256
      === requestedSha256
  ) return snapshot.source.context;
  return null;
}

function visibleCalculationFailedV1(
  snapshot: ScientificWorkbenchResearchControlSnapshotV0,
): boolean {
  return snapshot.phase === "failed" || snapshot.phase === "reload-required";
}

function requiredCaseEntryV1(caseId: string) {
  const entry = scientificProductCaseByIdV1(caseId);
  if (entry === null) throw new Error(`Unknown scientific Case ${caseId}.`);
  return entry;
}

function evidenceBundleV2(
  descriptor: ScientificProductScenarioDescriptorV1,
  validation: ScientificProductValidationContextV1,
  controlStateSha256: string | null,
  parameterEpoch: number | null,
): ScientificEvidenceBundleV2 {
  return createScientificProductEvidenceBundleV2({
    subjectRef: Object.freeze({
      kind: "scenario" as const,
      subjectId: descriptor.id,
      label: descriptor.name,
    }),
    releaseRef: Object.freeze({
      id: descriptor.source.releaseId,
      version: descriptor.source.releaseVersion,
      sha256: descriptor.source.releaseSha256,
    }),
    controlStateSha256,
    parameterEpoch,
    validation,
  });
}

function assessVerificationV1(
  validation: ScientificProductValidationContextV1,
): Readonly<{ issueCount: number }> {
  const issueCount = validation.cycleAvailable
    ? validation.numericalResults.filter(({ status }) => status !== "pass").length
    : 1;
  return Object.freeze({ issueCount });
}

function referenceFindingCountV1(
  validation: ScientificProductValidationContextV1,
): number {
  return validation.referenceResults.filter(
    ({ status }) => status === "outside-reference",
  ).length;
}

function referenceUnavailableCountV1(
  validation: ScientificProductValidationContextV1,
): number {
  return validation.referenceResults.filter(
    ({ status }) => status === "unavailable",
  ).length;
}

function verificationIssueMessageV1(issueCount: number): string {
  return issueCount === 1
    ? "1 verification issue."
    : `${issueCount} verification issues.`;
}
