import {
  INITIAL_PRESENTATION_REVISION_V1,
  INITIAL_TARGET_GENERATION_V1,
  STUDIO_ARTIFACT_REF_V1_SCHEMA_ID,
  STUDIO_RUN_ARTIFACT_CONTENT_V1_SCHEMA_ID,
  type AppliedRuntimeControlIntentV1,
  type ArtifactStorePortV1,
  type OpenScenarioRuntimeBranchV1,
  type OpenSimulationSessionCommandV1,
  type PromoteSteadyCandidateCommandV1,
  type RunArtifactRefV1,
  type RuntimeCandidatePromotedV1,
  type RuntimeControlIntentV1,
  type RuntimeControlPatchV1,
  type RuntimeExecutionIdentityV1,
  type RuntimeLaneFailureV1,
  type RuntimeLiveIntentResultV1,
  type RuntimeLiveTransitionResultV1,
  type RuntimeObservablePointV1,
  type RuntimePresentationFrameV1,
  type RuntimeScenarioBranchOpenedV1,
  type RuntimeSessionOpenedV1,
  type RuntimeSteadyCandidateV1,
  type RuntimeStrictIntentResultV1,
  type RuntimeTargetIntentBranchV1,
  type RuntimeTargetIntentCommandV1,
  type RuntimeWindowMetricStateV1,
  type ScenarioRuntimeBranchStateV1,
  type Sha256HexV1,
  type SimulationRuntimePortV1,
  type SimulationSessionStateV1,
  type StudioArtifactKindV1,
  type StudioArtifactRefV1,
  type StudioJsonValueV1,
  type StudioRunArtifactContentV1,
  type TargetGenerationV1,
} from "@/studio/contracts/v1";

const SHA256_HEX_PATTERN_V1 = /^[0-9a-f]{64}$/;
const RUN_ARTIFACT_MEDIA_TYPE_V1 =
  "application/vnd.circleheart.studio-run-artifact.v1+json" as const;

export type SimulationSessionCoordinatorOptionsV1 = Readonly<{
  runtime: SimulationRuntimePortV1;
  artifacts: ArtifactStorePortV1;
}>;

export class SimulationSessionCoordinatorErrorV1 extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SimulationSessionCoordinatorErrorV1";
  }
}

export class SimulationSessionCommandConflictV1
  extends SimulationSessionCoordinatorErrorV1 {
  constructor(message: string) {
    super(message);
    this.name = "SimulationSessionCommandConflictV1";
  }
}

/**
 * Owns one Studio interaction containing N scenario runtime branches.
 *
 * A shared control intent first advances every targeted branch generation in
 * one immutable aggregate-state replacement. Only then is the exact same
 * aggregate command handed to the foreground live and background strict
 * lanes. Completions are correlated independently at each branch generation,
 * so a later subset intent cannot overwrite its targets or erase valid work on
 * untouched branches.
 */
export class SimulationSessionCoordinatorV1 {
  private readonly runtime: SimulationRuntimePortV1;
  private readonly artifacts: ArtifactStorePortV1;
  private readonly submittedIntentIds = new Set<string>();
  private readonly promotingScenarioIds = new Set<string>();
  private state: SimulationSessionStateV1 | null = null;

  constructor(options: SimulationSessionCoordinatorOptionsV1) {
    this.runtime = options.runtime;
    this.artifacts = options.artifacts;
  }

  get current(): SimulationSessionStateV1 {
    if (this.state === null) {
      throw new SimulationSessionCoordinatorErrorV1(
        "simulation session has not been opened",
      );
    }
    return this.state;
  }

  branch(scenarioId: string): ScenarioRuntimeBranchStateV1 {
    return requiredBranchV1(this.current, scenarioId);
  }

  async open(
    command: OpenSimulationSessionCommandV1,
  ): Promise<SimulationSessionStateV1> {
    if (this.state !== null) {
      throw new SimulationSessionCoordinatorErrorV1(
        "simulation session is already open",
      );
    }
    const safeCommand = copyOpenCommandV1(command);
    const opened = copyOpenedSessionV1(
      await this.runtime.openSession(safeCommand),
      safeCommand,
    );
    const openedByScenario = new Map(
      opened.branches.map((branch) => [branch.scenarioId, branch]),
    );
    const branches = safeCommand.branches.map((source) =>
      initialBranchStateV1(source, openedByScenario.get(source.scenarioId)!));

    this.state = Object.freeze({
      status: "live",
      sessionId: opened.sessionId,
      branches: Object.freeze(branches),
      lastAppliedIntentId: null,
    });
    return this.state;
  }

