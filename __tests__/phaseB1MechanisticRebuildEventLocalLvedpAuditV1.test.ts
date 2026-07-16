import { describe, expect, it } from "vitest";
import {
  applyPeriodicConvergenceGateToEventLocalLvedpAudit,
  buildEventLocalLeftVentricularEndDiastolicPressureAudit,
} from "@/tools/myocardium/runPhaseB1MechanisticRebuildV2";

const PA_PER_MMHG = 133.322387415;

describe("mechanistic rebuild event-local LVEDP audit", () => {
  it("reads the committed t- state at the first ventricular calcium event without extrema substitution", () => {
    const audit = buildAudit(10, false);

    expect(audit.event).toMatchObject({
      eventOwnerWallId: "SEP",
      calciumDriveTimeSec: 0.172,
      timingOwner: "tissue-manifest-electrical-to-calcium-delay",
    });
    expect(audit.sampleSource)
      .toBe("committed-event-transaction-left-limit-evaluation");
    expect(audit.interpolationApplied).toBe(false);
    expect(audit.maximumVolumeSampleUsed).toBe(false);
    expect(audit.committedTransaction.committedEventLeftLimitProvenancePass)
      .toBe(true);
    expect(audit.observation.leftVentricularPressureMmHg).toBeCloseTo(10, 12);
    expect(audit.observation.leftVentricularVolumeMl).toBeCloseTo(140, 12);
    expect(audit.target.withinTargetBand).toBe(true);
    expect(audit.gate).toMatchObject({
      applied: false,
      pass: null,
      nonPeriodicReadbackIsDiagnosticOnly: true,
    });
  });

  it("applies the inclusive 5-15 mmHg target only after formal periodic convergence", () => {
    const nonPeriodicHigh = buildAudit(16, false);
    expect(nonPeriodicHigh.target.withinTargetBand).toBe(false);
    expect(nonPeriodicHigh.gate.pass).toBeNull();

    const periodicHigh = applyPeriodicConvergenceGateToEventLocalLvedpAudit(
      nonPeriodicHigh,
      true,
    );
    expect(periodicHigh.gate).toMatchObject({
      periodicConvergenceEligibilityPass: true,
      applied: true,
      pass: false,
      nonPeriodicReadbackIsDiagnosticOnly: false,
    });

    const periodicUpperBoundary =
      applyPeriodicConvergenceGateToEventLocalLvedpAudit(
        buildAudit(15, false),
        true,
      );
    expect(periodicUpperBoundary.gate.pass).toBe(true);
  });
});

function buildAudit(pressureMmHg: number, periodicConvergencePass: boolean) {
  const eventId =
    "phase-b1-project-synthetic-normal-sinus-five-wall-event-schedule-v1:cycle-0:SEP";
  const eventKey = `SEP:${eventId}`;
  const leftLimitEndpoint = {
    timeSec: 0.172,
    differentialState: {
      bloodVolumesM3: { LV: 140e-6 },
    },
  };
  const leftLimitEvaluation = {
    endpoint: {
      timeSec: leftLimitEndpoint.timeSec,
      differentialState: {
        bloodVolumesM3: { ...leftLimitEndpoint.differentialState.bloodVolumesM3 },
      },
    },
    closedLoop: {
      compartmentAbsolutePressurePa: {
        LV: pressureMmHg * PA_PER_MMHG,
      },
    },
  };
  const scheduledEvents = [
    {
      eventKey,
      cycleIndex: 0,
      wallId: "SEP",
      tissueClass: "ventricular",
      electricalOffsetWithinCycleSec: 0.16,
      calciumDriveOffsetWithinCycleSec: 0.172,
      electricalEvent: {
        eventId,
        electricalTimeSec: 0.16,
        strength: 1,
      },
      calciumDriveEvent: {
        wallId: "SEP",
        eventId,
        calciumDriveTimeSec: 0.172,
        strength: 1,
        timingOwner: "tissue-manifest-electrical-to-calcium-delay",
      },
    },
    {
      eventKey: "LVFW:later",
      cycleIndex: 0,
      wallId: "LVFW",
      tissueClass: "ventricular",
      electricalOffsetWithinCycleSec: 0.18,
      calciumDriveOffsetWithinCycleSec: 0.192,
      electricalEvent: {
        eventId: "later",
        electricalTimeSec: 0.18,
        strength: 1,
      },
      calciumDriveEvent: {
        wallId: "LVFW",
        eventId: "later",
        calciumDriveTimeSec: 0.192,
        strength: 1,
        timingOwner: "tissue-manifest-electrical-to-calcium-delay",
      },
    },
  ] as Parameters<
    typeof buildEventLocalLeftVentricularEndDiastolicPressureAudit
  >[0]["scheduledEvents"];
  const scheduleRun = {
    acceptedTransactions: [{
      previousEndpoint: { timeSec: 0.168 },
      nextEndpoint: {
        timeSec: 0.172,
        differentialState: {
          bloodVolumesM3: { LV: 999e-6 },
        },
      },
      leftLimitStep: {
        nextEndpointLeftLimit: leftLimitEndpoint,
        nextEvaluation: leftLimitEvaluation,
      },
      coordinator: {
        endTimeSec: 0.172,
        eventKeys: [eventKey],
        eventCount: 1,
        eventCountByWall: { SEP: 1 },
        eventBatchMode: "wall-partitioned-simultaneous-jump",
        eventBatchCommitted: true,
      },
    }],
  } as unknown as Parameters<
    typeof buildEventLocalLeftVentricularEndDiastolicPressureAudit
  >[0]["scheduleRun"];

  return buildEventLocalLeftVentricularEndDiastolicPressureAudit({
    cycleIndex: 0,
    cycleStartTimeSec: 0,
    cycleLengthSec: 0.8,
    scheduledEvents,
    scheduleRun,
    periodicConvergencePass,
  });
}
