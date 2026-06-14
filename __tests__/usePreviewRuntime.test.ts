import { describe, expect, it } from "vitest";
import { caseDocumentToSimInstances, simInstancesToCaseDocument, type CaseDocument } from "@/caseDoc";
import { applyKnobs, KNOB_MAPPING_VERSION, neutralKnobs } from "@/engine/knobs";
import { defaultParams } from "@/engine/ModelCore";
import {
  createPreviewRuntimeInitialState,
  resetPreviewInstanceKnobs,
  togglePreviewScenarioGlobalVisibility,
  updatePreviewInstanceKnobs,
  updatePreviewInstanceVolume,
} from "@/features/workbench/publish/usePreviewRuntime";
import type { SimInstance } from "@/types";

const baseParams = defaultParams();
const knobs = neutralKnobs(baseParams);
const instance: SimInstance = {
  id: "s1",
  name: "Scenario 1",
  color: "#38bdf8",
  isVisible: true,
  knobBaseline: baseParams,
  knobs,
  params: applyKnobs(baseParams, knobs, KNOB_MAPPING_VERSION),
  targetVolume: 5600,
};

function doc(overrides: Partial<CaseDocument> = {}): CaseDocument {
  return {
    ...simInstancesToCaseDocument([instance], [], {
      id: "preview-runtime",
      title: "Preview runtime",
      createdAt: 1,
      updatedAt: 2,
      spec: { title: "Preview runtime", modelLimitations: ["0D model."] },
      initialActiveScenarioId: "s1",
    }),
    ...overrides,
  };
}

describe("usePreviewRuntime pure helpers", () => {
  it("mutates only preview instances and leaves source doc plus author instances unchanged", () => {
    const sourceDoc = doc();
    const sourceBefore = JSON.stringify(sourceDoc);
    const authorInstances = caseDocumentToSimInstances(sourceDoc);
    const authorBefore = JSON.stringify(authorInstances);
    const steadyRequests: string[] = [];
    const preview = createPreviewRuntimeInitialState(sourceDoc);

    const nextKnobs = { ...preview.instances[0].knobs!, HR: preview.instances[0].knobs!.HR + 8 };
    let next = updatePreviewInstanceKnobs(preview.instances, "s1", nextKnobs, (id) => steadyRequests.push(id));
    next = updatePreviewInstanceVolume(next, "s1", 6100, (id) => steadyRequests.push(id));
    next = togglePreviewScenarioGlobalVisibility(next, "s1");

    expect(next[0].targetVolume).toBe(6100);
    expect(next[0].isVisible).toBe(false);
    expect(next[0].knobs?.HR).toBe(nextKnobs.HR);
    expect(steadyRequests).toEqual(["s1", "s1"]);
    expect(JSON.stringify(sourceDoc)).toBe(sourceBefore);
    expect(JSON.stringify(authorInstances)).toBe(authorBefore);
  });

  it("reset re-derives the document initial state", () => {
    const sourceDoc = doc();
    const preview = createPreviewRuntimeInitialState(sourceDoc);
    const changed = updatePreviewInstanceVolume(preview.instances, "s1", 6200, () => {});
    const reset = createPreviewRuntimeInitialState(sourceDoc);

    expect(changed[0].targetVolume).toBe(6200);
    expect(reset).toEqual(preview);
  });

  it("resetInstanceKnobs uses the injected steady transition", () => {
    const sourceDoc = doc();
    const preview = createPreviewRuntimeInitialState(sourceDoc);
    const changedKnobs = { ...preview.instances[0].knobs!, HR: preview.instances[0].knobs!.HR + 5 };
    const changed = updatePreviewInstanceKnobs(preview.instances, "s1", changedKnobs, () => {});
    const steadyRequests: string[] = [];
    const reset = resetPreviewInstanceKnobs(changed, "s1", (id) => steadyRequests.push(id));

    expect(reset[0].knobs).toEqual(preview.instances[0].knobs);
    expect(steadyRequests).toEqual(["s1"]);
  });
});
