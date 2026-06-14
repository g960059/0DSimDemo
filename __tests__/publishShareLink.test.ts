import { afterEach, describe, expect, it, vi } from "vitest";
import { buildShareUrl, copyTextToClipboard } from "@/features/workbench/publish/publishShareLink";

describe("publishShareLink", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    Reflect.deleteProperty(globalThis, "navigator");
    Reflect.deleteProperty(globalThis, "document");
  });

  it("builds an absolute localized workbench URL", () => {
    expect(buildShareUrl("case-123", "en", "https://example.test")).toBe(
      "https://example.test/en/workbench/case-123?from=cases",
    );
  });

  it("uses navigator.clipboard when available", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(globalThis, "navigator", {
      value: { clipboard: { writeText } },
      configurable: true,
    });

    await expect(copyTextToClipboard("https://example.test/en/workbench/case")).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith("https://example.test/en/workbench/case");
  });

  it("falls back to execCommand and never throws when clipboard is unavailable", async () => {
    const textarea = {
      value: "",
      style: {},
      setAttribute: vi.fn(),
      select: vi.fn(),
    };
    const removeChild = vi.fn();
    const appendChild = vi.fn();
    const execCommand = vi.fn(() => true);
    Object.defineProperty(globalThis, "document", {
      value: {
        createElement: vi.fn(() => textarea),
        body: { appendChild, removeChild },
        execCommand,
      },
      configurable: true,
    });

    await expect(copyTextToClipboard("visible fallback")).resolves.toBe(true);
    expect(textarea.value).toBe("visible fallback");
    expect(appendChild).toHaveBeenCalledWith(textarea);
    expect(execCommand).toHaveBeenCalledWith("copy");
    expect(removeChild).toHaveBeenCalledWith(textarea);
  });
});
