import {
  expect,
  test,
  type Locator,
  type Page,
  type TestInfo,
} from "@playwright/test";

const CONTROLLER_TEST_ID = "scientific-transition-controller-v0";
const RENDERER_TEST_ID = "scientific-workspace-renderer-v1";

type TransitionControllerSnapshotV0 = Readonly<{
  phase: string;
  mode: string;
  sourceSessionId: string;
  candidateSessionId: string;
  sourceControlSha256: string;
  targetControlSha256: string;
  displayedControlSha256: string;
  displayedEvidence: string;
  sourceParameterEpoch: string;
  candidateParameterEpoch: string;
  parameterEpoch: string;
  remainingRegularRequestCount: string;
  inFlight: string;
  periodicStatus: string;
  completedBeatCount: string;
  capturedStepCount: string;
  sourceRetirementPending: string;
}>;

type RendererSnapshotV0 = Readonly<{
  workspaceSha256: string;
  baseCaseSha256: string;
  frameCount: string;
  firstRevision: string;
  finalRevision: string;
  firstAcceptedTimeSec: string;
  finalAcceptedTimeSec: string;
}>;

type TransitionTraceSnapshotV0 = Readonly<{
  controller: TransitionControllerSnapshotV0;
  renderer: RendererSnapshotV0;
}>;

