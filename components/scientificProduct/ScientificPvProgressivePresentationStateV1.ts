export const SCIENTIFIC_PV_PRESENTATION_CROSSFADE_MS_V1 = 160;
export const SCIENTIFIC_PV_PRESENTATION_PENDING_CURRENT_ALPHA_V1 = 0.55;
export const SCIENTIFIC_PV_PRESENTATION_FIRST_HISTORY_ALPHA_V1 = 0.3;
export const SCIENTIFIC_PV_PRESENTATION_OLDER_HISTORY_ALPHA_V1 = 0.14;

export type ScientificPvPresentationGenerationStatusV1 =
  | "running"
  | "complete"
  | "limited"
  | "stale"
  | "error";

export type ScientificPvPresentationDomainV1 = Readonly<{
  volumeMl: readonly [number, number];
  pressureMmHg: readonly [number, number];
}>;

export type ScientificPvPresentationGenerationInputV1<TPayload> = Readonly<{
  generationId: string;
  sequence: number;
  status: ScientificPvPresentationGenerationStatusV1;
  renderable: boolean;
  payload: TPayload | null;
  /**
   * Scale domain requested by this generation alone. The canvas-level reducer
   * combines the effective current generation from every visible scenario.
   */
  domain: ScientificPvPresentationDomainV1 | null;
}>;

export type ScientificPvPresentationScenarioInputV1<TPayload> = Readonly<{
  scenarioId: string;
  current: ScientificPvPresentationGenerationInputV1<TPayload> | null;
  pending: ScientificPvPresentationGenerationInputV1<TPayload> | null;
  history?: readonly ScientificPvPresentationGenerationInputV1<TPayload>[];
}>;

export type AdvanceScientificPvPresentationInputV1<TPayload> = Readonly<{
  nowMs: number;
  reducedMotion: boolean;
  /** Domain contributed by native PV trajectories and other non-generation data. */
  baseDomain: ScientificPvPresentationDomainV1 | null;
  scenarios: readonly ScientificPvPresentationScenarioInputV1<TPayload>[];
}>;

type ScientificPvPresentationOpacityTransitionV1 = Readonly<{
  from: number;
  target: number;
  startedAtMs: number;
  durationMs: number;
}>;

export type ScientificPvPresentationLayerStateV1<TPayload> = Readonly<{
  generation: ScientificPvPresentationGenerationInputV1<TPayload> &
    Readonly<{ payload: TPayload; renderable: true }>;
  generationAge: number;
  opacityTransition: ScientificPvPresentationOpacityTransitionV1;
}>;

export type ScientificPvPresentationScenarioStateV1<TPayload> = Readonly<{
  scenarioId: string;
  currentGenerationId: string | null;
  pendingGenerationId: string | null;
  running: boolean;
  layers: readonly ScientificPvPresentationLayerStateV1<TPayload>[];
}>;

export type ScientificPvPresentationDomainPhaseV1 =
  | "settled"
  | "expand-only"
  | "rebase-after-crossfade";

export type ScientificPvProgressivePresentationStateV1<TPayload> = Readonly<{
  historyLimit: number;
  lastNowMs: number;
  scenarioOrder: readonly string[];
  scenarios: Readonly<Record<
    string,
    ScientificPvPresentationScenarioStateV1<TPayload>
  >>;
  domain: ScientificPvPresentationDomainV1 | null;
  domainPhase: ScientificPvPresentationDomainPhaseV1;
  /** Increments only when an expand-only acquisition cycle performs its rebase. */
  domainRebaseCount: number;
}>;

export type ScientificPvPresentedLayerV1<TPayload> = Readonly<{
  scenarioId: string;
  generationId: string;
  sequence: number;
  status: ScientificPvPresentationGenerationStatusV1;
  generationAge: number;
  opacity: number;
  payload: TPayload;
}>;

export type ScientificPvProgressivePresentationViewV1<TPayload> = Readonly<{
  domain: ScientificPvPresentationDomainV1 | null;
  domainPhase: ScientificPvPresentationDomainPhaseV1;
  domainRebaseCount: number;
  crossfadeActive: boolean;
  needsAnimationFrame: boolean;
  layers: readonly ScientificPvPresentedLayerV1<TPayload>[];
}>;