  applyControlIntent(
    intent: RuntimeControlIntentV1,
  ): AppliedRuntimeControlIntentV1 {
    const current = this.requireLiveStateV1();
    const safeIntent = copyControlIntentV1(intent, current);
    const promotingTarget = safeIntent.targets.find(({ scenarioId }) =>
      this.promotingScenarioIds.has(scenarioId)
    );
    if (promotingTarget !== undefined) {
      throw new SimulationSessionCommandConflictV1(
        `scenario ${promotingTarget.scenarioId} is being promoted`,
      );
    }
    if (this.submittedIntentIds.has(safeIntent.intentId)) {
      throw new SimulationSessionCoordinatorErrorV1(
        `intentId ${safeIntent.intentId} has already been submitted`,
      );
    }
    const targetByScenario = new Map(
      safeIntent.targets.map((target) => [target.scenarioId, target]),
    );
    const commandTargets: RuntimeTargetIntentBranchV1[] = [];
    const nextBranches = current.branches.map((branch) => {
      const target = targetByScenario.get(branch.scenarioId);
      if (target === undefined) return branch;
      const targetGeneration = nextGenerationV1(branch.targetGeneration);
      const presentationRevision = nextPresentationRevisionV1(
        branch.presentationRevision,
      );
      commandTargets.push(Object.freeze({
        scenarioId: branch.scenarioId,
        liveBranchId: branch.liveBranchId,
        targetGeneration,
        presentationRevision,
        patch: target.patch,
      }));
      return Object.freeze({
        ...branch,
        targetGeneration,
        presentationRevision,
        targetInputSha256: target.patch.targetInputSha256,
        display: Object.freeze({
          ...branch.display,
          windowMetrics: collectingMetricsV1(1),
        }),
        latestSteadyCandidate: null,
        lastRuntimeFailure: null,
      });
    });
    const command = Object.freeze({
      sessionId: current.sessionId,
      intentId: safeIntent.intentId,
      targets: Object.freeze(commandTargets),
    }) satisfies RuntimeTargetIntentCommandV1;
    this.submittedIntentIds.add(command.intentId);

    // This is the atomic application-state boundary for a shared intent.
    this.state = Object.freeze({
      ...current,
      branches: Object.freeze(nextBranches),
      lastAppliedIntentId: safeIntent.intentId,
    });

    let livePromise: Promise<RuntimeLiveIntentResultV1>;
    let strictPromise: Promise<RuntimeStrictIntentResultV1>;
    try {
      const execution = this.runtime.startTargetIntent(command);
      if (
        execution === null
        || typeof execution !== "object"
        || typeof execution.live?.then !== "function"
        || typeof execution.strict?.then !== "function"
      ) {
        throw new SimulationSessionCoordinatorErrorV1(
          "runtime returned invalid target intent completion handles",
        );
      }
      livePromise = execution.live;
      strictPromise = execution.strict;
    } catch (error) {
      this.acceptIntentFailureV1(command, "live", error);
      this.acceptIntentFailureV1(command, "strict", error);
      return Object.freeze({
        intentId: command.intentId,
        targetGenerations: Object.freeze(command.targets.map((target) =>
          Object.freeze({
            scenarioId: target.scenarioId,
            targetGeneration: target.targetGeneration,
            presentationRevision: target.presentationRevision,
          }))),
      });
    }

    void livePromise.then(
      (result) => this.acceptLiveIntentV1(command, result),
      (error) => this.acceptIntentFailureV1(command, "live", error),
    );
    void strictPromise.then(
      (result) => this.acceptStrictIntentV1(command, result),
      (error) => this.acceptIntentFailureV1(command, "strict", error),
    );

    return Object.freeze({
      intentId: command.intentId,
      targetGenerations: Object.freeze(command.targets.map((target) =>
        Object.freeze({
          scenarioId: target.scenarioId,
          targetGeneration: target.targetGeneration,
          presentationRevision: target.presentationRevision,
        }))),
    });
  }

  async promoteSteadyCandidate(
    scenarioId: string,
  ): Promise<ScenarioRuntimeBranchStateV1> {
    const beforeSession = this.requireLiveStateV1();
    const before = requiredBranchV1(beforeSession, scenarioId);
    if (this.promotingScenarioIds.has(before.scenarioId)) {
      throw new SimulationSessionCommandConflictV1(
        `scenario ${before.scenarioId} is already being promoted`,
      );
    }
    const candidate = currentCandidateV1(before);
    const presentationRevision = nextPresentationRevisionV1(
      before.presentationRevision,
    );
    const command = Object.freeze({
      sessionId: beforeSession.sessionId,
      scenarioId: before.scenarioId,
      liveBranchId: before.liveBranchId,
      targetGeneration: before.targetGeneration,
      presentationRevision,
      candidate,
    }) satisfies PromoteSteadyCandidateCommandV1;
    this.promotingScenarioIds.add(before.scenarioId);
    try {
      const promoted = await this.runtime.promoteSteadyCandidate(command);
      const currentSession = this.requireLiveStateV1();
      const current = requiredBranchV1(currentSession, scenarioId);
      assertCandidateStillCurrentV1(
        currentSession,
        current,
        beforeSession,
        before,
        candidate,
        before.presentationRevision,
        "steady candidate changed while promotion was in flight",
      );
      const safePromoted = copyPromotionV1(promoted, command);
      assertOnePointCollectingFrameV1(
        safePromoted.initialFrame,
        "promoted snapshot",
      );

      const replacement = Object.freeze({
        ...current,
        presentationRevision,
        targetInputSha256: candidate.targetInputSha256,
        display: Object.freeze({
          origin: Object.freeze({
            kind: "promoted-steady-candidate" as const,
            targetGeneration: current.targetGeneration,
            candidateId: candidate.candidateId,
          }),
          firstPoint: safePromoted.initialFrame.point,
          latestPoint: safePromoted.initialFrame.point,
          pointCount: 1,
          windowMetrics: safePromoted.initialFrame.windowMetrics,
        }),
        lastRuntimeFailure: null,
      });
      this.replaceBranchV1(current.scenarioId, replacement);
      return replacement;
    } finally {
      this.promotingScenarioIds.delete(before.scenarioId);
    }
  }