test.describe.serial("research control transitions in the production browser Worker", () => {
  test(
    "steady mode keeps the source plot intact until a P1 following-cycle promotion",
    { tag: "@full-e2e" },
    async ({ page }, testInfo) => {
    test.setTimeout(240_000);
    const browserErrors = captureBrowserErrors(page);

    try {
      const { controller, renderer } = await openReadyWorkbench(page);
      const initial = await readTransitionSnapshot(controller, renderer);
      expect(initial.renderer.frameCount).toBe("501");
      expect(initial.controller.phase).toBe("idle");
      expect(initial.controller.candidateSessionId).toBe("");
      expect(initial.controller.candidateParameterEpoch).toBe("");
      expect(initial.controller.sourceParameterEpoch)
        .toBe(initial.controller.parameterEpoch);
      expect(initial.controller.displayedControlSha256)
        .toBe(initial.controller.sourceControlSha256);
      expect(initial.controller.displayedEvidence)
        .toBe("retained-period1-source-cycle");

      await page.getByTestId("scientific-control-svr-v0")
        .selectOption("0.75");
      await page.getByTestId("scientific-transition-mode-steady-v0").check();
      await installTransitionTrace(page);
      await page.getByTestId("scientific-transition-apply-v0").click();

      const initialEpoch = numeric(initial.controller.parameterEpoch);
      await expect.poll(
        async () => numeric(await controller.getAttribute("data-parameter-epoch")),
        { timeout: 210_000 },
      ).toBe(initialEpoch + 1);
      await expect(controller).toHaveAttribute("data-phase", "idle");
      await expect(controller).toHaveAttribute(
        "data-source-retirement-pending",
        "false",
      );
      await expect(renderer).toHaveAttribute("data-frame-count", "501");

      const final = await readTransitionSnapshot(controller, renderer);
      const trace = await readTransitionTrace(page);
      await attachTrace(testInfo, "steady-transition-trace-v0.json", trace);

      expect(final.controller.sourceControlSha256)
        .not.toBe(initial.controller.sourceControlSha256);
      expect(final.controller.displayedControlSha256)
        .toBe(final.controller.sourceControlSha256);
      expect(final.controller.displayedEvidence)
        .toBe("target-period1-and-following-cycle-validated");
      expect(final.controller.candidateSessionId).toBe("");
      expect(final.controller.parameterEpoch).toBe(String(initialEpoch + 1));
      expect(final.controller.sourceParameterEpoch).toBe(String(initialEpoch + 1));
      expect(final.controller.candidateParameterEpoch).toBe("");
      expect(final.renderer.frameCount).toBe("501");
      expect(
        numeric(final.renderer.finalRevision)
          - numeric(final.renderer.firstRevision),
      ).toBe(500);
      expect(
        numeric(final.renderer.finalAcceptedTimeSec)
          - numeric(final.renderer.firstAcceptedTimeSec),
      ).toBeCloseTo(1, 10);
      expect(numeric(final.renderer.finalRevision)).toBe(
        numeric(initial.renderer.finalRevision)
          + (numeric(final.controller.completedBeatCount) + 1) * 500,
      );
      expect(numeric(final.controller.remainingRegularRequestCount))
        .toBeLessThan(numeric(initial.controller.remainingRegularRequestCount));

      const phases = new Set(trace.map(({ controller: value }) => value.phase));
      expect(phases).toContain("steady-settling");
      expect(phases).toContain("steady-capturing");
      expect(trace.some(({ controller: value }) =>
        value.periodicStatus === "period1-converged"
      )).toBe(true);
      expect(trace.some(({ controller: value }) =>
        value.capturedStepCount === "500"
      )).toBe(true);

      const targetDigest = trace
        .map(({ controller: value }) => value.targetControlSha256)
        .find((value) =>
          value !== "" && value !== initial.controller.sourceControlSha256
        );
      expect(targetDigest).toBeTruthy();
      expect(final.controller.sourceControlSha256).toBe(targetDigest);

      // The candidate may settle and capture for many Worker commands, but
      // presentation remains the exact source cycle until one React commit
      // promotes the fully validated 501-frame following cycle.
      for (const snapshot of trace) {
        if (
          snapshot.controller.sourceControlSha256
            === initial.controller.sourceControlSha256
        ) {
          expect(snapshot.renderer).toEqual(initial.renderer);
          expect(snapshot.controller.sourceParameterEpoch)
            .toBe(initial.controller.sourceParameterEpoch);
          expect(snapshot.controller.parameterEpoch)
            .toBe(initial.controller.parameterEpoch);
          expect(snapshot.controller.displayedControlSha256)
            .toBe(initial.controller.sourceControlSha256);
          expect(snapshot.controller.displayedEvidence)
            .toBe("retained-period1-source-cycle");
        }
      }
      const rendererSequence = distinctRendererSequence([
        initial,
        ...trace,
      ]);
      expect(rendererSequence).toEqual([initial.renderer, final.renderer]);
      const firstPromoted = trace.find((snapshot) =>
        !sameRenderer(snapshot.renderer, initial.renderer)
      );
      expect(firstPromoted).toBeDefined();
      expect(firstPromoted!.controller).toMatchObject({
        phase: "idle",
        sourceControlSha256: targetDigest,
        parameterEpoch: String(initialEpoch + 1),
        candidateSessionId: "",
        periodicStatus: "period1-converged-and-cycle-validated",
        capturedStepCount: "500",
      });
      expect(browserErrors).toEqual([]);
    } finally {
      await attachBrowserErrors(testInfo, browserErrors);
    }
    },
  );

  test(
    "live mode shows accepted four-step transitions, pauses, resumes, and resets exactly",
    { tag: "@full-e2e" },
    async ({ page }, testInfo) => {
    test.setTimeout(180_000);
    const browserErrors = captureBrowserErrors(page);

    try {
      const { controller, renderer } = await openReadyWorkbench(page);
      const initial = await readTransitionSnapshot(controller, renderer);
      expect(initial.renderer.frameCount).toBe("501");

      await page.getByTestId("scientific-control-pvr-v0")
        .selectOption("0.75");
      await page.getByTestId("scientific-transition-mode-live-v0").check();
      await installTransitionTrace(page);
      await page.getByTestId("scientific-transition-apply-v0").click();

      await expect(controller).toHaveAttribute("data-phase", "live-running", {
        timeout: 30_000,
      });
      await expect.poll(
        async () => numeric(await renderer.getAttribute("data-frame-count")),
        { timeout: 30_000 },
      ).toBeGreaterThanOrEqual(13);

      await page.getByTestId("scientific-transition-pause-v0").click();
      await expect(controller).toHaveAttribute("data-phase", "live-paused");
      await expect(controller).toHaveAttribute("data-in-flight", "false");
      // Allow the final animation-frame presentation commit belonging to the
      // acknowledged in-flight command to drain before measuring stability.
      await page.waitForTimeout(75);
      const paused = await readTransitionSnapshot(controller, renderer);
      await page.waitForTimeout(350);
      const stillPaused = await readTransitionSnapshot(controller, renderer);
      expect(stillPaused.renderer).toEqual(paused.renderer);
      expect(stillPaused.controller.phase).toBe("live-paused");
      expect(stillPaused.controller.inFlight).toBe("false");

      const pausedFinalRevision = numeric(paused.renderer.finalRevision);
      await page.getByTestId("scientific-transition-resume-v0").click();
      await expect(controller).toHaveAttribute("data-phase", "live-running");
      await expect.poll(
        async () => numeric(await renderer.getAttribute("data-final-revision")),
        { timeout: 30_000 },
      ).toBeGreaterThan(pausedFinalRevision);

      await page.getByTestId("scientific-transition-pause-v0").click();
      await expect(controller).toHaveAttribute("data-phase", "live-paused");
      await expect(controller).toHaveAttribute("data-in-flight", "false");
      await page.getByTestId("scientific-transition-reset-v0").click();
      await expect(controller).toHaveAttribute("data-phase", "idle");
      await expect(controller).toHaveAttribute("data-candidate-session-id", "");

      const reset = await readTransitionSnapshot(controller, renderer);
      const trace = await readTransitionTrace(page);
      await attachTrace(testInfo, "live-transition-trace-v0.json", trace);

      expect(reset.renderer).toEqual(initial.renderer);
      expect(reset.controller.sourceSessionId)
        .toBe(initial.controller.sourceSessionId);
      expect(reset.controller.sourceControlSha256)
        .toBe(initial.controller.sourceControlSha256);
      expect(reset.controller.parameterEpoch)
        .toBe(initial.controller.parameterEpoch);
      expect(reset.controller.sourceParameterEpoch)
        .toBe(initial.controller.sourceParameterEpoch);
      expect(reset.controller.candidateParameterEpoch).toBe("");
      expect(reset.controller.displayedControlSha256)
        .toBe(initial.controller.sourceControlSha256);
      expect(reset.controller.displayedEvidence)
        .toBe("retained-period1-source-cycle");
      expect(numeric(reset.controller.remainingRegularRequestCount))
        .toBeLessThan(numeric(initial.controller.remainingRegularRequestCount));

      const targetDigest = trace
        .map(({ controller: value }) => value.targetControlSha256)
        .find((value) =>
          value !== "" && value !== initial.controller.sourceControlSha256
        );
      expect(targetDigest).toBeTruthy();
      const liveSnapshots = trace.filter((snapshot) =>
        !sameRenderer(snapshot.renderer, initial.renderer)
      );
      expect(liveSnapshots.length).toBeGreaterThan(0);
      const firstLive = liveSnapshots[0]!;

      // The new branch starts at the exact accepted state displayed at the
      // right boundary of the source cycle; it is not concatenated with the
      // old 501-frame plot.
      expect(firstLive.renderer.firstRevision)
        .toBe(initial.renderer.finalRevision);
      expect(firstLive.renderer.firstAcceptedTimeSec)
        .toBe(initial.renderer.finalAcceptedTimeSec);
      expect(firstLive.controller.sourceParameterEpoch)
        .toBe(initial.controller.sourceParameterEpoch);
      expect(firstLive.controller.candidateParameterEpoch)
        .toBe(String(numeric(initial.controller.parameterEpoch) + 1));
      expect(firstLive.controller.parameterEpoch)
        .toBe(firstLive.controller.candidateParameterEpoch);
      expect(firstLive.controller.displayedControlSha256).toBe(targetDigest);
      expect(firstLive.controller.displayedEvidence)
        .toBe("open-transient-no-periodic-claim");

      // Before the rolling history reaches its 501-frame cap, every visible
      // update contains the fork boundary plus complete four-step/stride-one
      // Worker responses: 1, 5, 9, ... contiguous accepted-state samples.
      for (const snapshot of liveSnapshots) {
        const frameCount = numeric(snapshot.renderer.frameCount);
        if (frameCount > 501) continue;
        expect((frameCount - 1) % 4).toBe(0);
        expect(
          numeric(snapshot.renderer.finalRevision)
            - numeric(snapshot.renderer.firstRevision),
        ).toBe(frameCount - 1);
        expect(
          numeric(snapshot.renderer.finalAcceptedTimeSec)
            - numeric(snapshot.renderer.firstAcceptedTimeSec),
        ).toBeCloseTo((frameCount - 1) * 0.002, 9);
      }
      expect(trace.some(({ controller: value }) =>
        value.phase === "live-paused" && value.inFlight === "false"
      )).toBe(true);

      expect(browserErrors).toEqual([]);
    } finally {
      await attachBrowserErrors(testInfo, browserErrors);
    }
    },
  );
});

