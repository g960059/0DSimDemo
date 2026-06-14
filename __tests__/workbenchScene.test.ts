import { describe, expect, it } from "vitest";
import { resolveWorkbenchHeaderMode } from "@/features/workbench/hooks/useWorkbenchScene";

describe("resolveWorkbenchHeaderMode", () => {
  it("keeps an owned cloud case in sandbox", () => {
    expect(resolveWorkbenchHeaderMode({
      userUid: "owner",
      currentCaseOwnerId: "owner",
      caseAuthor: "Author",
      currentCaseSource: { kind: "authored" },
    })).toBe("sandbox");
  });

  it("forces a non-owner cloud case into learner mode", () => {
    expect(resolveWorkbenchHeaderMode({
      userUid: "viewer",
      currentCaseOwnerId: "owner",
      caseAuthor: "Author",
      currentCaseSource: { kind: "authored" },
    })).toBe("learner");
  });

  it("does not let a missing author make a non-owner cloud case editable", () => {
    expect(resolveWorkbenchHeaderMode({
      userUid: "viewer",
      currentCaseOwnerId: "owner",
      caseAuthor: undefined,
      currentCaseSource: { kind: "authored" },
    })).toBe("learner");
  });

  it("keeps official cases in learner mode", () => {
    expect(resolveWorkbenchHeaderMode({
      userUid: "owner",
      currentCaseOwnerId: "owner",
      caseAuthor: undefined,
      currentCaseSource: { kind: "official", id: "normal" },
    })).toBe("learner");
  });
});
