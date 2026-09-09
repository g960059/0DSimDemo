import { MainWireIntegratedTypedAuthoritySessionV1 as BaseOwner, type MainWireTypedExecutionPlanInitializationV1 as Plan } from "./MainWireIntegratedTypedAuthoritySessionV1";
import { partitionMainWireIntegratedModelStandard68OutputIdsV1 as partition68, mergeMainWireIntegratedModelStandard68SelectedValuesV1 as merge68 } from "@/engine/myocardium/MainWireIntegratedModelStandard68OutputRegistryV1";
import { partitionMainWireIntegratedModelStandard70OutputIdsV1 as partition70, mergeMainWireIntegratedModelStandard70SelectedValuesV1 as merge70,
  type MainWireIntegratedModelStandard70OutputIdV1 as OutputId } from "@/engine/myocardium/MainWireIntegratedModelStandard70OutputRegistryV1";
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
  constructor(fixture: Fixture, restored: Restored | null = null, fork: State | null = null, plan?: Plan) {
    super(sourceRuntime(fixture), fork ?? restored?.acceptedState ?? fixture.cold.acceptedState,
      fork !== null ? "fixed-tbv-protocol-fork" : restored === null ? "cold" : "standard-exact-checkpoint-restore",
      null, fork === null ? restored ?? undefined : undefined, plan, null,
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

/** Anatomy-bearing exact session. Numerical stepping remains in the shared
 * exact owner; case adoption and registry publication are separate. */
export class MainWireStaticCaseSessionV1 {
  readonly #fixture: Fixture;
  readonly #owner: ExactOwner;
  readonly #plan: Plan | undefined;

  private constructor(fixture: Fixture, restored: Restored | null = null, fork: State | null = null, plan?: Plan) {
    this.#fixture = fixture;
    this.#plan = plan;
    this.#owner = new ExactOwner(fixture, restored, fork, plan);
  }

  static create(...inputs: [...Inputs, plan?: Plan]): MainWireStaticCaseSessionV1 {
    return new MainWireStaticCaseSessionV1(createFixture(inputs[0], inputs[1], inputs[2], inputs[3]), null, null, inputs[4]);
  }

  static async restore(checkpoint: unknown, ...inputs: [...Inputs, plan?: Plan]): Promise<MainWireStaticCaseSessionV1> {
    const fixture = createFixture(inputs[0], inputs[1], inputs[2], inputs[3]);
    const restored = await restoreMainWireStaticCaseV1(fixture, checkpoint);
    return new MainWireStaticCaseSessionV1(fixture, restored, null, inputs[4]);
  }

  get anatomy() { return this.#fixture.staticAnatomy; }
  get coronaryConstruction() { return this.#fixture.coronaryConstruction; }
  checkpoint() { return this.#owner.capture(this.#fixture); }
  currentAcceptedState() { return this.#owner.currentAcceptedState(); }
  snapshotAcceptedStateBytes() { return this.#owner.snapshotAcceptedStateBytes(); }
  observe() { return this.#owner.observe(); }
  coupledPredictorReport() { return this.#owner.coupledPredictorReport(); }
  projectCurrentAcceptedValuesV1(...args: Parameters<BaseOwner["projectCurrentAcceptedValuesV1"]>) {
    return this.#owner.projectCurrentAcceptedValuesV1(...args);
  }
  advanceStructuralAnalysisToPresentationTimeV1(...args: Parameters<BaseOwner["advanceStructuralAnalysisToPresentationTimeV1"]>) {
    return this.#owner.advanceStructuralAnalysisToPresentationTimeV1(...args);
  }
  advanceToPresentationTime(...args: Parameters<BaseOwner["advanceToPresentationTime"]>) {
    return this.#owner.advanceToPresentationTime(...args);
  }
  advanceToPresentationTimeWithSelectedOutputProjectionV1(...args: Parameters<BaseOwner["advanceToPresentationTimeWithSelectedOutputProjectionV1"]>) {
    return this.#owner.advanceToPresentationTimeWithSelectedOutputProjectionV1(...args);
  }

  warmStart(inputs: NonNullable<Inputs[1]>, mechanism: NonNullable<Inputs[3]> = this.#fixture.mechanismResearchInputs, plan?: Plan) {
    // This API has no target-anatomy argument. Effective mechanism inputs are
    // already scaled, so do not apply a ventricular multiplier a second time.
    const target = createFixture(this.anatomy.caseId, inputs, 1, mechanism);
    if (target.staticAnatomy !== this.#fixture.staticAnatomy) throw new Error("Warm start cannot change anatomy");
    const state = warm({ source: this.currentAcceptedState(), sourceRuntime: sourceRuntime(this.#fixture), targetRuntime: sourceRuntime(target) });
    return new MainWireStaticCaseSessionV1(target, null, state, plan);
  }

  forkAtFixedGlobalTotalBloodVolume(totalBloodVolumeMl: number) {
    return new MainWireStaticCaseSessionV1(this.#fixture, null,
      fixedTbv({ source: this.currentAcceptedState(), runtime: this.#fixture, targetGlobalTotalBloodVolumeMl: totalBloodVolumeMl }), this.#plan);
  }

  forkResponsiveStarlingAtFixedGlobalTotalBloodVolume(totalBloodVolumeMl: number) {
    return new MainWireStaticCaseSessionV1(this.#fixture, null,
      responsiveStarling({ source: this.currentAcceptedState(), runtime: this.#fixture, targetGlobalTotalBloodVolumeMl: totalBloodVolumeMl }), this.#plan);
  }

  projectCurrentAcceptedStandard70ValuesV1(outputIds: readonly OutputId[]) {
    const p70 = partition70(outputIds), p68 = partition68(p70.standard68OutputIds);
    return this.#mergeOutputs(outputIds, this.#owner.projectCurrentAcceptedValuesV1(p68.baseOutputIds));
  }
  advanceToPresentationTimeWithStandard70SelectedOutputProjectionV1(targetTimeSec: number, outputIds: readonly OutputId[]) {
    const p70 = partition70(outputIds), p68 = partition68(p70.standard68OutputIds);
    const projected = this.#owner.advanceToPresentationTimeWithSelectedOutputProjectionV1(targetTimeSec, p68.baseOutputIds);
    const started = performance.now();
    return Object.freeze({ ...projected,
      projectedValues: projected.projectedValues === null ? null : this.#mergeOutputs(outputIds, projected.projectedValues),
      outputProjectionDurationMs: projected.outputProjectionDurationMs + performance.now() - started,
    });
  }
  #mergeOutputs(outputIds: readonly OutputId[], baseValues: ReturnType<BaseOwner["projectCurrentAcceptedValuesV1"]>) {
    const completedBeatMetrics = this.observe().completedBeatMetrics;
    const p70 = partition70(outputIds);
    return merge70({ outputIds, completedBeatMetrics, standard68Values: merge68({
      outputIds: p70.standard68OutputIds, baseValues, completedBeatMetrics,
    }) });
  }
}
