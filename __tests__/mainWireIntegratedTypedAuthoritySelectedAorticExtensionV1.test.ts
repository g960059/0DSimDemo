import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_COUNT_V3,
  MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_LAYOUT_V2,
} from "@/engine/myocardium/MainWireFiveWallCoronaryTransactionV2";
import {
  MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_IDS_V3,
} from "@/engine/myocardium/MainWireIntegratedModelOutputRegistryV3";
import {
  createMainWireIntegratedModelRuntimeV3,
  type MainWireIntegratedModelRuntimeV3,
} from "@/engine/myocardium/MainWireIntegratedModelRuntimeV3";
import {
  createMainWireIntegratedModelSelectedAorticOutflowFixtureV1,
  type MainWireIntegratedModelSelectedAorticOutflowFixtureV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import {
  MainWireIntegratedTypedAuthoritySessionV1,
} from "@/engine/vnext/MainWireIntegratedTypedAuthoritySessionV1";
import {
  MAIN_WIRE_SELECTED_AORTIC_PORT_SESSION_EXTENSION_CLAIM_V1,
  MainWireSelectedAorticPortSessionExtensionV1,
} from "@/engine/vnext/MainWireSelectedAorticPortSessionExtensionV1";

const ONE_BASE_OUTPUT = Object.freeze([
  MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_IDS_V3[0]!,
]);

type SelectedAcceptedState =
  MainWireIntegratedModelSelectedAorticOutflowFixtureV1["cold"]["acceptedState"];

class SelectedAorticSessionHarnessV1 extends
  MainWireIntegratedTypedAuthoritySessionV1 {
  readonly extension: MainWireSelectedAorticPortSessionExtensionV1;

  constructor(
    runtime: MainWireIntegratedModelSelectedAorticOutflowFixtureV1,
    extension = MainWireSelectedAorticPortSessionExtensionV1.createColdV1(),
  ) {
    super(
      runtime,
      runtime.cold.acceptedState,
      "cold",
      null,
      undefined,
      undefined,
      extension,
    );
    this.extension = extension;
  }
}

class ConstructionHarnessV1 extends MainWireIntegratedTypedAuthoritySessionV1 {
  constructor(
    runtime:
      | MainWireIntegratedModelRuntimeV3
      | MainWireIntegratedModelSelectedAorticOutflowFixtureV1,
    extension: MainWireSelectedAorticPortSessionExtensionV1 | null,
    acceptedState: SelectedAcceptedState = runtime.cold.acceptedState,
  ) {
    super(
      runtime,
      acceptedState,
      "cold",
      null,
      undefined,
      undefined,
      extension,
    );
  }
}

describe("typed-authority selected aortic Session extension integration V1", () => {
  it("leaves Standard65 on its legacy owner and checkpoint path", async () => {
    expect(MAIN_WIRE_SELECTED_AORTIC_PORT_SESSION_EXTENSION_CLAIM_V1)
      .toMatchObject({
        modelOwnerScope: "standard-66-only",
        legacyStandard65InstantiatesExtension: false,
        exactBeatAnalysisStateCheckpointed: false,
      });
    const session = await MainWireIntegratedTypedAuthoritySessionV1.create();
    const advanced =
      session.advanceToPresentationTimeWithSelectedOutputProjectionV1(
        0.002,
        ONE_BASE_OUTPUT,
      );
    expect(advanced.advance).toMatchObject({
      status: "advanced",
      acceptedTimeSec: 0.002,
      acceptedRevision: 1,
    });
    await expect(session.checkpointStandardExact()).resolves.toMatchObject({
      schemaVersion: 2,
    });
  });

  it("fails closed unless the fixed selected runtime and extension agree", async () => {
    const standard = await createMainWireIntegratedModelRuntimeV3();
    expect(() => new ConstructionHarnessV1(
      standard,
      MainWireSelectedAorticPortSessionExtensionV1.createColdV1(),
    )).toThrow(/requires typed authority and the fixed selected runtime/);

    const selected = createMainWireIntegratedModelSelectedAorticOutflowFixtureV1();
    expect(() => new ConstructionHarnessV1(selected, null))
      .toThrow(/requires its Session extension owner/);

    const alreadyPublished =
      MainWireSelectedAorticPortSessionExtensionV1.createColdV1();
    const first = new SelectedAorticSessionHarnessV1(selected, alreadyPublished);
    expect(first.advanceToPresentationTimeWithSelectedOutputProjectionV1(
      0.002,
      ONE_BASE_OUTPUT,
    ).advance.status).toBe("advanced");
    expect(() => new ConstructionHarnessV1(selected, alreadyPublished))
      .toThrow(/must start without instantaneous accepted readback/);
  });

  it("publishes a selected readback only for the committed accepted epoch", () => {
    const session = new SelectedAorticSessionHarnessV1(
      createMainWireIntegratedModelSelectedAorticOutflowFixtureV1(),
    );
    const projected =
      session.advanceToPresentationTimeWithSelectedOutputProjectionV1(
        0.002,
        ONE_BASE_OUTPUT,
      );
    expect(projected.advance).toMatchObject({
      status: "advanced",
      acceptedTimeSec: 0.002,
      acceptedRevision: 1,
    });
    const clock = session.extension.acceptedReadbackClockV1();
    expect(clock).toEqual({ acceptedTimeSec: 0.002, revision: 1 });
    expect(session.extension.withAcceptedReadbackV3(clock!, (readback) => ({
      length: readback.length,
      proximal: readback[
        MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_LAYOUT_V2
          .algebraicProximalConstitutivePortPressureMmHg
      ],
      local: readback[
        MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_LAYOUT_V2
          .localValvePressureGradientMmHg
      ],
    }))).toMatchObject({
      length: MAIN_WIRE_FIVE_WALL_ACCEPTED_NUMERICAL_READBACK_COUNT_V3,
      proximal: expect.any(Number),
      local: expect.any(Number),
    });
  });

  it("aborts a selected precommit staging failure without commit or poison", () => {
    const real = MainWireSelectedAorticPortSessionExtensionV1.createColdV1();
    const injected = extensionDoubleV1(real, {
      stageCandidateV1: () => {
        throw new Error("injected precommit selected staging failure");
      },
    });
    const session = new SelectedAorticSessionHarnessV1(
      createMainWireIntegratedModelSelectedAorticOutflowFixtureV1(),
      injected,
    );
    const returned =
      session.advanceToPresentationTimeWithSelectedOutputProjectionV1(
        0.002,
        ONE_BASE_OUTPUT,
      );
    expect(returned).toMatchObject({
      advance: {
        status: "failed",
        acceptedTimeSec: 0,
        acceptedRevision: 0,
        partiallyAdvanced: false,
        message: "injected precommit selected staging failure",
      },
      projectedValues: null,
    });
    expect(real.acceptedReadbackClockV1()).toBeNull();
    expect(session.authorityReport()).toMatchObject({
      commitCount: 0,
      staged: false,
    });
    expect(session.observe()).toMatchObject({ source: "cold" });
  });

  it("terminally poisons after a postcommit selected readback promotion failure", async () => {
    const real = MainWireSelectedAorticPortSessionExtensionV1.createColdV1();
    const injected = extensionDoubleV1(real, {
      stageCandidateV1: (input) => {
        const ticket = real.stageCandidateV1(input);
        return Object.freeze({
          ...ticket,
          promote: () => {
            throw new Error("injected postcommit promotion failure");
          },
        });
      },
    });
    const session = new SelectedAorticSessionHarnessV1(
      createMainWireIntegratedModelSelectedAorticOutflowFixtureV1(),
      injected,
    );
    expect(() => session.advanceToPresentationTimeWithSelectedOutputProjectionV1(
      0.002,
      ONE_BASE_OUTPUT,
    )).toThrow(/injected postcommit promotion failure/);
    expect(real.acceptedReadbackClockV1()).toBeNull();

    const poisoned = /terminally poisoned/;
    expect(() => session.advanceToPresentationTime(0.004)).toThrow(poisoned);
    expect(() => session.observe()).toThrow(poisoned);
    expect(() => session.currentAcceptedState()).toThrow(poisoned);
    await expect(session.checkpointStandardExact()).rejects.toThrow(poisoned);
    expect(session.authorityReport().commitCount).toBe(1);
  });
});

function extensionDoubleV1(
  real: MainWireSelectedAorticPortSessionExtensionV1,
  overrides: Partial<
    Pick<MainWireSelectedAorticPortSessionExtensionV1, "stageCandidateV1">
  >,
): MainWireSelectedAorticPortSessionExtensionV1 {
  return {
    extensionId: real.extensionId,
    acceptedReadbackClockV1: real.acceptedReadbackClockV1.bind(real),
    assertReadyForExactCheckpointV1:
      real.assertReadyForExactCheckpointV1.bind(real),
    withAcceptedReadbackV3: real.withAcceptedReadbackV3.bind(real),
    stageCandidateV1:
      overrides.stageCandidateV1 ?? real.stageCandidateV1.bind(real),
  } as unknown as MainWireSelectedAorticPortSessionExtensionV1;
}