async function openReadyWorkbench(page: Page): Promise<Readonly<{
  controller: Locator;
  renderer: Locator;
}>> {
  // The transition assertions are not a first-run disclaimer test. Preserve
  // the same acknowledged browser state a returning research user has so the
  // global modal cannot intercept controller input.
  await page.addInitScript(() => {
    localStorage.setItem("circleheart.modelLimitations.ack.v1", "1");
  });
  await page.goto("/ja/scientific-workbench", {
    waitUntil: "domcontentloaded",
  });
  const controller = page.getByTestId(CONTROLLER_TEST_ID);
  const renderer = page.getByTestId(RENDERER_TEST_ID);
  await expect(controller).toHaveAttribute("data-phase", "idle", {
    timeout: 120_000,
  });
  await expect(renderer).toHaveAttribute("data-frame-count", "501");
  return { controller, renderer };
}

async function installTransitionTrace(page: Page): Promise<void> {
  await page.evaluate(({ controllerTestId, rendererTestId }) => {
    const controller = document.querySelector<HTMLElement>(
      `[data-testid="${controllerTestId}"]`,
    );
    const renderer = document.querySelector<HTMLElement>(
      `[data-testid="${rendererTestId}"]`,
    );
    if (controller === null || renderer === null) {
      throw new Error("scientific transition trace surfaces are unavailable");
    }

    const state = {
      records: [] as TransitionTraceSnapshotV0[],
      lastJson: "",
    };
    const record = () => {
      const snapshot: TransitionTraceSnapshotV0 = {
        controller: readControllerElement(controller),
        renderer: readRendererElement(renderer),
      };
      const json = JSON.stringify(snapshot);
      if (json !== state.lastJson) {
        state.records.push(snapshot);
        state.lastJson = json;
      }
    };
    record();
    const observer = new MutationObserver(record);
    observer.observe(controller, { attributes: true });
    observer.observe(renderer, { attributes: true });
    (globalThis as typeof globalThis & {
      __scientificTransitionTraceV0?: Readonly<{
        state: typeof state;
        observer: MutationObserver;
      }>;
    }).__scientificTransitionTraceV0 = { state, observer };

    function readControllerElement(
      element: HTMLElement,
    ): TransitionControllerSnapshotV0 {
      return {
        phase: element.dataset.phase ?? "",
        mode: element.dataset.mode ?? "",
        sourceSessionId: element.dataset.sourceSessionId ?? "",
        candidateSessionId: element.dataset.candidateSessionId ?? "",
        sourceControlSha256: element.dataset.sourceControlSha256 ?? "",
        targetControlSha256: element.dataset.targetControlSha256 ?? "",
        displayedControlSha256:
          element.dataset.displayedControlSha256 ?? "",
        displayedEvidence: element.dataset.displayedEvidence ?? "",
        sourceParameterEpoch: element.dataset.sourceParameterEpoch ?? "",
        candidateParameterEpoch: element.dataset.candidateParameterEpoch ?? "",
        parameterEpoch: element.dataset.parameterEpoch ?? "",
        remainingRegularRequestCount:
          element.dataset.remainingRegularRequestCount ?? "",
        inFlight: element.dataset.inFlight ?? "",
        periodicStatus: element.dataset.periodicStatus ?? "",
        completedBeatCount: element.dataset.completedBeatCount ?? "",
        capturedStepCount: element.dataset.capturedStepCount ?? "",
        sourceRetirementPending:
          element.dataset.sourceRetirementPending ?? "",
      };
    }

    function readRendererElement(element: HTMLElement): RendererSnapshotV0 {
      return {
        workspaceSha256: element.dataset.workspaceSha256 ?? "",
        baseCaseSha256: element.dataset.baseCaseSha256 ?? "",
        frameCount: element.dataset.frameCount ?? "",
        firstRevision: element.dataset.firstRevision ?? "",
        finalRevision: element.dataset.finalRevision ?? "",
        firstAcceptedTimeSec: element.dataset.firstAcceptedTimeSec ?? "",
        finalAcceptedTimeSec: element.dataset.finalAcceptedTimeSec ?? "",
      };
    }
  }, {
    controllerTestId: CONTROLLER_TEST_ID,
    rendererTestId: RENDERER_TEST_ID,
  });
}