export function createScientificPvProgressivePresentationStateV1<TPayload>(
  options: Readonly<{ historyLimit?: number }> = {},
): ScientificPvProgressivePresentationStateV1<TPayload> {
  return Object.freeze({
    historyLimit: normalizeHistoryLimit(options.historyLimit),
    lastNowMs: 0,
    scenarioOrder: Object.freeze([]),
    scenarios: Object.freeze({}),
    domain: null,
    domainPhase: "settled",
    domainRebaseCount: 0,
  });
}

/**
 * Pure chart-local reducer for progressive PV guides and relation overlays.
 *
 * Geometry is always replaced atomically. Only generation opacity is
 * interpolated, so a newer sequence within the same generation never morphs
 * one physiological curve into another. Passing `nowMs` on animation frames
 * makes interruption begin from the currently presented alpha.
 */
export function advanceScientificPvProgressivePresentationStateV1<TPayload>(
  state: ScientificPvProgressivePresentationStateV1<TPayload>,
  input: AdvanceScientificPvPresentationInputV1<TPayload>,
): ScientificPvProgressivePresentationStateV1<TPayload> {
  const nowMs = Math.max(state.lastNowMs, finiteTime(input.nowMs));
  const durationMs = input.reducedMotion
    ? 0
    : SCIENTIFIC_PV_PRESENTATION_CROSSFADE_MS_V1;
  const incomingByScenarioId = new Map(
    input.scenarios.map((scenario) => [scenario.scenarioId, scenario]),
  );
  const scenarioOrder = Object.freeze(uniqueStrings([
    ...input.scenarios.map(({ scenarioId }) => scenarioId),
    ...state.scenarioOrder,
  ]));
  const scenarios: Record<
    string,
    ScientificPvPresentationScenarioStateV1<TPayload>
  > = {};

  for (const scenarioId of scenarioOrder) {
    const previous = state.scenarios[scenarioId];
    const incoming = incomingByScenarioId.get(scenarioId) ?? null;
    const reconciled = reconcileScenario(
      previous,
      incoming,
      nowMs,
      durationMs,
      state.historyLimit,
    );
    if (reconciled.layers.length > 0 || incoming !== null) {
      scenarios[scenarioId] = reconciled;
    }
  }

  const normalizedScenarioOrder = Object.freeze(
    scenarioOrder.filter((scenarioId) => scenarios[scenarioId] !== undefined),
  );
  const crossfadeActive = Object.values(scenarios).some((scenario) =>
    scenario.layers.some((layer) => transitionIsActive(layer, nowMs)));
  const running = Object.values(scenarios).some((scenario) => scenario.running);
  const requestedDomain = requestedCanvasDomain(
    input.baseDomain,
    normalizedScenarioOrder.map((scenarioId) => scenarios[scenarioId]!),
  );
  const domainState = reconcileDomain({
    previousDomain: state.domain,
    previousPhase: state.domainPhase,
    previousRebaseCount: state.domainRebaseCount,
    requestedDomain,
    running,
    crossfadeActive,
  });

  return Object.freeze({
    historyLimit: state.historyLimit,
    lastNowMs: nowMs,
    scenarioOrder: normalizedScenarioOrder,
    scenarios: Object.freeze(scenarios),
    domain: domainState.domain,
    domainPhase: domainState.phase,
    domainRebaseCount: domainState.rebaseCount,
  });
}

export function presentScientificPvProgressivePresentationStateV1<TPayload>(
  state: ScientificPvProgressivePresentationStateV1<TPayload>,
  nowMs: number,
): ScientificPvProgressivePresentationViewV1<TPayload> {
  const presentationTimeMs = Math.max(state.lastNowMs, finiteTime(nowMs));
  const layers: ScientificPvPresentedLayerV1<TPayload>[] = [];
  let crossfadeActive = false;
  for (const scenarioId of state.scenarioOrder) {
    const scenario = state.scenarios[scenarioId];
    if (scenario === undefined) continue;
    for (const layer of scenario.layers) {
      const opacity = presentedOpacity(layer.opacityTransition, presentationTimeMs);
      crossfadeActive ||= transitionIsActive(layer, presentationTimeMs);
      if (opacity <= 1e-6) continue;
      layers.push(Object.freeze({
        scenarioId,
        generationId: layer.generation.generationId,
        sequence: layer.generation.sequence,
        status: layer.generation.status,
        generationAge: layer.generationAge,
        opacity,
        payload: layer.generation.payload,
      }));
    }
  }
  return Object.freeze({
    domain: state.domain,
    domainPhase: state.domainPhase,
    domainRebaseCount: state.domainRebaseCount,
    crossfadeActive,
    needsAnimationFrame: crossfadeActive
      || state.domainPhase === "rebase-after-crossfade",
    layers: Object.freeze(layers),
  });
}

