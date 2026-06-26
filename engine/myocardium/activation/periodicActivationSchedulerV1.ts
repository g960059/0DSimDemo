import type {
  ActivationEventInput,
  ActivationScheduler,
  ActivationSchedulerOutput,
  ActivationTargetId,
} from "@/engine/myocardium/contracts";
import { compareCanonicalStrings } from "@/engine/myocardium/canonicalOrder";
import {
  requireFiniteNumber,
  requireNonNegativeFiniteSeconds,
  requirePositiveFiniteSeconds,
  requireUnitInterval01,
} from "@/engine/myocardium/units";

export const PERIODIC_ACTIVATION_SCHEDULER_V1_ID = "periodic-activation-scheduler-v1";

export type PeriodicActivationSchedulerV1Params = {
  targetIds: readonly ActivationTargetId[];
  cycleLengthSec: number;
  defaultActivationDelaySec: number;
  delayByTargetIdSec?: Readonly<Record<ActivationTargetId, number>>;
  activationStrength01: number;
};

type NormalizedPeriodicActivationParams = {
  targetIds: readonly ActivationTargetId[];
  cycleLengthSec: number;
  defaultActivationDelaySec: number;
  delayByTargetIdSec: Readonly<Record<ActivationTargetId, number>>;
  activationStrength01: number;
  paramsKey: string;
};

type ResetState = {
  timeSec: number;
  paramsKey: string;
  eventCountersByTargetId: Readonly<Record<ActivationTargetId, number>>;
};

type PendingActivationEvent = {
  targetId: ActivationTargetId;
  activationTimeSec: number;
  activationEventId: number;
};

export class PeriodicActivationSchedulerV1 implements ActivationScheduler<PeriodicActivationSchedulerV1Params> {
  readonly id = PERIODIC_ACTIVATION_SCHEDULER_V1_ID;

  private resetState: ResetState | null = null;

  reset(timeSec: number, params: PeriodicActivationSchedulerV1Params): void {
    const normalized = normalizePeriodicActivationParams(params);
    const resetTimeSec = requireFiniteNumber(timeSec, "timeSec");
    this.resetState = {
      timeSec: resetTimeSec,
      paramsKey: normalized.paramsKey,
      eventCountersByTargetId: activationEventCountersAtOrBefore(resetTimeSec, normalized),
    };
  }

  advance(
    previousTimeSec: number,
    nextTimeSec: number,
    params: PeriodicActivationSchedulerV1Params,
  ): ActivationSchedulerOutput {
    const normalized = normalizePeriodicActivationParams(params);
    const previousSec = requireFiniteNumber(previousTimeSec, "previousTimeSec");
    const nextSec = requireFiniteNumber(nextTimeSec, "nextTimeSec");
    if (nextSec < previousSec) {
      throw new Error("nextTimeSec must be greater than or equal to previousTimeSec");
    }

    if (
      this.resetState === null
      || this.resetState.paramsKey !== normalized.paramsKey
      || previousSec < this.resetState.timeSec
    ) {
      this.reset(previousSec, params);
    }

    const pendingEvents = collectPendingEvents(previousSec, nextSec, normalized);
    this.resetState = {
      timeSec: nextSec,
      paramsKey: normalized.paramsKey,
      eventCountersByTargetId: activationEventCountersAtOrBefore(nextSec, normalized),
    };

    return {
      events: pendingEvents.map((event) => ({
        targetId: event.targetId,
        activationEventId: event.activationEventId,
        timeSinceActivationSec: Math.max(0, nextSec - event.activationTimeSec),
        cycleLengthSec: normalized.cycleLengthSec,
        activationStrength01: normalized.activationStrength01,
      })),
      rhythmCycleId: rhythmCycleIdAt(nextSec, normalized.cycleLengthSec),
    };
  }
}

export function createPeriodicActivationSchedulerV1(): PeriodicActivationSchedulerV1 {
  return new PeriodicActivationSchedulerV1();
}

