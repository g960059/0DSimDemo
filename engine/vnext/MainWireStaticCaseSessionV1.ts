import { MainWireIntegratedTypedAuthoritySessionV1 as BaseOwner } from "./MainWireIntegratedTypedAuthoritySessionV1";
import { checkpointMainWireStaticCaseV1, restoreMainWireStaticCaseV1 } from "@/engine/myocardium/MainWireStaticCaseCheckpointV1";
import { createMainWireIntegratedModelStaticCaseFixtureV1 as createFixture,
  type MainWireIntegratedModelStaticCaseFixtureV1 as Fixture } from "@/engine/myocardium/experiments/MainWireIntegratedModelStaticCaseFixtureV1";
import { forkMainWireIntegratedModelAtFixedTbvV3 as fixedTbv,
  forkMainWireIntegratedModelResponsiveStarlingV3 as responsiveStarling } from "@/engine/myocardium/MainWireIntegratedModelFixedTbvForkV3";
import { warmStartMainWireIntegratedModelV3 as warm } from "@/engine/myocardium/MainWireIntegratedModelWarmStartV3";
import type { MainWireIntegratedModelRuntimeV3 } from "@/engine/myocardium/MainWireIntegratedModelRuntimeV3";

type Restored = Awaited<ReturnType<typeof restoreMainWireStaticCaseV1>>;
type State = ReturnType<BaseOwner["currentAcceptedState"]>;
type Inputs = Parameters<typeof createFixture>;

const sourceRuntime = (fixture: Fixture) => fixture as unknown as MainWireIntegratedModelRuntimeV3;

// Keep legacy restore/create/warm APIs private to this module. A facade prevents
// callers from accidentally selecting an inherited baseline-only factory.
class ExactOwner extends BaseOwner {
  constructor(fixture: Fixture, restored: Restored | null = null, fork: State | null = null) {
    super(sourceRuntime(fixture), fork ?? restored?.acceptedState ?? fixture.cold.acceptedState,
      fork !== null ? "fixed-tbv-protocol-fork" : restored === null ? "cold" : "standard-exact-checkpoint-restore",
      null, fork === null ? restored ?? undefined : undefined, undefined, null,
      // Restored analysis branches can own a validated frozen-tone window.
      // Seed the typed immutable manifest from that exact restored binding,
      // rather than forcing the cold simulation's window onto it.
      fork ?? restored?.acceptedState ?? undefined);
    if (restored !== null && fork === null) this.restoreCoupledPredictorContinuationV1(restored.coupledPredictor);
  }
  async capture(fixture: Fixture) {
    // Both captures are synchronous up to their first digest; no live solver reset.
    const predictor = this.checkpointCoupledPredictorContinuationV1();
    const base = super.checkpointStandardExact();
    return checkpointMainWireStaticCaseV1(fixture, await base, predictor);
  }
}

/** Anatomy-bearing development session. Not yet registered as a public exact
 * model or Surface. Numerical stepping remains in the shared exact owner. */
export class MainWireStaticCaseSessionV1 {
  readonly #fixture: Fixture;
  readonly #owner: ExactOwner;

  private constructor(fixture: Fixture, restored: Restored | null = null, fork: State | null = null) {
    this.#fixture = fixture;
    this.#owner = new ExactOwner(fixture, restored, fork);
  }

  static create(...inputs: Inputs): MainWireStaticCaseSessionV1 {
    return new MainWireStaticCaseSessionV1(createFixture(...inputs));
  }

  static async restore(checkpoint: unknown, ...inputs: Inputs): Promise<MainWireStaticCaseSessionV1> {
    const fixture = createFixture(...inputs);
    const restored = await restoreMainWireStaticCaseV1(fixture, checkpoint);
    return new MainWireStaticCaseSessionV1(fixture, restored);
  }

  get anatomy() { return this.#fixture.staticAnatomy; }
  get coronaryConstruction() { return this.#fixture.coronaryConstruction; }
  checkpoint() { return this.#owner.capture(this.#fixture); }
  currentAcceptedState() { return this.#owner.currentAcceptedState(); }
  snapshotAcceptedStateBytes() { return this.#owner.snapshotAcceptedStateBytes(); }
  observe() { return this.#owner.observe(); }
  coupledPredictorReport() { return this.#owner.coupledPredictorReport(); }
  advanceToPresentationTime(...args: Parameters<BaseOwner["advanceToPresentationTime"]>) {
    return this.#owner.advanceToPresentationTime(...args);
  }
  advanceToPresentationTimeWithSelectedOutputProjectionV1(...args: Parameters<BaseOwner["advanceToPresentationTimeWithSelectedOutputProjectionV1"]>) {
    return this.#owner.advanceToPresentationTimeWithSelectedOutputProjectionV1(...args);
  }

  warmStart(inputs: NonNullable<Inputs[1]>, mechanism: NonNullable<Inputs[3]> = this.#fixture.mechanismResearchInputs) {
    // This API has no target-anatomy argument. Effective mechanism inputs are
    // already scaled, so do not apply a ventricular multiplier a second time.
    const target = createFixture(this.anatomy.caseId, inputs, 1, mechanism);
    if (target.staticAnatomy !== this.#fixture.staticAnatomy) throw new Error("Warm start cannot change anatomy");
    const state = warm({ source: this.currentAcceptedState(), sourceRuntime: sourceRuntime(this.#fixture), targetRuntime: sourceRuntime(target) });
    return new MainWireStaticCaseSessionV1(target, null, state);
  }

  forkAtFixedGlobalTotalBloodVolume(totalBloodVolumeMl: number) {
    return new MainWireStaticCaseSessionV1(this.#fixture, null,
      fixedTbv({ source: this.currentAcceptedState(), runtime: this.#fixture, targetGlobalTotalBloodVolumeMl: totalBloodVolumeMl }));
  }

  forkResponsiveStarlingAtFixedGlobalTotalBloodVolume(totalBloodVolumeMl: number) {
    return new MainWireStaticCaseSessionV1(this.#fixture, null,
      responsiveStarling({ source: this.currentAcceptedState(), runtime: this.#fixture, targetGlobalTotalBloodVolumeMl: totalBloodVolumeMl }));
  }
}