async function readTransitionTrace(
  page: Page,
): Promise<TransitionTraceSnapshotV0[]> {
  return page.evaluate(() => {
    const trace = (globalThis as typeof globalThis & {
      __scientificTransitionTraceV0?: Readonly<{
        state: Readonly<{ records: TransitionTraceSnapshotV0[] }>;
        observer: MutationObserver;
      }>;
    }).__scientificTransitionTraceV0;
    if (trace === undefined) throw new Error("transition trace was not installed");
    return structuredClone(trace.state.records);
  });
}

async function readTransitionSnapshot(
  controller: Locator,
  renderer: Locator,
): Promise<TransitionTraceSnapshotV0> {
  return {
    controller: {
      phase: await requiredAttribute(controller, "data-phase"),
      mode: await requiredAttribute(controller, "data-mode"),
      sourceSessionId: await requiredAttribute(controller, "data-source-session-id"),
      candidateSessionId: await requiredAttribute(
        controller,
        "data-candidate-session-id",
      ),
      sourceControlSha256: await requiredAttribute(
        controller,
        "data-source-control-sha256",
      ),
      targetControlSha256: await requiredAttribute(
        controller,
        "data-target-control-sha256",
      ),
      displayedControlSha256: await requiredAttribute(
        controller,
        "data-displayed-control-sha256",
      ),
      displayedEvidence: await requiredAttribute(
        controller,
        "data-displayed-evidence",
      ),
      parameterEpoch: await requiredAttribute(controller, "data-parameter-epoch"),
      sourceParameterEpoch: await requiredAttribute(
        controller,
        "data-source-parameter-epoch",
      ),
      candidateParameterEpoch: await requiredAttribute(
        controller,
        "data-candidate-parameter-epoch",
      ),
      remainingRegularRequestCount: await requiredAttribute(
        controller,
        "data-remaining-regular-request-count",
      ),
      inFlight: await requiredAttribute(controller, "data-in-flight"),
      periodicStatus: await requiredAttribute(controller, "data-periodic-status"),
      completedBeatCount: await requiredAttribute(
        controller,
        "data-completed-beat-count",
      ),
      capturedStepCount: await requiredAttribute(
        controller,
        "data-captured-step-count",
      ),
      sourceRetirementPending: await requiredAttribute(
        controller,
        "data-source-retirement-pending",
      ),
    },
    renderer: {
      workspaceSha256: await requiredAttribute(renderer, "data-workspace-sha256"),
      baseCaseSha256: await requiredAttribute(
        renderer,
        "data-base-case-sha256",
      ),
      frameCount: await requiredAttribute(renderer, "data-frame-count"),
      firstRevision: await requiredAttribute(renderer, "data-first-revision"),
      finalRevision: await requiredAttribute(renderer, "data-final-revision"),
      firstAcceptedTimeSec: await requiredAttribute(
        renderer,
        "data-first-accepted-time-sec",
      ),
      finalAcceptedTimeSec: await requiredAttribute(
        renderer,
        "data-final-accepted-time-sec",
      ),
    },
  };
}

