import { describe, expect, it } from "vitest";

import {
  mergeDevModelCandidatesV3,
  type DevModelCandidateV3,
} from "@/components/dev/DevDashboardPage";
import {
  studioDevSurfacesEnabledV1,
} from "@/studio/application/dev/StudioDevAccessV1";

describe("development dashboard V3", () => {
  it("deduplicates one exact model across launch and content references", () => {
    const candidates: readonly DevModelCandidateV3[] = [
      candidate("model/standard", "Main Wire V3", "stable", "active"),
      candidate("model/standard", "Main Wire V3", "stable", "model-lab"),
      candidate("model/standard", "Main Wire V3", "stable", "referenced"),
      candidate("model/local", "Local V3", "dev", "model-lab"),
    ];

    expect(mergeDevModelCandidatesV3(candidates)).toEqual([
      {
        modelId: "model/local",
        displayName: "Local V3",
        resolutions: [{
          source: "model-lab",
          stage: "dev",
          surfaceReleaseId: "surface/local",
          available: true,
        }],
        available: true,
      },
      {
        modelId: "model/standard",
        displayName: "Main Wire V3",
        resolutions: [
          {
            source: "model-lab",
            stage: "stable",
            surfaceReleaseId: "surface/local",
            available: true,
          },
          {
            source: "active",
            stage: "stable",
            surfaceReleaseId: "surface/default",
            available: true,
          },
          {
            source: "referenced",
            stage: "stable",
            surfaceReleaseId: "surface/default",
            available: true,
          },
        ],
        available: true,
      },
    ]);
  });

  it("keeps an unavailable historical reference visible", () => {
    expect(mergeDevModelCandidatesV3([{
      modelId: "model/retired-reference",
      displayName: "model/retired-reference",
      stage: null,
      surfaceReleaseId: null,
      source: "referenced",
      available: false,
    }])).toEqual([{
      modelId: "model/retired-reference",
      displayName: "model/retired-reference",
      resolutions: [{
        source: "referenced",
        stage: null,
        surfaceReleaseId: null,
        available: false,
      }],
      available: false,
    }]);
  });

  it("preserves source-specific Surface resolutions for one exact model", () => {
    expect(mergeDevModelCandidatesV3([
      candidate("model/shared", "Shared", "stable", "active"),
      candidate("model/shared", "Shared", "dev", "model-lab"),
    ])).toEqual([{
      modelId: "model/shared",
      displayName: "Shared",
      resolutions: [
        {
          source: "model-lab",
          stage: "dev",
          surfaceReleaseId: "surface/local",
          available: true,
        },
        {
          source: "active",
          stage: "stable",
          surfaceReleaseId: "surface/default",
          available: true,
        },
      ],
      available: true,
    }]);
  });

  it("keeps all dev surfaces behind the shared deployment gate", () => {
    expect(studioDevSurfacesEnabledV1({ PROD: false })).toBe(true);
    expect(studioDevSurfacesEnabledV1({ PROD: true })).toBe(false);
    expect(studioDevSurfacesEnabledV1({
      PROD: true,
      VITE_MODEL_LAB_ENABLED: "1",
    })).toBe(true);
  });
});

function candidate(
  modelId: string,
  displayName: string,
  stage: "dev" | "stable" | "retired",
  source: DevModelCandidateV3["source"],
): DevModelCandidateV3 {
  return {
    modelId,
    displayName,
    stage,
    surfaceReleaseId: source === "model-lab"
      ? "surface/local"
      : "surface/default",
    source,
    available: true,
  };
}