  async pinSteadyCandidate(
    scenarioId: string,
  ): Promise<RunArtifactRefV1> {
    const beforeSession = this.requireLiveStateV1();
    const before = requiredBranchV1(beforeSession, scenarioId);
    const candidate = currentCandidateV1(before);
    const [snapshotExists, sourceRunExists] = await Promise.all([
      this.artifacts.has(candidate.snapshotRef),
      this.artifacts.has(candidate.sourceRunRef),
    ]);
    if (!snapshotExists) {
      throw new SimulationSessionCoordinatorErrorV1(
        `candidate snapshot artifact ${candidate.snapshotRef.sha256} does not exist`,
      );
    }
    if (!sourceRunExists) {
      throw new SimulationSessionCoordinatorErrorV1(
        `candidate source run artifact ${candidate.sourceRunRef.sha256} does not exist`,
      );
    }
    const validatedSession = this.requireLiveStateV1();
    const validated = requiredBranchV1(validatedSession, scenarioId);
    assertCandidateStillCurrentV1(
      validatedSession,
      validated,
      beforeSession,
      before,
      candidate,
      before.presentationRevision,
      "steady candidate changed while artifact references were validated",
    );
    const content: StudioRunArtifactContentV1 = Object.freeze({
      schemaId: STUDIO_RUN_ARTIFACT_CONTENT_V1_SCHEMA_ID,
      sourceRunRef: candidate.sourceRunRef,
      targetInputSha256: candidate.targetInputSha256,
      snapshotRef: candidate.snapshotRef,
      execution: candidate.execution,
      claims: Object.freeze({
        steadyStatus: "converged" as const,
        numericalHealth: "passed" as const,
        snapshotIsWarmRestartable: true as const,
        canonicalSignalSamplesStored: false as const,
        canonicalWindowMetricsStored: false as const,
      }),
    });
    const ref = await this.artifacts.putJson({
      kind: "run-artifact",
      mediaType: RUN_ARTIFACT_MEDIA_TYPE_V1,
      content: content as unknown as StudioJsonValueV1,
    });

    const currentSession = this.requireLiveStateV1();
    const current = requiredBranchV1(currentSession, scenarioId);
    assertCandidateStillCurrentV1(
      currentSession,
      current,
      beforeSession,
      before,
      candidate,
      before.presentationRevision,
      "steady candidate changed while run artifact was being pinned",
    );
    if (!current.pinnedRunRefs.some(({ sha256 }) => sha256 === ref.sha256)) {
      this.replaceBranchV1(scenarioId, Object.freeze({
        ...current,
        pinnedRunRefs: Object.freeze([...current.pinnedRunRefs, ref]),
      }));
    }
    return ref;
  }

  async close(): Promise<void> {
    const current = this.state;
    if (current === null || current.status === "closed") return;
    if (this.promotingScenarioIds.size > 0) {
      throw new SimulationSessionCommandConflictV1(
        "simulation session has an in-flight branch promotion",
      );
    }
    await this.runtime.closeSession(current.sessionId);
    if (
      this.state !== null
      && this.state.sessionId === current.sessionId
    ) {
      this.state = Object.freeze({
        ...this.state,
        status: "closed",
        branches: Object.freeze(this.state.branches.map((branch) =>
          Object.freeze({
            ...branch,
            latestSteadyCandidate: null,
          }))),
      });
    }
  }

  private acceptLiveIntentV1(
    command: RuntimeTargetIntentCommandV1,
    result: RuntimeLiveIntentResultV1,
  ): void {
    try {
      assertIntentEnvelopeV1(command, result);
      const byScenario = exactResultsByScenarioV1(
        command,
        result.branches,
        "live",
      );
      const current = this.state;
      if (
        current === null
        || current.status !== "live"
        || current.sessionId !== command.sessionId
      ) return;
      let changed = false;
      const branches = current.branches.map((branch) => {
        const target = targetForScenarioV1(command, branch.scenarioId);
        if (
          target === null
          || branch.targetGeneration !== target.targetGeneration
          || branch.presentationRevision !== target.presentationRevision
          || branch.targetInputSha256 !== target.patch.targetInputSha256
        ) return branch;
        const branchResult = byScenario.get(branch.scenarioId)!;
        assertBranchResultIdentityV1(branchResult, target, "live");
        changed = true;
        if (branchResult.status === "failure") {
          return Object.freeze({
            ...branch,
            lastRuntimeFailure: laneFailureV1(
              command,
              target,
              "live",
              branchResult.message,
            ),
          });
        }
        const live = copyLiveResultV1(branchResult.result, target);
        return Object.freeze({
          ...branch,
          display: Object.freeze({
            origin: Object.freeze({
              kind: "live-transition" as const,
              targetGeneration: target.targetGeneration,
            }),
            firstPoint: branch.display.firstPoint,
            latestPoint: live.frame.point,
            pointCount: branch.display.pointCount + 1,
            windowMetrics: live.frame.windowMetrics,
          }),
          lastRuntimeFailure: clearLaneFailureV1(
            branch.lastRuntimeFailure,
            "live",
          ),
        });
      });
      if (changed) {
        this.state = Object.freeze({
          ...current,
          branches: Object.freeze(branches),
        });
      }
    } catch (error) {
      this.acceptIntentFailureV1(command, "live", error);
    }
  }

