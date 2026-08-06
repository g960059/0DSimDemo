import { describe, expect, it } from "vitest";

import {
  resolveModelLimitationsOpenState,
} from "@/components/ModelLimitations";

describe("Model limitations disclosure state", () => {
  it("opens a fresh acknowledgement scope even when controlled open is false", () => {
    expect(resolveModelLimitationsOpenState({
      acknowledged: false,
      dismissed: false,
      manuallyOpened: false,
      controlledOpen: false,
    })).toBe(true);
  });

  it("keeps an acknowledged controlled scope closed", () => {
    expect(resolveModelLimitationsOpenState({
      acknowledged: true,
      dismissed: false,
      manuallyOpened: false,
      controlledOpen: false,
    })).toBe(false);
  });

  it("allows a non-acknowledging close for the current mount", () => {
    expect(resolveModelLimitationsOpenState({
      acknowledged: false,
      dismissed: true,
      manuallyOpened: false,
      controlledOpen: false,
    })).toBe(false);
    expect(resolveModelLimitationsOpenState({
      acknowledged: true,
      dismissed: true,
      manuallyOpened: false,
      controlledOpen: true,
    })).toBe(true);
  });
});
