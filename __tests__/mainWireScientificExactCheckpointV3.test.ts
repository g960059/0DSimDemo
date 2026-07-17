import { describe, expect, it } from "vitest";

import legacyHealthyCheckpoint from "@/data/scientific/checkpoints/0.2.0/normal-adult-periodic-steady-v1.json";
import type {
  MainWireFiveWallNonCoronaryCheckpointV1,
} from "@/engine/myocardium/MainWireFiveWallNonCoronaryTransactionV1";
import {
  loadMainWireAdultFiveWallNonCoronaryReleaseV1,
} from "@/engine/scientific/assembly";
import {
  mainWireScientificSessionIntentV1,
  resolveMainWireScientificSessionInputV1,
} from "@/engine/scientific/inputs";
import {
  createMainWireScientificSessionExactCheckpointV3,
  loadMainWireScientificSessionExactCheckpointV3,
  type MainWireScientificSessionExactCheckpointIdentityV3,
  type MainWireScientificSessionExactCheckpointSourceV3,
} from "@/engine/scientific/runtime/MainWireScientificExactCheckpointV3";
import type {
  MainWireScientificSessionPeriodicTrackerCheckpointV1,
} from "@/engine/scientific/runtime/MainWireScientificSessionV1";
import {
  MainWireScientificSessionV1,
} from "@/engine/scientific/runtime/MainWireScientificSessionV1";
import {
  sha256CanonicalJsonHex,
} from "@/engine/scientific/release";