  private acceptStrictIntentV1(
    command: RuntimeTargetIntentCommandV1,
    result: RuntimeStrictIntentResultV1,
  ): void {
    try {
      assertIntentEnvelopeV1(command, result);
      const byScenario = exactResultsByScenarioV1(
        command,
        result.branches,
        "strict",
      );
      const current = this.state;
      if (
        current === null
        || current.status !== "live"
        || current.sessionId !== command.sessionId
      ) return;
      let changed = false;
      const branches = current.branches.map((branch) => {
        const target = targetForScenarioV1(command, branch.scenarioId);
        if (
          target === null
          || branch.targetGeneration !== target.targetGeneration
          || branch.presentationRevision !== target.presentationRevision
          || branch.targetInputSha256 !== target.patch.targetInputSha256
        ) return branch;
        const branchResult = byScenario.get(branch.scenarioId)!;
        assertBranchResultIdentityV1(branchResult, target, "strict");
        changed = true;
        if (branchResult.status === "failure") {
          return Object.freeze({
            ...branch,
            lastRuntimeFailure: laneFailureV1(
              command,
              target,
              "strict",
              branchResult.message,
            ),
          });
        }
        const candidate = copyCandidateV1(
          branchResult.candidate,
          current.sessionId,
          target,
        );
        return Object.freeze({
          ...branch,
          latestSteadyCandidate: candidate,
          lastRuntimeFailure: clearLaneFailureV1(
            branch.lastRuntimeFailure,
            "strict",
          ),
        });
      });
      if (changed) {
        this.state = Object.freeze({
          ...current,
          branches: Object.freeze(branches),
        });
      }
    } catch (error) {
      this.acceptIntentFailureV1(command, "strict", error);
    }
  }

  private acceptIntentFailureV1(
    command: RuntimeTargetIntentCommandV1,
    lane: RuntimeLaneFailureV1["lane"],
    error: unknown,
  ): void {
    const current = this.state;
    if (
      current === null
      || current.status !== "live"
      || current.sessionId !== command.sessionId
    ) return;
    let changed = false;
    const branches = current.branches.map((branch) => {
      const target = targetForScenarioV1(command, branch.scenarioId);
      if (
        target === null
        || branch.targetGeneration !== target.targetGeneration
        || branch.presentationRevision !== target.presentationRevision
      ) return branch;
      changed = true;
      return Object.freeze({
        ...branch,
        lastRuntimeFailure: laneFailureV1(
          command,
          target,
          lane,
          errorMessageV1(error),
        ),
      });
    });
    if (changed) {
      this.state = Object.freeze({
        ...current,
        branches: Object.freeze(branches),
      });
    }
  }

  private replaceBranchV1(
    scenarioId: string,
    replacement: ScenarioRuntimeBranchStateV1,
  ): void {
    const current = this.requireLiveStateV1();
    this.state = Object.freeze({
      ...current,
      branches: Object.freeze(current.branches.map((branch) =>
        branch.scenarioId === scenarioId ? replacement : branch)),
    });
  }

  private requireLiveStateV1(): SimulationSessionStateV1 {
    const current = this.current;
    if (current.status !== "live") {
      throw new SimulationSessionCoordinatorErrorV1(
        "simulation session is not live",
      );
    }
    return current;
  }
}

function initialBranchStateV1(
  source: OpenScenarioRuntimeBranchV1,
  opened: RuntimeScenarioBranchOpenedV1,
): ScenarioRuntimeBranchStateV1 {
  assertOnePointCollectingFrameV1(
    opened.initialFrame,
    `opened snapshot for ${source.scenarioId}`,
  );
  return Object.freeze({
    scenarioId: source.scenarioId,
    liveBranchId: opened.liveBranchId,
    sourceRunRef: source.sourceRunRef,
    execution: opened.execution,
    targetGeneration: INITIAL_TARGET_GENERATION_V1,
    presentationRevision: INITIAL_PRESENTATION_REVISION_V1,
    targetInputSha256: source.initialTargetInputSha256,
    display: Object.freeze({
      origin: Object.freeze({
        kind: "opened-run" as const,
        runRef: source.sourceRunRef,
      }),
      firstPoint: opened.initialFrame.point,
      latestPoint: opened.initialFrame.point,
      pointCount: 1,
      windowMetrics: opened.initialFrame.windowMetrics,
    }),
    latestSteadyCandidate: null,
    pinnedRunRefs: Object.freeze([]),
    lastRuntimeFailure: null,
  });
}

