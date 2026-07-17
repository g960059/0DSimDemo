import { describe, expect, it } from "vitest";

import {
  loadMainWireAdultFiveWallNonCoronaryReleaseV1,
} from "@/engine/scientific/assembly";
import {
  loadMainWireScientificResolvedSessionInputV1,
  loadMainWireScientificSessionIntentV1,
  mainWireScientificSessionIntentV1,
  MAIN_WIRE_SCIENTIFIC_SEVERE_VALVE_RESEARCH_BRACKET_IDS_V1,
  resolveMainWireScientificSessionInputV1,
} from "@/engine/scientific/inputs";
import {
  canonicalJsonStringify,
  sha256CanonicalJsonHex,
} from "@/engine/scientific/release";

describe("main-wire resolved session input V1", () => {
  it("resolves the healthy session from immutable release values", async () => {
    const release = await loadMainWireAdultFiveWallNonCoronaryReleaseV1();
    const intent = mainWireScientificSessionIntentV1(release.ref);
    const resolved = await resolveMainWireScientificSessionInputV1(
      release,
      intent,
    );

    expect(resolved).toMatchObject({
      schemaId: "circleheart-main-wire-resolved-session-input-v1",
      schemaVersion: 1,
      releaseRef: release.ref,
      resolver: {
        id: "main-wire-five-wall-session-input-resolver-v1",
        version: "1.0.0",
        digestSemantics:
          "sha256-canonical-json-payload-without-sessionInputSha256",
      },
      sourceIntent: {
        parameterOperations: [],
        initialization: {
          kind: "release-resolved-fixed-tbv-cold-start",
        },
      },
      resolvedParameters: {
        mechanics: {
          parameterSetId: "normal-adult-five-wall-fixed-prior-v1-canonical",
          laSlsMode: "on",
        },
        commonPericardium: {
          mode: "on",
          caseId: "healthy-slack",
        },
        circulationRuntime: {
          valvePreset: { bracketIds: [] },
        },
      },
      initialization: {
        initialTimeSec: 0,
        initialRevision: 0,
        fixedTotalBloodVolumeMl: 5_522.11,
        resolvedNodeVolumesMl: {
          SA: 397.3007092041134,
        },
      },
      claims: {
        exactReleaseBound: true,
        completeResolvedRuntimeParameterization: true,
        releaseResolvedInitializationConsumedDirectly: true,
        implicitLastWriteWinsApplied: false,
        clinicalDiagnosisClaimed: false,
      },
      sessionInputSha256: expect.stringMatching(/^[0-9a-f]{64}$/),
    });
    expect(Object.isFrozen(resolved)).toBe(true);
    expect(Object.isFrozen(resolved.resolvedParameters.circulationRuntime))
      .toBe(true);
    await expect(loadMainWireScientificResolvedSessionInputV1(
      release,
      JSON.parse(JSON.stringify(resolved)),
    )).resolves.toEqual(resolved);
  });

  it("selects eight severe valve research presets without changing other inputs", async () => {
    const release = await loadMainWireAdultFiveWallNonCoronaryReleaseV1();
    const healthy = await resolveMainWireScientificSessionInputV1(
      release,
      mainWireScientificSessionIntentV1(release.ref),
    );
    const disease = await Promise.all(
      MAIN_WIRE_SCIENTIFIC_SEVERE_VALVE_RESEARCH_BRACKET_IDS_V1.map(
        async (bracketId) => resolveMainWireScientificSessionInputV1(
          release,
          mainWireScientificSessionIntentV1(release.ref, bracketId),
        ),
      ),
    );

    expect(new Set(disease.map((input) => input.sessionInputSha256)).size)
      .toBe(8);
    for (const [index, resolved] of disease.entries()) {
      const bracketId =
        MAIN_WIRE_SCIENTIFIC_SEVERE_VALVE_RESEARCH_BRACKET_IDS_V1[index];
      expect(resolved.sourceIntent.parameterOperations).toEqual([{
        kind: "select-valve-research-bracket",
        target: "circulation.valvePreset",
        compositionPolicy: "exclusive-component-selection",
        bracketId,
      }]);
      expect(resolved.resolvedParameters.circulationRuntime.valvePreset.bracketIds)
        .toEqual([bracketId]);
      expect(resolved.initialization).toEqual(healthy.initialization);
      expect(resolved.resolvedParameters.commonPericardium)
        .toEqual(healthy.resolvedParameters.commonPericardium);
      expect(resolved.resolvedParameters.calciumDrive)
        .toEqual(healthy.resolvedParameters.calciumDrive);
    }
  });

  it("rejects implicit replacement order, unknown fields, and rehashed tampering", async () => {
    const release = await loadMainWireAdultFiveWallNonCoronaryReleaseV1();
    const operation = {
      kind: "select-valve-research-bracket",
      target: "circulation.valvePreset",
      compositionPolicy: "exclusive-component-selection",
      bracketId: "AS-severe",
    } as const;
    const intent = JSON.parse(JSON.stringify(
      mainWireScientificSessionIntentV1(release.ref, "AS-severe"),
    ));
    intent.parameterOperations = [
      operation,
      { ...operation, bracketId: "AR-severe" },
    ];
    expect(() => loadMainWireScientificSessionIntentV1(intent))
      .toThrow(/zero or one exclusive component selection/);

    const moderateIntent = JSON.parse(JSON.stringify(
      mainWireScientificSessionIntentV1(release.ref),
    ));
    moderateIntent.parameterOperations = [{
      ...operation,
      bracketId: "AS-moderate",
    }];
    expect(() => loadMainWireScientificSessionIntentV1(moderateIntent))
      .toThrow(/bracketId is unsupported/);

    const withUnknownField = JSON.parse(JSON.stringify(
      mainWireScientificSessionIntentV1(release.ref),
    ));
    withUnknownField.silentFallback = true;
    expect(() => loadMainWireScientificSessionIntentV1(withUnknownField))
      .toThrow(/must contain exactly keys/);

    const resolved = await resolveMainWireScientificSessionInputV1(
      release,
      mainWireScientificSessionIntentV1(release.ref),
    );
    const tampered = JSON.parse(JSON.stringify(resolved));
    tampered.resolvedParameters.circulationRuntime.losses.systemicResistance = 2;
    const { sessionInputSha256: ignored, ...tamperedPayload } = tampered;
    expect(ignored).toBe(resolved.sessionInputSha256);
    tampered.sessionInputSha256 = await sha256CanonicalJsonHex(tamperedPayload);
    await expect(loadMainWireScientificResolvedSessionInputV1(
      release,
      tampered,
    )).rejects.toThrow(/does not match release-bound re-resolution/);

    expect(canonicalJsonStringify(resolved.sourceIntent.releaseRef))
      .toBe(canonicalJsonStringify(release.ref));
  });
});
