import { describe, expect, it } from "vitest";

import {
  loadScientificWorkbenchOfficialCycleV1,
} from "@/components/scientificWorkbench/scientificWorkbenchOfficialCycleV1";
import {
  MainWireScientificInProcessKernelV1,
  type ScientificCommandV1,
} from "@/engine/scientific/worker";
import type {
  MainWireScientificWorkerClientV1,
} from "@/engine/scientificBrowser";
import {
  loadBundledOfficialHealthyPeriodicDocumentChainV1,
} from "@/engine/scientificBrowser/bundledOfficialHealthyPeriodicDocumentChainV1";

describe("scientific workbench official cycle V1", () => {
  it("restores the verified V3 case and captures one complete P1 cycle", async () => {
    const kernel = new MainWireScientificInProcessKernelV1({
      officialDocumentCaseLoader:
        loadBundledOfficialHealthyPeriodicDocumentChainV1,
    });
    const requestKinds: string[] = [];
    const client = Object.freeze({
      request(command: ScientificCommandV1) {
        requestKinds.push(command.kind);
        return kernel.handle(command);
      },
    }) as Pick<MainWireScientificWorkerClientV1, "request">;

    const result = await loadScientificWorkbenchOfficialCycleV1(client, {
      sessionId: "scientific-workbench-integration-v1",
    });

    expect(requestKinds[0]).toBe("createOfficialDocumentCaseSession");
    expect(requestKinds[1]).toBe("settlePeriodic");
    expect(requestKinds.slice(2).every((kind) => kind === "runTransient"))
      .toBe(true);
    expect(requestKinds).toHaveLength(127);
    expect(result.sessionOrigin).toMatchObject({
      kind: "official-document-case-v3-exact-checkpoint-restore",
      periodicSteadyStateClaimed: true,
      clinicalValidationClaimed: false,
    });
    expect(result.terminalCycle.frames).toHaveLength(501);
    expect(result.terminalCycle.durationSec).toBeCloseTo(1, 11);
    expect(result.workspaceDocument.content.panels.map(({ panelId }) => panelId))
      .toEqual([
        "la-pv",
        "ra-pv",
        "lv-pv",
        "rv-pv",
        "four-valve-flow",
        "atrial-pressure",
        "ventricular-pressure",
        "vascular-pressure",
      ]);
    expect(result.evidence).toEqual({
      bundledDocumentChainVerified: true,
      workerRestoredExactV3Case: true,
      workerAndPageDocumentRefsMatch: true,
      terminalPeriod1ConfirmedWithoutAdvancingState: true,
      followingCompleteCycleCaptured: true,
      clinicalValidationClaimed: false,
    });
  }, 30_000);
});
