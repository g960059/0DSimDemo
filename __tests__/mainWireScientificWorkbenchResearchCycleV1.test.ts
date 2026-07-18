import { describe, expect, it } from "vitest";

import {
  loadScientificWorkbenchResearchCycleV1,
} from "@/components/scientificWorkbench/scientificWorkbenchResearchCycleV1";
import {
  MainWireScientificInProcessKernelV1,
  type ScientificCommandV1,
} from "@/engine/scientific/worker";
import type {
  MainWireScientificWorkerClientV1,
} from "@/engine/scientificBrowser";

describe("main-wire scientific workbench research cycle V1", () => {
  it("shows a document-bound research Case only after P1 and a following complete cycle", async () => {
    const kernel = new MainWireScientificInProcessKernelV1();
    const requestKinds: string[] = [];
    const progressBeats: number[] = [];
    const client = Object.freeze({
      request(command: ScientificCommandV1) {
        requestKinds.push(command.kind);
        return kernel.handle(command);
      },
    }) as Pick<MainWireScientificWorkerClientV1, "request">;

    const result = await loadScientificWorkbenchResearchCycleV1(client, {
      sessionId: "scientific-workbench-research-integration-v1",
      presetId: "main-wire/mr-severe",
      onProgress: ({ completedBeatCount }) => {
        progressBeats.push(completedBeatCount);
      },
    });

    expect(requestKinds[0]).toBe("createResearchDocumentCaseSession");
    expect(requestKinds.filter((kind) => kind === "settlePeriodic").length)
      .toBe(result.completedBeatCount);
    expect(requestKinds.filter((kind) => kind === "runTransient")).toHaveLength(125);
    expect(requestKinds).toHaveLength(1 + result.completedBeatCount + 125);
    expect(requestKinds.length).toBeLessThanOrEqual(158);
    expect(progressBeats).toEqual(
      Array.from({ length: result.completedBeatCount }, (_, index) => index + 1),
    );
    expect(result.presetId).toBe("main-wire/mr-severe");
    expect(result.sessionOrigin).toMatchObject({
      kind: "research-document-case-cold-start",
      classification: "research-bracket-not-clinical",
      officialTrustClaimed: false,
      clinicalDiagnosisClaimed: false,
      periodicSteadyStateClaimed: false,
    });
    expect(result.workspaceDocument.ref).toEqual(result.sessionOrigin.workspaceRef);
    expect(result.workspaceDocument.content.caseDocumentRef)
      .toEqual(result.sessionOrigin.caseRef);
    expect(result.terminalCycle.frames).toHaveLength(501);
    expect(result.terminalCycle.frames[0]?.source).toBe("accepted-step");
    expect(result.terminalCycle.durationSec).toBeCloseTo(1, 11);
    expect(result.evidence).toMatchObject({
      terminalPeriod1Confirmed: true,
      followingCompleteCycleCaptured: true,
      officialTrustClaimed: false,
      clinicalDiagnosisClaimed: false,
      clinicalValidationClaimed: false,
    });
  }, 120_000);

  it.each([
    {
      status: "period2-suspect" as const,
      period2OrbitSuspected: true,
      forgeAtBeat: 4,
      message: /P2 orbit suspected/,
    },
    {
      status: "maximum-beats-reached" as const,
      period2OrbitSuspected: false,
      forgeAtBeat: 1,
      message: /32-beat limit reached/,
    },
  ])("does not capture or plot a $status research orbit", async ({
    status,
    period2OrbitSuspected,
    forgeAtBeat,
    message,
  }) => {
    const kernel = new MainWireScientificInProcessKernelV1();
    let transientRequestCount = 0;
    const client = Object.freeze({
      async request(command: ScientificCommandV1) {
        if (command.kind === "runTransient") transientRequestCount += 1;
        const response = await kernel.handle(command);
        if (
          command.kind !== "settlePeriodic"
          || !response.ok
          || response.payload.kind !== "periodic-settlement-progress"
          || response.payload.completedBeatCount !== forgeAtBeat
        ) return response;
        const forged = structuredClone(response) as Record<string, any>;
        forged.payload.status = status;
        forged.payload.periodicSteadyStateClaimed = false;
        forged.payload.period2OrbitSuspected = period2OrbitSuspected;
        if (status === "period2-suspect") {
          forged.payload.periodicity.status = "period2-suspect";
          forged.payload.periodicity.evidenceBeatIndices =
            forged.payload.retainedBeatClosure.map(
              (entry: { beatIndex: number }) => entry.beatIndex,
            );
        }
        return forged;
      },
    }) as Pick<MainWireScientificWorkerClientV1, "request">;

    await expect(loadScientificWorkbenchResearchCycleV1(client, {
      sessionId: `scientific-workbench-${status}`,
      presetId: "main-wire/healthy-cold",
    })).rejects.toThrow(message);
    expect(transientRequestCount).toBe(0);
  }, 30_000);

  it("rejects an outer-only P1 status spoof before cycle capture", async () => {
    const kernel = new MainWireScientificInProcessKernelV1();
    let transientRequestCount = 0;
    const client = Object.freeze({
      async request(command: ScientificCommandV1) {
        if (command.kind === "runTransient") transientRequestCount += 1;
        const response = await kernel.handle(command);
        if (
          command.kind !== "settlePeriodic"
          || !response.ok
          || response.payload.kind !== "periodic-settlement-progress"
        ) return response;
        const forged = structuredClone(response) as Record<string, any>;
        forged.payload.status = "period1-converged";
        forged.payload.periodicSteadyStateClaimed = true;
        forged.payload.period2OrbitSuspected = false;
        return forged;
      },
    }) as Pick<MainWireScientificWorkerClientV1, "request">;

    await expect(loadScientificWorkbenchResearchCycleV1(client, {
      sessionId: "scientific-workbench-outer-only-p1-spoof",
      presetId: "main-wire/healthy-cold",
    })).rejects.toThrow(/invalid settlement evidence/);
    expect(transientRequestCount).toBe(0);
  }, 30_000);
});
