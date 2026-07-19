import { expect, test } from "@playwright/test";

test("production browser runs the exact-P1 scientific performance path", async ({
  page,
}, testInfo) => {
  const browserErrors: string[] = [];
  page.on("pageerror", (error) => browserErrors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (
      message.type() === "error"
      && message.text() !== "Please check your Firebase configuration."
    ) {
      browserErrors.push(`console.error: ${message.text()}`);
    }
  });

  try {
  await page.goto("/ja/scientific-performance-lab", {
    waitUntil: "domcontentloaded",
  });

  const lab = page.getByTestId("scientific-browser-performance-lab-v0");
  const raw = page.getByTestId("scientific-browser-raw-trace-v0");
  await expect(lab).toHaveAttribute("data-state", "complete", {
    timeout: 120_000,
  });
  await expect(raw).toHaveAttribute("data-state", "complete");

  const rawText = await raw.textContent();
  expect(rawText).not.toBeNull();
  const trace = JSON.parse(rawText!);
  await testInfo.attach("scientific-browser-raw-trace-v0.json", {
    body: Buffer.from(JSON.stringify(trace, null, 2)),
    contentType: "application/json",
  });

  expect(trace.traceId).toBe("circleheart-scientific-browser-raw-trace-v0");
  expect(trace.status).toBe("raw-measurement-only");
  expect(trace.environmentObservation.productionBuild).toBe(true);
  expect(trace.scientific).toMatchObject({
    observableSampleCount: 501,
    acceptedStepSampleCount: 500,
    captureWorkerCommandCount: 125,
    allOfficialWorkerRequestCount: 127,
    period1Confirmed: true,
    responseTimingFieldsAllowed: false,
  });
  expect(trace.workerProbe.counts).toEqual({
    totalRequestCount: 127,
    settledPromiseCount: 127,
    scientificResponseCount: 127,
    captureRequestCount: 125,
    captureScientificResponseCount: 125,
    captureAcceptedStepFrameCount: 500,
    workerCommandTimingMessageCount: 127,
    joinedWorkerTimingRequestCount: 127,
    duplicateWorkerTimingMessageCount: 0,
  });
  expect(trace.presentation).toMatchObject({
    readySurfaceCommitCount: 1,
    animationFrameCallbackCount: 2,
    arbitraryReadyPaintCountAvailable: false,
  });
  expect(trace.workerProbe.audit).toMatchObject({
    timingFieldsAddedToScientificCommand: false,
    timingFieldsAddedToScientificResponse: false,
    commandObjectForwardedByIdentity: true,
    responseObjectReturnedByIdentity: true,
    scientificProtocolUsedAsTelemetryChannel: false,
  });
  expect(trace.claims).toEqual({
    performanceAcceptanceApplied: false,
    productionCutoverClaimed: false,
    supportedHardwareCertified: false,
    clinicalValidationClaimed: false,
    scientificResponseMutatedForTiming: false,
  });
  expect(trace.telemetryJoin).toEqual({ outcome: "complete", message: null });

  for (const value of Object.values(trace.stageIntervals)) {
    expect(Number.isFinite(value)).toBe(true);
    expect(value).toBeGreaterThanOrEqual(0);
  }
  for (const value of [
    trace.workerProbe.workerConstructionCallMs,
    trace.workerProbe.sidebandConnectPostCallMs,
    trace.workerProbe.workerConstructionToProtocolReadyHostMs,
    trace.presentation.maximumAnimationFrameGapMs,
  ]) {
    expect(Number.isFinite(value)).toBe(true);
    expect(value).toBeGreaterThanOrEqual(0);
  }
  expect(trace.environmentObservation).toMatchObject({
    viewportCssPx: { width: 1440, height: 1000 },
    devicePixelRatio: 1,
  });
  expect(trace.environmentObservation.userAgent).toContain("Chrome");
  for (const resource of trace.environmentObservation.resourceEntries) {
    expect(resource.name).not.toContain("?");
    expect(resource.name).not.toContain("#");
  }

  expect(trace.workerProbe.requests).toHaveLength(127);
  expect(trace.workerProbe.requests[0].commandKind)
    .toBe("createOfficialDocumentCaseSession");
  expect(trace.workerProbe.requests[1].commandKind).toBe("settlePeriodic");
  expect(trace.workerProbe.requests.slice(2).every(
    (request: { commandKind: string }) => request.commandKind === "runTransient",
  )).toBe(true);
  for (const request of trace.workerProbe.requests) {
    expect(request.promiseState).toBe("fulfilled");
    expect(request.scientificResponseReceived).toBe(true);
    expect(request.requestStartedAtHostMs)
      .toBeLessThanOrEqual(request.requestCallReturnedAtHostMs);
    expect(request.responseEventArrivedAtHostMs)
      .toBeLessThanOrEqual(request.clientHandlerReturnedAtHostMs);
    expect(request.clientHandlerReturnedAtHostMs)
      .toBeLessThanOrEqual(request.promiseSettledAtHostMs);
    expect(request.worker.receivedAtWorkerMs)
      .toBeLessThanOrEqual(request.worker.kernelStartedAtWorkerMs);
    expect(request.worker.kernelStartedAtWorkerMs)
      .toBeLessThanOrEqual(request.worker.kernelSettledAtWorkerMs);
    expect(request.worker.kernelSettledAtWorkerMs)
      .toBeLessThanOrEqual(request.worker.scientificResponsePostStartedAtWorkerMs);
    expect(request.worker.scientificResponsePostStartedAtWorkerMs)
      .toBeLessThanOrEqual(request.worker.scientificResponsePostReturnedAtWorkerMs);
    for (const value of [
      request.roundTripMs,
      request.scientificPostMessageCallMs,
      request.clientMessageHandlerMs,
      request.worker?.kernelHandleMs,
      request.worker?.scientificResponsePostCallMs,
    ]) {
      expect(Number.isFinite(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
    }
  }

  await expect(page.locator(
    'article[data-testid^="scientific-workspace-panel-"]',
  )).toHaveCount(8);
  expect(browserErrors).toEqual([]);
  } finally {
    await testInfo.attach("browser-errors.txt", {
      body: Buffer.from(browserErrors.join("\n") || "none"),
      contentType: "text/plain",
    });
  }
});
