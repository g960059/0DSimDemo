import { describe, expect, it } from "vitest";

import {
  loadMainWireAdultFiveWallIntegratedPreviewReleaseV1,
  MAIN_WIRE_ADULT_FIVE_WALL_INTEGRATED_PREVIEW_RELEASE_V1_SHA256,
  MAIN_WIRE_INTEGRATED_PREVIEW_SEED_CHECKPOINT_SHA256,
} from "@/engine/scientific/assembly";
import {
  loadMainWireIntegratedPreviewSeedRunV1,
  MainWireIntegratedPreviewSessionV1,
  projectMainWireIntegratedPreviewRunV1,
} from "@/engine/scientific/integratedPreview";
import { sha256CanonicalJsonHex } from "@/engine/scientific/release";
import {
  MainWireIntegratedPreviewWorkerKernelV1,
} from "@/engine/scientific/worker/MainWireIntegratedPreviewWorkerKernelV1";
import {
  INTEGRATED_PREVIEW_COMMAND_PROTOCOL_V1_ID,
} from "@/engine/scientific/worker/integratedPreviewCommandProtocolV1";

describe("integrated preview release-bound session V1", () => {
  it("loads the exact release and content-addressed P1 seed", async () => {
    const [release, seed] = await Promise.all([
      loadMainWireAdultFiveWallIntegratedPreviewReleaseV1(),
      loadMainWireIntegratedPreviewSeedRunV1(),
    ]);

    expect(release.ref.sha256)
      .toBe(MAIN_WIRE_ADULT_FIVE_WALL_INTEGRATED_PREVIEW_RELEASE_V1_SHA256);
    expect(release.manifest.lifecycleStatus).toBe("development");
    expect(seed.payload.sourceEvidence.classification.status)
      .toBe("period1-converged");
    expect(seed.payload.displaySeed.terminalCycleTrace.samples).toHaveLength(504);
    expect(seed.payload.modelState.checkpointSha256)
      .toBe(MAIN_WIRE_INTEGRATED_PREVIEW_SEED_CHECKPOINT_SHA256);

    const session = await MainWireIntegratedPreviewSessionV1.create("all-off");
    const artifact = await session.seedRunArtifact();
    const { artifactSha256, ...payload } = artifact;
    expect(await sha256CanonicalJsonHex(payload)).toBe(artifactSha256);
    expect(artifact.releaseRef).toEqual(release.ref);
    expect(artifact.run.numericalPeriod1Established).toBe(true);
    expect(artifact.run.execution).toEqual({
      operation: "project-bundled-p1-seed",
      continuationBeatCountFromSeed: 0,
    });
    expect(artifact.run.trace).toHaveLength(504);
  });

  it("runs one atomic composed-rhythm/coronary/HMII post-activation beat", async () => {
    const session = await MainWireIntegratedPreviewSessionV1.create(
      "lvad-hmii-9000-one-beat-transient",
    );
    const artifact = await session.runNextBeatArtifact();
    const presentation = projectMainWireIntegratedPreviewRunV1(artifact);

    expect(presentation.simulationInputSpec.mechanicalSupport).toEqual({
      presetId: "lvad-hmii-9000-one-beat-transient",
      activeDeviceIds: ["LVAD"],
      interpretation: "one-unsteady-post-activation-beat",
    });
    expect(presentation.run.kind).toBe("one-beat-continuation");
    expect(presentation.run.execution).toEqual({
      operation: "advance-one-fixed-sinus-cycle",
      requestedDurationSec: 1,
      continuationBeatOrdinalFromSeed: 1,
    });
    expect(presentation.run.endAcceptedTimeSec
      - presentation.run.startAcceptedTimeSec).toBe(1);
    expect(presentation.run.numericalPeriod1Established)
      .toBe("not-assessed-for-this-continuation");
    expect(presentation.trace.length).toBeGreaterThanOrEqual(500);
    expect(presentation.trace.some((sample) =>
      Math.abs(sample.dynamicMcsAcceptedFlowMlPerSec.LVAD) > 1e-6))
      .toBe(true);
    expect(presentation.trace.some((sample) =>
      sample.acceptedEventIdentity.atrialCapturedActivationId !== null))
      .toBe(true);
    expect(presentation.trace.some((sample) =>
      sample.acceptedEventIdentity.ventricularCapturedActivationId !== null))
      .toBe(true);
    expect(presentation.run.maximumTotalBloodVolumeErrorMl).toBeLessThan(1e-8);
    expect(presentation.run.maximumCoronaryBloodVolumeLedgerResidualMl)
      .toBeLessThan(1e-8);
    expect(presentation.run.maximumDynamicMcsConservationResidualMlPerSec)
      .toBeLessThan(1e-12);
    expect(presentation.modelStateRef.acceptedTimeSec).toBe(71);
  }, 60_000);

  it("exposes only exact, bounded Worker commands and complete artifacts", async () => {
    const kernel = new MainWireIntegratedPreviewWorkerKernelV1(1);
    const invalid = await kernel.handle({
      protocolId: INTEGRATED_PREVIEW_COMMAND_PROTOCOL_V1_ID,
      kind: "createSession",
      requestId: "request-invalid",
      sessionId: "preview-session",
      mcsPresetId: "all-off",
      ignoredFallback: true,
    });
    expect(invalid).toMatchObject({
      ok: false,
      error: { code: "invalid-command" },
    });

    const created = await kernel.handle({
      protocolId: INTEGRATED_PREVIEW_COMMAND_PROTOCOL_V1_ID,
      kind: "createSession",
      requestId: "request-create",
      sessionId: "preview-session",
      mcsPresetId: "all-off",
    });
    expect(created.ok).toBe(true);
    if (created.ok === false) throw new Error(created.error.message);
    expect(created.artifact?.modelState.checkpointSha256)
      .toBe(MAIN_WIRE_INTEGRATED_PREVIEW_SEED_CHECKPOINT_SHA256);
    expect(created.presentation?.trace).toHaveLength(504);

    const disposed = await kernel.handle({
      protocolId: INTEGRATED_PREVIEW_COMMAND_PROTOCOL_V1_ID,
      kind: "disposeSession",
      requestId: "request-dispose",
      sessionId: "preview-session",
    });
    expect(disposed).toMatchObject({
      ok: true,
      disposed: true,
      artifact: null,
      presentation: null,
    });
  });
});