function assertOnePointCollectingFrameV1(
  frame: RuntimePresentationFrameV1,
  path: string,
): void {
  if (
    frame.windowMetrics.status !== "collecting"
    || frame.windowMetrics.collectedPointCount !== 1
    || frame.windowMetrics.completedCycleCount !== 0
  ) {
    throw new SimulationSessionCoordinatorErrorV1(
      `${path} must restart with exactly one collected point and no completed cycle`,
    );
  }
}

function assertCandidateStillCurrentV1(
  currentSession: SimulationSessionStateV1,
  current: ScenarioRuntimeBranchStateV1,
  beforeSession: SimulationSessionStateV1,
  before: ScenarioRuntimeBranchStateV1,
  candidate: RuntimeSteadyCandidateV1,
  expectedPresentationRevision: number,
  message: string,
): void {
  const currentCandidate = current.latestSteadyCandidate;
  if (
    currentSession.sessionId !== beforeSession.sessionId
    || current.scenarioId !== before.scenarioId
    || current.targetGeneration !== before.targetGeneration
    || current.presentationRevision !== expectedPresentationRevision
    || currentCandidate === null
    || currentCandidate.candidateId !== candidate.candidateId
    || currentCandidate.targetGeneration !== candidate.targetGeneration
    || currentCandidate.targetInputSha256 !== candidate.targetInputSha256
    || currentCandidate.snapshotRef.sha256 !== candidate.snapshotRef.sha256
    || currentCandidate.sourceRunRef.sha256 !== candidate.sourceRunRef.sha256
  ) {
    throw new SimulationSessionCommandConflictV1(message);
  }
}

function currentCandidateV1(
  branch: ScenarioRuntimeBranchStateV1,
): RuntimeSteadyCandidateV1 {
  const candidate = branch.latestSteadyCandidate;
  if (
    candidate === null
    || candidate.targetGeneration !== branch.targetGeneration
  ) {
    throw new SimulationSessionCoordinatorErrorV1(
      `no steady candidate exists for current scenario ${branch.scenarioId}`,
    );
  }
  return candidate;
}

function requiredBranchV1(
  state: SimulationSessionStateV1,
  scenarioId: string,
): ScenarioRuntimeBranchStateV1 {
  const branch = state.branches.find((entry) =>
    entry.scenarioId === scenarioId
  );
  if (branch === undefined) {
    throw new SimulationSessionCoordinatorErrorV1(
      `unknown scenarioId ${scenarioId}`,
    );
  }
  return branch;
}

function nextGenerationV1(
  current: TargetGenerationV1,
): TargetGenerationV1 {
  if (!Number.isSafeInteger(current) || current < 0) {
    throw new SimulationSessionCoordinatorErrorV1(
      "current target generation is invalid",
    );
  }
  if (current === Number.MAX_SAFE_INTEGER) {
    throw new SimulationSessionCoordinatorErrorV1(
      "target generation exhausted",
    );
  }
  return current + 1;
}

function nextPresentationRevisionV1(current: number): number {
  if (!Number.isSafeInteger(current) || current < 0) {
    throw new SimulationSessionCoordinatorErrorV1(
      "current presentation revision is invalid",
    );
  }
  if (current === Number.MAX_SAFE_INTEGER) {
    throw new SimulationSessionCoordinatorErrorV1(
      "presentation revision exhausted",
    );
  }
  return current + 1;
}

function copyOpenCommandV1(
  command: OpenSimulationSessionCommandV1,
): OpenSimulationSessionCommandV1 {
  assertPortableIdV1(command?.sessionId, "sessionId");
  if (!Array.isArray(command?.branches) || command.branches.length === 0) {
    throw new SimulationSessionCoordinatorErrorV1(
      "open command requires at least one scenario branch",
    );
  }
  const seen = new Set<string>();
  const branches = command.branches.map((branch, index) => {
    assertPortableIdV1(branch?.scenarioId, `branches[${index}].scenarioId`);
    if (seen.has(branch.scenarioId)) {
      throw new SimulationSessionCoordinatorErrorV1(
        `duplicate scenarioId ${branch.scenarioId}`,
      );
    }
    seen.add(branch.scenarioId);
    assertSha256V1(
      branch.initialTargetInputSha256,
      `branches[${index}].initialTargetInputSha256`,
    );
    return Object.freeze({
      scenarioId: branch.scenarioId,
      sourceRunRef: copyArtifactRefV1(
        branch.sourceRunRef,
        "run-artifact",
        `branches[${index}].sourceRunRef`,
      ),
      sourceSnapshotRef: copyArtifactRefV1(
        branch.sourceSnapshotRef,
        "snapshot-envelope",
        `branches[${index}].sourceSnapshotRef`,
      ),
      initialTargetInputSha256: branch.initialTargetInputSha256,
    });
  });
  return Object.freeze({
    sessionId: command.sessionId,
    branches: Object.freeze(branches),
  });
}

