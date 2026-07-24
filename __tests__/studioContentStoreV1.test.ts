import { describe, expect, it } from "vitest";

import {
  InMemoryContentAddressedArtifactStoreV1,
  StudioArtifactNotFoundErrorV1,
} from "@/studio/infrastructure/artifacts/InMemoryContentAddressedArtifactStoreV1";

describe("Studio in-memory content-addressed store V1", () => {
  it("canonicalizes, detaches, freezes, and deduplicates JSON content", async () => {
    const store = new InMemoryContentAddressedArtifactStoreV1();
    const mutable = {
      z: [3, 2, 1],
      a: { enabled: true, label: "baseline" },
    };
    const first = await store.putJson({
      kind: "studio-json",
      mediaType: "application/json",
      content: mutable,
    });
    mutable.z[0] = 99;
    mutable.a.label = "mutated";
    const second = await store.putJson({
      kind: "studio-json",
      mediaType: "application/json",
      content: {
        a: { label: "baseline", enabled: true },
        z: [3, 2, 1],
      },
    });

    expect(second).toEqual(first);
    expect(store.entryCount).toBe(1);
    const loaded = await store.readJson(first);
    expect(loaded).toEqual({
      a: { enabled: true, label: "baseline" },
      z: [3, 2, 1],
    });
    expect(Object.isFrozen(loaded)).toBe(true);
    expect(Object.isFrozen((loaded as { a: object }).a)).toBe(true);
    expect(await store.has(first)).toBe(true);
  });

  it("binds kind/media type into identity and fails closed on invalid data or refs", async () => {
    const store = new InMemoryContentAddressedArtifactStoreV1();
    const json = await store.putJson({
      kind: "studio-json",
      mediaType: "application/json",
      content: { value: 1 },
    });
    const input = await store.putJson({
      kind: "simulation-input",
      mediaType: "application/json",
      content: { value: 1 },
    });

    expect(input.sha256).not.toBe(json.sha256);
    expect(store.entryCount).toBe(2);
    await expect(store.putJson({
      kind: "studio-json",
      mediaType: "application/json",
      content: { invalid: Number.NaN },
    })).rejects.toThrow(/number must be finite/);
    await expect(store.readJson({
      ...json,
      sha256: "f".repeat(64),
    })).rejects.toBeInstanceOf(StudioArtifactNotFoundErrorV1);
  });
});