export function normalizePeriodicActivationParams(
  params: PeriodicActivationSchedulerV1Params,
): NormalizedPeriodicActivationParams {
  const cycleLengthSec = requirePositiveFiniteSeconds(params.cycleLengthSec, "cycleLengthSec");
  const defaultActivationDelaySec = requireNonNegativeFiniteSeconds(
    params.defaultActivationDelaySec,
    "defaultActivationDelaySec",
  );
  const activationStrength01 = requireUnitInterval01(params.activationStrength01, "activationStrength01");
  const targetIds = normalizeTargetIds(params.targetIds);
  const delayByTargetIdSec = normalizeDelayByTargetIdSec(
    targetIds,
    params.delayByTargetIdSec ?? {},
    defaultActivationDelaySec,
  );

  return {
    targetIds,
    cycleLengthSec,
    defaultActivationDelaySec,
    delayByTargetIdSec,
    activationStrength01,
    paramsKey: JSON.stringify({
      targetIds,
      cycleLengthSec,
      defaultActivationDelaySec,
      delayByTargetIdSec,
      activationStrength01,
    }),
  };
}

function collectPendingEvents(
  previousTimeSec: number,
  nextTimeSec: number,
  params: NormalizedPeriodicActivationParams,
): readonly PendingActivationEvent[] {
  if (previousTimeSec === nextTimeSec) return [];

  const events: PendingActivationEvent[] = [];
  for (const targetId of params.targetIds) {
    const delaySec = params.delayByTargetIdSec[targetId] ?? params.defaultActivationDelaySec;
    const firstCycle = Math.floor((previousTimeSec - delaySec) / params.cycleLengthSec) + 1;
    const lastCycle = Math.floor((nextTimeSec - delaySec) / params.cycleLengthSec);

    for (let cycleIndex = firstCycle; cycleIndex <= lastCycle; cycleIndex += 1) {
      const activationTimeSec = cycleIndex * params.cycleLengthSec + delaySec;
      if (activationTimeSec > previousTimeSec && activationTimeSec <= nextTimeSec) {
        events.push({
          targetId,
          activationTimeSec,
          activationEventId: activationEventIdForCycle(cycleIndex),
        });
      }
    }
  }

  return events.sort((left, right) => {
    const timeOrder = left.activationTimeSec - right.activationTimeSec;
    if (timeOrder !== 0) return timeOrder;
    return compareCanonicalStrings(left.targetId, right.targetId);
  });
}

function activationEventCountersAtOrBefore(
  timeSec: number,
  params: NormalizedPeriodicActivationParams,
): Readonly<Record<ActivationTargetId, number>> {
  const counters: Record<ActivationTargetId, number> = {};
  for (const targetId of params.targetIds) {
    const delaySec = params.delayByTargetIdSec[targetId] ?? params.defaultActivationDelaySec;
    counters[targetId] = Math.max(0, Math.floor((timeSec - delaySec) / params.cycleLengthSec) + 1);
  }
  return counters;
}

function activationEventIdForCycle(cycleIndex: number): number {
  return cycleIndex + 1;
}

function rhythmCycleIdAt(timeSec: number, cycleLengthSec: number): number {
  return Math.floor(timeSec / cycleLengthSec);
}

function normalizeTargetIds(targetIds: readonly ActivationTargetId[]): readonly ActivationTargetId[] {
  if (!Array.isArray(targetIds) || targetIds.length === 0) {
    throw new Error("targetIds must contain at least one activation target");
  }

  const seen = new Set<string>();
  const normalized = targetIds.map((targetId, index) => {
    if (typeof targetId !== "string" || targetId.trim().length === 0) {
      throw new Error(`targetIds[${index}] must be a non-empty string`);
    }
    if (seen.has(targetId)) {
      throw new Error(`targetIds contains duplicate activation target: ${targetId}`);
    }
    seen.add(targetId);
    return targetId;
  });

  return normalized.sort(compareCanonicalStrings);
}

function normalizeDelayByTargetIdSec(
  targetIds: readonly ActivationTargetId[],
  delayByTargetIdSec: Readonly<Record<ActivationTargetId, number>>,
  defaultActivationDelaySec: number,
): Readonly<Record<ActivationTargetId, number>> {
  const targetSet = new Set(targetIds);
  const normalized: Record<ActivationTargetId, number> = {};

  for (const targetId of targetIds) {
    normalized[targetId] =
      targetId in delayByTargetIdSec
        ? requireNonNegativeFiniteSeconds(delayByTargetIdSec[targetId], `delayByTargetIdSec.${targetId}`)
        : defaultActivationDelaySec;
  }

  for (const targetId of Object.keys(delayByTargetIdSec)) {
    if (!targetSet.has(targetId)) {
      throw new Error(`delayByTargetIdSec contains unknown activation target: ${targetId}`);
    }
  }

  return normalized;
}