export function scientificPvPresentationOpacityTargetV1(
  generationAge: number,
  replacementPending: boolean,
): number {
  if (generationAge <= 0) {
    return replacementPending
      ? SCIENTIFIC_PV_PRESENTATION_PENDING_CURRENT_ALPHA_V1
      : 1;
  }
  return generationAge === 1
    ? SCIENTIFIC_PV_PRESENTATION_FIRST_HISTORY_ALPHA_V1
    : SCIENTIFIC_PV_PRESENTATION_OLDER_HISTORY_ALPHA_V1;
}

export function unionScientificPvPresentationDomainsV1(
  domains: readonly (ScientificPvPresentationDomainV1 | null | undefined)[],
): ScientificPvPresentationDomainV1 | null {
  const valid = domains.flatMap((domain) => {
    const normalized = normalizeDomain(domain);
    return normalized === null ? [] : [normalized];
  });
  if (valid.length === 0) return null;
  return Object.freeze({
    volumeMl: Object.freeze([
      Math.min(...valid.map(({ volumeMl }) => volumeMl[0])),
      Math.max(...valid.map(({ volumeMl }) => volumeMl[1])),
    ]) as readonly [number, number],
    pressureMmHg: Object.freeze([
      Math.min(...valid.map(({ pressureMmHg }) => pressureMmHg[0])),
      Math.max(...valid.map(({ pressureMmHg }) => pressureMmHg[1])),
    ]) as readonly [number, number],
  });
}

function reconcileScenario<TPayload>(
  previous: ScientificPvPresentationScenarioStateV1<TPayload> | undefined,
  input: ScientificPvPresentationScenarioInputV1<TPayload> | null,
  nowMs: number,
  durationMs: number,
  historyLimit: number,
): ScientificPvPresentationScenarioStateV1<TPayload> {
  const previousLayers = previous?.layers ?? [];
  const previousCurrent = previousLayers.find(({ generation }) =>
    generation.generationId === previous?.currentGenerationId)?.generation
    ?? null;
  const pendingRenderable = renderableGeneration(input?.pending ?? null);
  const currentRenderable = renderableGeneration(input?.current ?? null);
  const hasUnrenderableReplacement = input !== null && (
    (input.pending !== null && pendingRenderable === null)
    || (input.current !== null && currentRenderable === null)
  );
  const current = pendingRenderable
    ?? currentRenderable
    ?? (hasUnrenderableReplacement ? previousCurrent : null);
  const replacementPending = input?.pending !== null
    && pendingRenderable === null
    && current !== null
    && input.pending.generationId !== current.generationId;
  const desired = desiredGenerations({
    current,
    input,
    previousLayers,
    historyLimit,
  });
  const previousByGenerationId = new Map(previousLayers.map((layer) => [
    layer.generation.generationId,
    layer,
  ]));
  const initialPresentation = previousLayers.length === 0;
  const desiredIds = new Set(desired.map(({ generation }) =>
    generation.generationId));
  const layers: ScientificPvPresentationLayerStateV1<TPayload>[] = [];

  desired.forEach(({ generation, generationAge }) => {
    const target = scientificPvPresentationOpacityTargetV1(
      generationAge,
      generationAge === 0 && replacementPending,
    );
    const existing = previousByGenerationId.get(generation.generationId);
    if (existing === undefined) {
      layers.push(freezeLayer({
        generation,
        generationAge,
        opacityTransition: initialPresentation
          ? settledTransition(target, nowMs)
          : makeTransition(0, target, nowMs, durationMs),
      }));
      return;
    }
    const activeGuideContactRefresh = generationAge === 0
      && !replacementPending
      && generation.sequence === existing.generation.sequence;
    const acceptedGeneration = generation.sequence > existing.generation.sequence
      || activeGuideContactRefresh
      ? generation
      : existing.generation;
    layers.push(freezeLayer({
      generation: acceptedGeneration,
      generationAge,
      opacityTransition: retargetTransition(
        existing.opacityTransition,
        target,
        nowMs,
        durationMs,
      ),
    }));
  });

  for (const existing of previousLayers) {
    if (desiredIds.has(existing.generation.generationId)) continue;
    const currentOpacity = presentedOpacity(existing.opacityTransition, nowMs);
    if (currentOpacity <= 1e-6 && !transitionIsActive(existing, nowMs)) continue;
    layers.push(freezeLayer({
      generation: existing.generation,
      generationAge: historyLimit + 1,
      opacityTransition: retargetTransition(
        existing.opacityTransition,
        0,
        nowMs,
        durationMs,
      ),
    }));
  }

  const running = input?.pending?.status === "running"
    || current?.status === "running";
  return Object.freeze({
    scenarioId: input?.scenarioId ?? previous?.scenarioId ?? "",
    currentGenerationId: current?.generationId ?? null,
    pendingGenerationId: replacementPending
      ? input!.pending!.generationId
      : null,
    running,
    layers: Object.freeze(layers),
  });
}