async function requiredAttribute(
  locator: Locator,
  name: string,
): Promise<string> {
  const value = await locator.getAttribute(name);
  if (value === null) throw new Error(`${name} is absent from the E2E surface`);
  return value;
}

function numeric(value: string | null): number {
  if (value === null || value.trim() === "") {
    throw new Error(`expected finite number, got ${String(value)}`);
  }
  const result = Number(value);
  if (!Number.isFinite(result)) throw new Error(`expected finite number, got ${value}`);
  return result;
}

function sameRenderer(
  left: RendererSnapshotV0,
  right: RendererSnapshotV0,
): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function distinctRendererSequence(
  snapshots: readonly TransitionTraceSnapshotV0[],
): RendererSnapshotV0[] {
  const result: RendererSnapshotV0[] = [];
  for (const { renderer } of snapshots) {
    if (result.length === 0 || !sameRenderer(result.at(-1)!, renderer)) {
      result.push(renderer);
    }
  }
  return result;
}

function captureBrowserErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (
      message.type() === "error"
      && message.text() !== "Please check your Firebase configuration."
    ) {
      errors.push(`console.error: ${message.text()}`);
    }
  });
  return errors;
}

async function attachTrace(
  testInfo: TestInfo,
  name: string,
  trace: readonly TransitionTraceSnapshotV0[],
): Promise<void> {
  await testInfo.attach(name, {
    body: Buffer.from(JSON.stringify(trace, null, 2)),
    contentType: "application/json",
  });
}

async function attachBrowserErrors(
  testInfo: TestInfo,
  browserErrors: readonly string[],
): Promise<void> {
  await testInfo.attach("browser-errors.txt", {
    body: Buffer.from(browserErrors.join("\n") || "none"),
    contentType: "text/plain",
  });
}
