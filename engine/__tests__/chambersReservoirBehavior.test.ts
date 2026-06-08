import { describe, expect, it } from "vitest";
import { DEFAULT_PARAMS } from "@/constants";
import { ActiveStressChamberModel, defaultActiveLA } from "@/engine/chambers";
import { runScenario } from "@/engine/harness";

describe("ChamberModel reservoir behavior", () => {
  it("two-branch LA reservoir follows valve-gated ejection rise and IVR recoil", () => {
    const reservoir = runScenario({
      ...DEFAULT_PARAMS,
      nodeOverrides: { LA: { active: { reservoirStrokeMl: 12, reservoirBranchGain: 1 } } },
    });
    expect(Math.max(...reservoir.samples.map((s) => s.rLA))).toBeLessThanOrEqual(12);
    expect(Math.min(...reservoir.samples.map((s) => s.rLA))).toBeGreaterThanOrEqual(0);
    expect(reservoir.samples.some((s) => s.rRA !== 0)).toBe(false);
    expect(reservoir.samples.some((s) => (s.qLAReservoirMl ?? 0) > 0.1)).toBe(true);

    let ejectionRise = false;
    let ivrRecoil = false;
    let checkedPartition = false;
    for (let i = 1; i < reservoir.samples.length; i++) {
      const prev = reservoir.samples[i - 1];
      const cur = reservoir.samples[i];
      const dr = cur.rLA - prev.rLA;
      if (cur.xiAoV > 0.2 && cur.xiMV < 0.2 && dr > 0.0005) ejectionRise = true;
      if (cur.xiAoV < 0.2 && cur.xiMV < 0.2 && prev.rLA > 0.1 && dr < -0.0005) ivrRecoil = true;
      if (cur.VLABodyMl != null && cur.VLAReservoirMl != null) {
        checkedPartition = true;
        expect(cur.twoBranchSolveFlag).toBe("ok");
        expect(Math.abs(cur.VLABodyMl + cur.VLAReservoirMl - cur.VLA)).toBeLessThan(1e-6);
        expect(Math.abs(cur.PLAEquilibriumErrorMmHg ?? 0)).toBeLessThan(1e-4);
      }
    }
    expect(ejectionRise).toBe(true);
    expect(ivrRecoil).toBe(true);
    expect(checkedPartition).toBe(true);

    const ctx = {
      HR: 75,
      contractility: 1,
      relaxation: 1,
      phi: 0,
      tmaxScale: 1,
      geomScale: 1,
      caReleaseScale: 1,
      lvShortening01: 0.5,
      mvOpen01: 0,
      aovOpen01: 1,
    };
    const lowVolume = new ActiveStressChamberModel({
      ...defaultActiveLA,
      reservoirBranchGain: 1,
      reservoirStrokeMl: 10,
    }).reservoirBranchState(3, { c: 0, a: 0, r: 5 }, ctx);
    expect(lowVolume.solveFlag).toBe("lowVolumeConstrained");
    expect(Math.abs(lowVolume.vBodyMl + lowVolume.vReservoirMl - 3)).toBeLessThan(1e-12);

    const unbracketed = new ActiveStressChamberModel({
      ...defaultActiveLA,
      reservoirBranchGain: 1,
      reservoirStrokeMl: 10,
      pressureFloorMmHg: -5,
      reservoirSleeveP0: 100,
      reservoirQPressureFloorGuard: 0,
      reservoirSleeveMinPressureGuard: 0,
    }).reservoirBranchState(40, { c: 0, a: 0, r: 5 }, ctx);
    expect(unbracketed.solveFlag).toBe("unbracketedEndpoint");
    expect(Math.abs(unbracketed.vBodyMl + unbracketed.vReservoirMl - 40)).toBeLessThan(1e-12);

    const guarded = new ActiveStressChamberModel({
      ...defaultActiveLA,
      reservoirBranchGain: 1,
      reservoirStrokeMl: 50,
      reservoirSleeveVuMl: 0,
      reservoirSleeveCompliance: 1,
      reservoirQPressureFloorGuard: 1,
    }).reservoirBranchState(25, { c: 0, a: 0, r: 50 }, ctx);
    expect(guarded.solveFlag).not.toBe("lowVolumeConstrained");
    expect(guarded.qMl).toBeLessThan(50);
    expect(Math.abs(guarded.vBodyMl + guarded.vReservoirMl - 25)).toBeLessThan(1e-12);
    if (guarded.solveFlag === "ok") {
      expect(Math.abs(guarded.equilibriumErrorMmHg)).toBeLessThan(1e-4);
    }

    const minPressureGuarded = new ActiveStressChamberModel({
      ...defaultActiveLA,
      pressureFloorMmHg: -4,
      reservoirBranchGain: 1,
      reservoirStrokeMl: 50,
      reservoirSleeveVuMl: 0,
      reservoirSleeveCompliance: 1.5,
      reservoirSleeveMinPressureGuard: 1,
      reservoirSleeveMinPressureGuardWidthMl: 4,
    }).reservoirBranchState(23, { c: 0, a: 0, r: 0 }, ctx);
    expect(minPressureGuarded.solveFlag).toBe("ok");
    expect(Math.abs(minPressureGuarded.equilibriumErrorMmHg)).toBeLessThan(1e-4);
  });
});