function desiredGenerations<TPayload>(input: Readonly<{
  current: RenderableGeneration<TPayload> | null;
  input: ScientificPvPresentationScenarioInputV1<TPayload> | null;
  previousLayers: readonly ScientificPvPresentationLayerStateV1<TPayload>[];
  historyLimit: number;
}>): readonly Readonly<{
  generation: RenderableGeneration<TPayload>;
  generationAge: number;
}>[] {
  if (input.current === null) return Object.freeze([]);
  const ordered: RenderableGeneration<TPayload>[] = [input.current];
  const add = (
    generation: ScientificPvPresentationGenerationInputV1<TPayload> | null,
  ) => {
    const renderable = renderableGeneration(generation);
    if (
      renderable === null
      || ordered.some(({ generationId }) =>
        generationId === renderable.generationId)
    ) return;
    ordered.push(renderable);
  };
  if (input.input?.current?.generationId !== input.current.generationId) {
    add(input.input?.current ?? null);
  }
  for (const history of input.input?.history ?? []) add(history);
  for (const layer of [...input.previousLayers]
    .sort((left, right) => left.generationAge - right.generationAge)) {
    add(layer.generation);
  }
  return Object.freeze(ordered
    .slice(0, 1 + input.historyLimit)
    .map((generation, generationAge) => Object.freeze({
      generation,
      generationAge,
    })));
}

type RenderableGeneration<TPayload> =
  ScientificPvPresentationGenerationInputV1<TPayload> &
  Readonly<{ payload: TPayload; renderable: true }>;

function renderableGeneration<TPayload>(
  generation:
    | ScientificPvPresentationGenerationInputV1<TPayload>
    | null,
): RenderableGeneration<TPayload> | null {
  return generation !== null && generation.renderable && generation.payload !== null
    ? generation as RenderableGeneration<TPayload>
    : null;
}

function retargetTransition(
  previous: ScientificPvPresentationOpacityTransitionV1,
  target: number,
  nowMs: number,
  durationMs: number,
): ScientificPvPresentationOpacityTransitionV1 {
  if (durationMs <= 0) return settledTransition(target, nowMs);
  if (Math.abs(previous.target - target) <= 1e-9) return previous;
  return makeTransition(
    presentedOpacity(previous, nowMs),
    target,
    nowMs,
    durationMs,
  );
}

function makeTransition(
  from: number,
  target: number,
  startedAtMs: number,
  durationMs: number,
): ScientificPvPresentationOpacityTransitionV1 {
  return Object.freeze({
    from: clampOpacity(from),
    target: clampOpacity(target),
    startedAtMs,
    durationMs: Math.max(0, durationMs),
  });
}

function settledTransition(
  target: number,
  nowMs: number,
): ScientificPvPresentationOpacityTransitionV1 {
  return makeTransition(target, target, nowMs, 0);
}