function copyOpenedSessionV1(
  opened: RuntimeSessionOpenedV1,
  command: OpenSimulationSessionCommandV1,
): RuntimeSessionOpenedV1 {
  if (
    opened?.sessionId !== command.sessionId
    || !Array.isArray(opened?.branches)
    || opened.branches.length !== command.branches.length
  ) {
    throw new SimulationSessionCoordinatorErrorV1(
      "runtime opened a different session or branch count",
    );
  }
  const expected = new Set(command.branches.map(({ scenarioId }) => scenarioId));
  const seen = new Set<string>();
  const branches = opened.branches.map((branch, index) => {
    if (
      !expected.has(branch?.scenarioId)
      || seen.has(branch.scenarioId)
    ) {
      throw new SimulationSessionCoordinatorErrorV1(
        `opened branch ${index} has an unexpected or duplicate scenarioId`,
      );
    }
    seen.add(branch.scenarioId);
    assertPortableIdV1(branch.liveBranchId, "liveBranchId");
    return Object.freeze({
      scenarioId: branch.scenarioId,
      liveBranchId: branch.liveBranchId,
      execution: copyExecutionV1(branch.execution),
      initialFrame: copyFrameV1(branch.initialFrame),
    });
  });
  return Object.freeze({
    sessionId: opened.sessionId,
    branches: Object.freeze(branches),
  });
}

function copyControlIntentV1(
  intent: RuntimeControlIntentV1,
  state: SimulationSessionStateV1,
): RuntimeControlIntentV1 {
  assertPortableIdV1(intent?.intentId, "intentId");
  if (!Array.isArray(intent?.targets) || intent.targets.length === 0) {
    throw new SimulationSessionCoordinatorErrorV1(
      "control intent requires at least one targeted branch",
    );
  }
  const known = new Set(state.branches.map(({ scenarioId }) => scenarioId));
  const seen = new Set<string>();
  const targets = intent.targets.map((target, index) => {
    if (
      !known.has(target?.scenarioId)
      || seen.has(target.scenarioId)
    ) {
      throw new SimulationSessionCoordinatorErrorV1(
        `intent target ${index} has an unknown or duplicate scenarioId`,
      );
    }
    seen.add(target.scenarioId);
    return Object.freeze({
      scenarioId: target.scenarioId,
      patch: copyControlPatchV1(target.patch),
    });
  });
  return Object.freeze({
    intentId: intent.intentId,
    targets: Object.freeze(targets),
  });
}

function copyControlPatchV1(
  patch: RuntimeControlPatchV1,
): RuntimeControlPatchV1 {
  assertSha256V1(patch?.targetInputSha256, "targetInputSha256");
  if (
    patch.values === null
    || typeof patch.values !== "object"
    || Array.isArray(patch.values)
    || Object.keys(patch.values).length === 0
  ) {
    throw new SimulationSessionCoordinatorErrorV1(
      "control patch values must be a non-empty object",
    );
  }
  const values: Record<string, boolean | number | string> = {};
  for (const [key, value] of Object.entries(patch.values)) {
    assertPortableIdV1(key, "control patch key");
    if (
      typeof value !== "boolean"
      && typeof value !== "string"
      && (typeof value !== "number" || !Number.isFinite(value))
    ) {
      throw new SimulationSessionCoordinatorErrorV1(
        `control patch ${key} must be a finite scalar`,
      );
    }
    values[key] = value;
  }
  return Object.freeze({
    targetInputSha256: patch.targetInputSha256,
    values: Object.freeze(values),
  });
}

function assertIntentEnvelopeV1(
  command: RuntimeTargetIntentCommandV1,
  result: RuntimeLiveIntentResultV1 | RuntimeStrictIntentResultV1,
): void {
  if (
    result?.sessionId !== command.sessionId
    || result?.intentId !== command.intentId
    || !Array.isArray(result.branches)
  ) {
    throw new SimulationSessionCoordinatorErrorV1(
      "runtime intent result identity mismatch",
    );
  }
}

function exactResultsByScenarioV1<T extends Readonly<{
  scenarioId: string;
}>>(
  command: RuntimeTargetIntentCommandV1,
  results: readonly T[],
  lane: string,
): Map<string, T> {
  if (results.length !== command.targets.length) {
    throw new SimulationSessionCoordinatorErrorV1(
      `${lane} intent result branch count mismatch`,
    );
  }
  const expected = new Set(command.targets.map(({ scenarioId }) => scenarioId));
  const map = new Map<string, T>();
  for (const result of results) {
    if (!expected.has(result.scenarioId) || map.has(result.scenarioId)) {
      throw new SimulationSessionCoordinatorErrorV1(
        `${lane} intent result has an unexpected or duplicate scenario`,
      );
    }
    map.set(result.scenarioId, result);
  }
  return map;
}

function targetForScenarioV1(
  command: RuntimeTargetIntentCommandV1,
  scenarioId: string,
): RuntimeTargetIntentBranchV1 | null {
  return command.targets.find((target) =>
    target.scenarioId === scenarioId
  ) ?? null;
}

