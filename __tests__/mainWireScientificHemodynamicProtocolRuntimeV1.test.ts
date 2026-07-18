import { describe, expect, it } from "vitest";

import {
  loadBundledOfficialHealthyPeriodicDocumentChainV1,
} from "@/engine/scientificBrowser/bundledOfficialHealthyPeriodicDocumentChainV1";
import {
  MainWireScientificInProcessKernelV1,
  SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
} from "@/engine/scientific/worker";

describe("main-wire scientific hemodynamic protocol runtime V1", () => {
  it("runs the fixed-TBV IVC-like protocol read-only and excludes alternans-suspect evidence", async () => {
    const kernel = new MainWireScientificInProcessKernelV1({
      officialDocumentCaseLoader:
        loadBundledOfficialHealthyPeriodicDocumentChainV1,
    });
    const sessionId = "hemodynamic-protocol-runtime";
    const created = await kernel.handle(Object.freeze({
      ...baseCommand(
        "createOfficialDocumentCaseSession",
        "request-hemodynamic-create",
        sessionId,
      ),
      presetId: "circleheart/official-healthy-periodic" as const,
      presetVersion: "1.0.0" as const,
    }));
    expect(created).toMatchObject({
      ok: true,
      payload: {
        kind: "officialDocumentCaseSessionCreated",
        periodicSteadyStateClaimed: true,
      },
    });

    const before = await kernel.handle(baseCommand(
      "observe",
      "request-hemodynamic-before",
      sessionId,
    ));
    if (before.ok === false || before.payload.kind !== "observation") {
      throw new Error("expected source observation before protocol");
    }
    const sourceFrame = before.payload.observableFrame;

    const protocol = await kernel.handle(baseCommand(
      "runPvRelationsProtocol",
      "request-hemodynamic-pv-relations",
      sessionId,
    ));
    if (
      protocol.ok === false
      || protocol.payload.kind !== "pvRelationsProtocolCompleted"
    ) {
      throw new Error(protocol.ok === false
        ? protocol.error.message
        : "unexpected protocol payload");
    }
    const result = protocol.payload.result;
    expect(protocol.payload.sourceSessionUnchanged).toBe(true);
    expect(result.claim).toMatchObject({
      intervention: "fixed-TBV-transient-graded-VC_RA-resistance-ramp",
      pressureSemantics: "LV-transmural-pressure",
      endDiastoleEvent:
        "maximum-volume-low-forward-flow-surrogate-before-aortic-opening",
      edpvrReference:
        "Klotz-2006-informed-V0-prior-plus-multibeat-exponential-envelope-fit",
      sourceSessionMutated: false,
      alternansSuspectBeatsAveragedIntoFits: false,
      fitOwnedByAnalysisLayer: true,
    });
    expect(result.source).toEqual({
      revision: sourceFrame.revision,
      acceptedTimeSec: sourceFrame.acceptedTimeSec,
      fixedTotalBloodVolumeMl: 5_522.11,
    });
    expect(result.rampBeats).toHaveLength(8);
    expect(result.rampBeats.map(({ beatIndex }) => beatIndex))
      .toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(result.edpvrReference).toMatchObject({
      method: "Klotz-2006-single-beat-V0-prior",
      referencePressureMmHg: 0,
    });
    expect(result.edpvrReference.referenceVolumeMl).toBeGreaterThan(0);
    expect(result.edpvrReference.referenceVolumeMl)
      .toBeLessThan(result.edpvrReference.baselineEndDiastolicVolumeMl);
    expect(result.fitPointSelection.includedBeatIds).toContain("ivc-beat-0");
    expect(result.fitPointSelection.excludedRedundantBeatIds.length)
      .toBeGreaterThan(0);
    expect(result.rampBeats.every((beat) =>
      beat.fixedTotalBloodVolumeMl === result.source.fixedTotalBloodVolumeMl
      && beat.samples.length === 100
      && Number.isFinite(beat.totalBloodVolumeAbsoluteErrorMl)
      && Number.isFinite(beat.maximumContinuityAbsoluteResidualMl)))
      .toBe(true);
    expect(Math.max(...result.rampBeats.map((beat) =>
      Math.abs(beat.totalBloodVolumeAbsoluteErrorMl))))
      .toBeLessThan(1e-6);
    expect(result.analysis.physiologyBoundary).toMatchObject({
      pressures: "transmural",
      tbvFamilyMaySubstituteForThisProtocol: false,
      period2AveragingPermitted: false,
    });
    expect(result.analysis.includedFitEligiblePointIds)
      .not.toContain("ivc-period2-branches");
    const alternansSuspectDetected = result.rampBeats.some((beat) =>
      beat.classification === "alternans-suspect-high"
      || beat.classification === "alternans-suspect-low");
    if (alternansSuspectDetected) {
      expect(result.analysis.exclusions.map(({ code }) => code)).toContain(
        "alternans-suspect-excluded",
      );
    }

    const after = await kernel.handle(baseCommand(
      "observe",
      "request-hemodynamic-after",
      sessionId,
    ));
    if (after.ok === false || after.payload.kind !== "observation") {
      throw new Error("expected source observation after protocol");
    }
    expect(after.payload.observableFrame).toEqual(sourceFrame);
    expect(protocol.payload.observableFrame).toEqual(sourceFrame);
  }, 600_000);
});

function baseCommand(
  kind:
    | "createOfficialDocumentCaseSession"
    | "observe"
    | "runPvRelationsProtocol",
  requestId: string,
  sessionId: string,
) {
  return Object.freeze({
    protocolId: SCIENTIFIC_COMMAND_PROTOCOL_V1_ID,
    kind,
    requestId,
    sessionId,
  });
}