function presentedOpacity(
  transition: ScientificPvPresentationOpacityTransitionV1,
  nowMs: number,
): number {
  if (transition.durationMs <= 0) return transition.target;
  const progress = Math.min(
    1,
    Math.max(0, (nowMs - transition.startedAtMs) / transition.durationMs),
  );
  if (progress <= 0) return transition.from;
  if (progress >= 1) return transition.target;
  // Strong ease-out keeps the response immediate without inventing geometry.
  const eased = 1 - Math.pow(1 - progress, 3);
  return clampOpacity(
    transition.from + (transition.target - transition.from) * eased,
  );
}

function transitionIsActive<TPayload>(
  layer: ScientificPvPresentationLayerStateV1<TPayload>,
  nowMs: number,
): boolean {
  const transition = layer.opacityTransition;
  return transition.durationMs > 0
    && nowMs < transition.startedAtMs + transition.durationMs
    && Math.abs(transition.target - transition.from) > 1e-9;
}

function requestedCanvasDomain<TPayload>(
  baseDomain: ScientificPvPresentationDomainV1 | null,
  scenarios: readonly ScientificPvPresentationScenarioStateV1<TPayload>[],
): ScientificPvPresentationDomainV1 | null {
  return unionScientificPvPresentationDomainsV1([
    baseDomain,
    ...scenarios.flatMap((scenario) => scenario.layers.map(({ generation }) =>
      generation.domain)),
  ]);
}

function reconcileDomain(input: Readonly<{
  previousDomain: ScientificPvPresentationDomainV1 | null;
  previousPhase: ScientificPvPresentationDomainPhaseV1;
  previousRebaseCount: number;
  requestedDomain: ScientificPvPresentationDomainV1 | null;
  running: boolean;
  crossfadeActive: boolean;
}>): Readonly<{
  domain: ScientificPvPresentationDomainV1 | null;
  phase: ScientificPvPresentationDomainPhaseV1;
  rebaseCount: number;
}> {
  if (input.previousDomain === null) {
    return Object.freeze({
      domain: input.requestedDomain,
      phase: input.running
        ? "expand-only"
        : input.crossfadeActive
          ? "rebase-after-crossfade"
          : "settled",
      rebaseCount: input.previousRebaseCount,
    });
  }
  if (input.running) {
    return Object.freeze({
      domain: unionScientificPvPresentationDomainsV1([
        input.previousDomain,
        input.requestedDomain,
      ]),
      phase: "expand-only",
      rebaseCount: input.previousRebaseCount,
    });
  }
  if (input.crossfadeActive) {
    return Object.freeze({
      domain: unionScientificPvPresentationDomainsV1([
        input.previousDomain,
        input.requestedDomain,
      ]),
      phase: "rebase-after-crossfade",
      rebaseCount: input.previousRebaseCount,
    });
  }
  const needsRebase = input.previousPhase !== "settled";
  return Object.freeze({
    domain: input.requestedDomain,
    phase: "settled",
    rebaseCount: input.previousRebaseCount + (needsRebase ? 1 : 0),
  });
}

function normalizeDomain(
  domain: ScientificPvPresentationDomainV1 | null | undefined,
): ScientificPvPresentationDomainV1 | null {
  if (domain === null || domain === undefined) return null;
  const [volumeMinimum, volumeMaximum] = domain.volumeMl;
  const [pressureMinimum, pressureMaximum] = domain.pressureMmHg;
  if (
    !Number.isFinite(volumeMinimum)
    || !Number.isFinite(volumeMaximum)
    || !Number.isFinite(pressureMinimum)
    || !Number.isFinite(pressureMaximum)
  ) return null;
  return Object.freeze({
    volumeMl: Object.freeze([
      Math.min(volumeMinimum, volumeMaximum),
      Math.max(volumeMinimum, volumeMaximum),
    ]) as readonly [number, number],
    pressureMmHg: Object.freeze([
      Math.min(pressureMinimum, pressureMaximum),
      Math.max(pressureMinimum, pressureMaximum),
    ]) as readonly [number, number],
  });
}

function freezeLayer<TPayload>(
  layer: ScientificPvPresentationLayerStateV1<TPayload>,
): ScientificPvPresentationLayerStateV1<TPayload> {
  return Object.freeze(layer);
}

function normalizeHistoryLimit(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) return 2;
  return Math.max(0, Math.floor(value));
}

function finiteTime(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values)];
}

function clampOpacity(value: number): number {
  return Math.min(1, Math.max(0, value));
}