function assertBranchResultIdentityV1(
  result: Readonly<{
    scenarioId: string;
    targetGeneration: number;
    targetInputSha256?: string;
  }>,
  target: RuntimeTargetIntentBranchV1,
  lane: string,
): void {
  const targetInputSha256 = "targetInputSha256" in result
    ? result.targetInputSha256
    : undefined;
  if (
    result.scenarioId !== target.scenarioId
    || result.targetGeneration !== target.targetGeneration
    || (
      targetInputSha256 !== undefined
      && targetInputSha256 !== target.patch.targetInputSha256
    )
  ) {
    throw new SimulationSessionCoordinatorErrorV1(
      `${lane} branch result identity mismatch`,
    );
  }
}

function laneFailureV1(
  command: RuntimeTargetIntentCommandV1,
  target: RuntimeTargetIntentBranchV1,
  lane: RuntimeLaneFailureV1["lane"],
  message: string,
): RuntimeLaneFailureV1 {
  if (typeof message !== "string" || message.length === 0) {
    throw new SimulationSessionCoordinatorErrorV1(
      `${lane} branch failure requires a message`,
    );
  }
  return Object.freeze({
    lane,
    intentId: command.intentId,
    targetGeneration: target.targetGeneration,
    message,
  });
}

function clearLaneFailureV1(
  failure: RuntimeLaneFailureV1 | null,
  lane: RuntimeLaneFailureV1["lane"],
): RuntimeLaneFailureV1 | null {
  return failure?.lane === lane ? null : failure;
}

function copyLiveResultV1(
  result: RuntimeLiveTransitionResultV1,
  target: RuntimeTargetIntentBranchV1,
): RuntimeLiveTransitionResultV1 {
  if (
    result?.scenarioId !== target.scenarioId
    || result?.targetGeneration !== target.targetGeneration
    || result?.presentationRevision !== target.presentationRevision
    || result?.targetInputSha256 !== target.patch.targetInputSha256
  ) {
    throw new SimulationSessionCoordinatorErrorV1(
      "live transition result identity mismatch",
    );
  }
  return Object.freeze({
    scenarioId: result.scenarioId,
    targetGeneration: result.targetGeneration,
    presentationRevision: result.presentationRevision,
    targetInputSha256: result.targetInputSha256,
    frame: copyFrameV1(result.frame),
  });
}

function copyCandidateV1(
  candidate: RuntimeSteadyCandidateV1,
  sessionId: string,
  target: RuntimeTargetIntentBranchV1,
): RuntimeSteadyCandidateV1 {
  if (
    candidate?.sessionId !== sessionId
    || candidate?.scenarioId !== target.scenarioId
    || candidate?.targetGeneration !== target.targetGeneration
    || candidate?.targetInputSha256 !== target.patch.targetInputSha256
    || candidate?.steadyStatus !== "converged"
    || candidate?.numericalHealth !== "passed"
  ) {
    throw new SimulationSessionCoordinatorErrorV1(
      "strict steady candidate identity or health mismatch",
    );
  }
  assertPortableIdV1(candidate.candidateId, "candidateId");
  return Object.freeze({
    candidateId: candidate.candidateId,
    sessionId: candidate.sessionId,
    scenarioId: candidate.scenarioId,
    targetGeneration: candidate.targetGeneration,
    sourceRunRef: copyArtifactRefV1(
      candidate.sourceRunRef,
      "run-artifact",
      "candidate.sourceRunRef",
    ),
    targetInputSha256: candidate.targetInputSha256,
    snapshotRef: copyArtifactRefV1(
      candidate.snapshotRef,
      "snapshot-envelope",
      "candidate.snapshotRef",
    ),
    execution: copyExecutionV1(candidate.execution),
    steadyStatus: "converged",
    numericalHealth: "passed",
  });
}

function copyPromotionV1(
  promoted: RuntimeCandidatePromotedV1,
  command: PromoteSteadyCandidateCommandV1,
): RuntimeCandidatePromotedV1 {
  if (
    promoted?.sessionId !== command.sessionId
    || promoted?.scenarioId !== command.scenarioId
    || promoted?.targetGeneration !== command.targetGeneration
    || promoted?.presentationRevision !== command.presentationRevision
    || promoted?.candidateId !== command.candidate.candidateId
  ) {
    throw new SimulationSessionCoordinatorErrorV1(
      "promoted candidate result identity mismatch",
    );
  }
  return Object.freeze({
    sessionId: promoted.sessionId,
    scenarioId: promoted.scenarioId,
    targetGeneration: promoted.targetGeneration,
    presentationRevision: promoted.presentationRevision,
    candidateId: promoted.candidateId,
    initialFrame: copyFrameV1(promoted.initialFrame),
  });
}

function copyFrameV1(
  frame: RuntimePresentationFrameV1,
): RuntimePresentationFrameV1 {
  return Object.freeze({
    point: copyPointV1(frame?.point),
    windowMetrics: copyMetricsV1(frame?.windowMetrics),
  });
}