describe("main-wire scientific exact checkpoint V3", () => {
  it("binds exact release and resolved input identities without observations", async () => {
    const fixture = await fixtureV3();
    const checkpoint = await createMainWireScientificSessionExactCheckpointV3(
      fixture.identity,
      fixture.source,
    );

    expect(checkpoint).toMatchObject({
      checkpointId: "main-wire-scientific-session-exact-checkpoint-v3",
      schemaVersion: 3,
      releaseRef: fixture.identity.releaseRef,
      sessionInputSha256: fixture.identity.sessionInputSha256,
      assembly: "fixed-normal-adult-five-wall-noncoronary",
      claim: {
        exactReleaseRequired: true,
        exactSessionInputRequired: true,
        sessionInputDigestSemantics:
          "sha256-canonical-json-payload-without-sessionInputSha256",
        semanticReresolutionAllowedHere: false,
        derivedObservationStored: false,
        outerIntegrity: "canonical-json-sha256",
      },
    });
    expect(checkpoint).not.toHaveProperty("observation");
    expect(Object.isFrozen(checkpoint)).toBe(true);
    expect(await loadMainWireScientificSessionExactCheckpointV3(
      fixture.identity,
      JSON.parse(JSON.stringify(checkpoint)),
    )).toEqual(checkpoint);
  });

  it("rejects V2, unknown fields, stale outer integrity, and altered claims", async () => {
    const fixture = await fixtureV3();
    const checkpoint = await createMainWireScientificSessionExactCheckpointV3(
      fixture.identity,
      fixture.source,
    );

    await expect(loadMainWireScientificSessionExactCheckpointV3(
      fixture.identity,
      legacyHealthyCheckpoint,
    )).rejects.toThrow(/V3 rejected: envelope mismatch/);

    const unknownTopLevel = JSON.parse(JSON.stringify(checkpoint));
    unknownTopLevel.unknown = true;
    await rehash(unknownTopLevel);
    await expect(loadMainWireScientificSessionExactCheckpointV3(
      fixture.identity,
      unknownTopLevel,
    )).rejects.toThrow(/V3 rejected: envelope mismatch/);

    const unknownClaim = JSON.parse(JSON.stringify(checkpoint));
    unknownClaim.claim.futureFallback = true;
    await rehash(unknownClaim);
    await expect(loadMainWireScientificSessionExactCheckpointV3(
      fixture.identity,
      unknownClaim,
    )).rejects.toThrow(/V3 rejected: envelope mismatch/);

    const staleOuterSha = JSON.parse(JSON.stringify(checkpoint));
    staleOuterSha.transaction.acceptedTimeSec += 0.002;
    await expect(loadMainWireScientificSessionExactCheckpointV3(
      fixture.identity,
      staleOuterSha,
    )).rejects.toThrow(/outer SHA-256 mismatch/);

    const weakenedClaim = JSON.parse(JSON.stringify(checkpoint));
    weakenedClaim.claim.exactSessionInputRequired = false;
    await rehash(weakenedClaim);
    await expect(loadMainWireScientificSessionExactCheckpointV3(
      fixture.identity,
      weakenedClaim,
    )).rejects.toThrow(/V3 rejected: envelope mismatch/);
  });

  it("rejects release/input mismatch even after an attacker rehashes the envelope", async () => {
    const fixture = await fixtureV3();
    const checkpoint = await createMainWireScientificSessionExactCheckpointV3(
      fixture.identity,
      fixture.source,
    );

    const wrongRelease = JSON.parse(JSON.stringify(checkpoint));
    wrongRelease.releaseRef.sha256 = "a".repeat(64);
    await rehash(wrongRelease);
    await expect(loadMainWireScientificSessionExactCheckpointV3(
      fixture.identity,
      wrongRelease,
    )).rejects.toThrow(/release identity mismatch/);

    const wrongInput = JSON.parse(JSON.stringify(checkpoint));
    wrongInput.sessionInputSha256 = "b".repeat(64);
    await rehash(wrongInput);
    await expect(loadMainWireScientificSessionExactCheckpointV3(
      fixture.identity,
      wrongInput,
    )).rejects.toThrow(/resolved session-input identity mismatch/);

    await expect(loadMainWireScientificSessionExactCheckpointV3(
      {
        ...fixture.identity,
        sessionInputSha256: "c".repeat(64),
      },
      checkpoint,
    )).rejects.toThrow(/resolved session-input identity mismatch/);
  });

  it("rejects unknown inner owner fields after a valid outer rehash", async () => {
    const fixture = await fixtureV3();
    const checkpoint = await createMainWireScientificSessionExactCheckpointV3(
      fixture.identity,
      fixture.source,
    );
    const unknownTransactionField = JSON.parse(JSON.stringify(checkpoint));
    unknownTransactionField.transaction.derivedPressure = 7;
    await rehash(unknownTransactionField);
    await expect(loadMainWireScientificSessionExactCheckpointV3(
      fixture.identity,
      unknownTransactionField,
    )).rejects.toThrow(/transaction envelope mismatch/);

    const wrongBoundaryCount = JSON.parse(JSON.stringify(checkpoint));
    wrongBoundaryCount.periodicSettlementTracker.boundaryTransactions.pop();
    await rehash(wrongBoundaryCount);
    await expect(loadMainWireScientificSessionExactCheckpointV3(
      fixture.identity,
      wrongBoundaryCount,
    )).rejects.toThrow(/tracker boundary count mismatch/);
  });

  it("round-trips a parameterized session only with the same resolved input", async () => {
    const release = await loadMainWireAdultFiveWallNonCoronaryReleaseV1();
    const input = await resolveMainWireScientificSessionInputV1(
      release,
      mainWireScientificSessionIntentV1(release.ref, "MR-severe"),
    );
    const session = await MainWireScientificSessionV1.initializeResolved(
      release,
      input,
    );
    expect(session.runTransient({ dtSec: 0.002, stepCount: 2 }).completed)
      .toBe(true);
    const checkpoint = await session.checkpointExactV3();
    const restored = await MainWireScientificSessionV1.restoreExactV3(
      release,
      input,
      JSON.parse(JSON.stringify(checkpoint)),
    );

    expect(restored.sessionInputSha256).toBe(input.sessionInputSha256);
    expect(restored.stateIdentity()).toEqual(session.stateIdentity());
    expect(restored.observe()).toMatchObject({
      source: "exact-checkpoint-restore",
      revision: 2,
      acceptedTimeSec: 0.004,
    });
    await expect(restored.checkpointExactV3()).resolves.toEqual(checkpoint);

    const incompatibleInput = await resolveMainWireScientificSessionInputV1(
      release,
      mainWireScientificSessionIntentV1(release.ref, "AS-severe"),
    );
    await expect(MainWireScientificSessionV1.restoreExactV3(
      release,
      incompatibleInput,
      checkpoint,
    )).rejects.toThrow(/resolved session-input identity mismatch/);
  });
});

async function fixtureV3() {
  const release = await loadMainWireAdultFiveWallNonCoronaryReleaseV1();
  const input = await resolveMainWireScientificSessionInputV1(
    release,
    mainWireScientificSessionIntentV1(release.ref),
  );
  return {
    identity: {
      releaseRef: release.ref,
      sessionInputSha256: input.sessionInputSha256,
    } satisfies MainWireScientificSessionExactCheckpointIdentityV3,
    source: {
      transaction: legacyHealthyCheckpoint.transaction as unknown as
        MainWireFiveWallNonCoronaryCheckpointV1,
      periodicSettlementTracker:
        legacyHealthyCheckpoint.periodicSettlementTracker as unknown as
          MainWireScientificSessionPeriodicTrackerCheckpointV1,
    } satisfies MainWireScientificSessionExactCheckpointSourceV3,
  } as const;
}

async function rehash(checkpoint: Record<string, unknown>): Promise<void> {
  const { checkpointSha256: _oldSha, ...payload } = checkpoint;
  checkpoint.checkpointSha256 = await sha256CanonicalJsonHex(payload);
}