function copyPointV1(
  point: RuntimeObservablePointV1,
): RuntimeObservablePointV1 {
  if (
    !Number.isSafeInteger(point?.sequence)
    || point.sequence < 0
    || !Number.isFinite(point?.simulationTimeSec)
    || point.simulationTimeSec < 0
    || (
      point.phase01 !== null
      && (
        !Number.isFinite(point.phase01)
        || point.phase01 < 0
        || point.phase01 >= 1
      )
    )
    || point.values === null
    || typeof point.values !== "object"
    || Array.isArray(point.values)
  ) {
    throw new SimulationSessionCoordinatorErrorV1(
      "runtime observable point is invalid",
    );
  }
  const values: Record<string, number> = {};
  for (const [key, value] of Object.entries(point.values)) {
    assertPortableIdV1(key, "observable id");
    if (!Number.isFinite(value)) {
      throw new SimulationSessionCoordinatorErrorV1(
        `observable ${key} must be finite`,
      );
    }
    values[key] = value;
  }
  return Object.freeze({
    sequence: point.sequence,
    simulationTimeSec: point.simulationTimeSec,
    phase01: point.phase01,
    values: Object.freeze(values),
  });
}

function copyMetricsV1(
  metrics: RuntimeWindowMetricStateV1,
): RuntimeWindowMetricStateV1 {
  if (
    metrics === null
    || typeof metrics !== "object"
    || !Number.isSafeInteger(metrics.collectedPointCount)
    || metrics.collectedPointCount < 1
  ) {
    throw new SimulationSessionCoordinatorErrorV1(
      "runtime window metric state is invalid",
    );
  }
  if (metrics.status === "collecting") {
    if (metrics.completedCycleCount !== 0) {
      throw new SimulationSessionCoordinatorErrorV1(
        "collecting metrics cannot claim a completed cycle",
      );
    }
    return collectingMetricsV1(metrics.collectedPointCount);
  }
  if (
    metrics.status !== "complete"
    || !Number.isSafeInteger(metrics.completedCycleCount)
    || metrics.completedCycleCount < 1
    || metrics.values === null
    || typeof metrics.values !== "object"
    || Array.isArray(metrics.values)
  ) {
    throw new SimulationSessionCoordinatorErrorV1(
      "complete runtime window metrics are invalid",
    );
  }
  const values: Record<string, number> = {};
  for (const [key, value] of Object.entries(metrics.values)) {
    assertPortableIdV1(key, "metric id");
    if (!Number.isFinite(value)) {
      throw new SimulationSessionCoordinatorErrorV1(
        `metric ${key} must be finite`,
      );
    }
    values[key] = value;
  }
  return Object.freeze({
    status: "complete",
    collectedPointCount: metrics.collectedPointCount,
    completedCycleCount: metrics.completedCycleCount,
    values: Object.freeze(values),
  });
}

function collectingMetricsV1(
  collectedPointCount: number,
): RuntimeWindowMetricStateV1 {
  return Object.freeze({
    status: "collecting" as const,
    collectedPointCount,
    completedCycleCount: 0 as const,
  });
}

function copyExecutionV1(
  execution: RuntimeExecutionIdentityV1,
): RuntimeExecutionIdentityV1 {
  const copy = {
    modelRef: execution?.modelRef,
    runtimeRef: execution?.runtimeRef,
    solverRef: execution?.solverRef,
    stateCodecRef: execution?.stateCodecRef,
    protocolRef: execution?.protocolRef,
  };
  for (const [key, value] of Object.entries(copy)) {
    assertPortableIdV1(value, `execution.${key}`);
  }
  return Object.freeze(copy) as RuntimeExecutionIdentityV1;
}

function copyArtifactRefV1<TKind extends StudioArtifactKindV1>(
  ref: StudioArtifactRefV1<TKind>,
  expectedKind: TKind,
  path: string,
): StudioArtifactRefV1<TKind> {
  if (
    ref?.schemaId !== STUDIO_ARTIFACT_REF_V1_SCHEMA_ID
    || ref.kind !== expectedKind
    || !SHA256_HEX_PATTERN_V1.test(ref.sha256)
    || typeof ref.mediaType !== "string"
    || ref.mediaType.length === 0
    || !Number.isSafeInteger(ref.byteLength)
    || ref.byteLength < 0
  ) {
    throw new SimulationSessionCoordinatorErrorV1(
      `${path} is not a valid ${expectedKind} artifact ref`,
    );
  }
  return Object.freeze({
    schemaId: STUDIO_ARTIFACT_REF_V1_SCHEMA_ID,
    kind: ref.kind,
    sha256: ref.sha256,
    mediaType: ref.mediaType,
    byteLength: ref.byteLength,
  });
}

function assertSha256V1(
  value: unknown,
  path: string,
): asserts value is Sha256HexV1 {
  if (typeof value !== "string" || !SHA256_HEX_PATTERN_V1.test(value)) {
    throw new SimulationSessionCoordinatorErrorV1(
      `${path} must be lowercase SHA-256 hex`,
    );
  }
}

function assertPortableIdV1(
  value: unknown,
  path: string,
): asserts value is string {
  if (
    typeof value !== "string"
    || !/^[A-Za-z0-9][A-Za-z0-9._:@/-]*$/.test(value)
  ) {
    throw new SimulationSessionCoordinatorErrorV1(
      `${path} must be a portable identifier`,
    );
  }
}

function errorMessageV1(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
