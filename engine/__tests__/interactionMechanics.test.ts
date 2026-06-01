import { describe, expect, it } from "vitest";
import { DEFAULT_PARAMS } from "@/constants";
import { runScenario } from "@/engine/harness";
import { pericardialPressure } from "@/engine/mechanics/pericardium";
import { septalRestoringPressure } from "@/engine/mechanics/septum";
import type { SimSample } from "@/engine/protocol";

const FAST_OPTIONS = { settleSeconds: 45, measureSeconds: 12 };

describe("pericardial pressure and septal coupling", () => {
  it("keeps the mechanics modules monotone and neutral when disabled", () => {
    const disabled = pericardialPressure({
      VLV: 120,
      VRV: 140,
      VLA: 55,
      VRA: 70,
      Pth: -3,
    }, {
      enabled: false,
      pressureScaleMmHg: 8,
      slackVolumeMl: 300,
      volumeScaleMl: 40,
      softnessMl: 8,
      biasMmHg: 5,
      fluidMl: 250,
    });
    expect(disabled.Pperi).toBe(-3);
    expect(disabled.Ppc).toBe(0);

    const loose = pericardialPressure({
      VLV: 90,
      VRV: 110,
      VLA: 35,
      VRA: 50,
      Pth: 0,
    }, {
      enabled: true,
      pressureScaleMmHg: 1,
      slackVolumeMl: 340,
      volumeScaleMl: 45,
      softnessMl: 8,
      biasMmHg: 0,
      fluidMl: 0,
    });
    const tight = pericardialPressure({
      VLV: 90,
      VRV: 110,
      VLA: 35,
      VRA: 50,
      Pth: 0,
    }, {
      enabled: true,
      pressureScaleMmHg: 1,
      slackVolumeMl: 340,
      volumeScaleMl: 45,
      softnessMl: 8,
      biasMmHg: 0,
      fluidMl: 150,
    });
    expect(tight.Ppc).toBeGreaterThan(loose.Ppc);

    const septumParams = {
      enabled: true,
      stiffnessScale: 1,
      k1MmHgPerMl: 1.4,
      k3MmHgPerMl3: 0.006,
      dampingMmHgSecPerMl: 4,
      maxShiftMl: 25,
      lvPressureWeight: 0.28,
    };
    expect(septalRestoringPressure(10, septumParams)).toBeGreaterThan(septalRestoringPressure(2, septumParams));
    expect(septalRestoringPressure(-10, septumParams)).toBeLessThan(septalRestoringPressure(-2, septumParams));
  });

  it("can be switched off without hidden pressure terms", () => {
    const off = runScenario({
      ...DEFAULT_PARAMS,
      pericardiumEnabled: false,
      septalCouplingEnabled: false,
    }, FAST_OPTIONS);
    const beat = lastCompleteBeat(off.samples);
    expect(beat.length).toBeGreaterThan(40);
    expect(maxAbs(beat, "Ppc")).toBeLessThan(1e-9);
    expect(maxAbs(beat, "Pperi")).toBeLessThan(1e-9);
    expect(maxAbs(beat, "septumShiftMl")).toBeLessThan(1e-9);
    expect(maxAbs(beat, "PVI_LV")).toBeLessThan(1e-9);
    expect(maxAbs(beat, "PVI_RV")).toBeLessThan(1e-9);
    expect(off.health.numericalStability).toBe("ok");
  });

  it("raises pericardial pressure and limits filling under effusion", () => {
    const base = runScenario(DEFAULT_PARAMS, FAST_OPTIONS);
    const effusion = runScenario({ ...DEFAULT_PARAMS, pericardialFluidMl: 100 }, FAST_OPTIONS);
    const baseBeat = lastCompleteBeat(base.samples);
    const effusionBeat = lastCompleteBeat(effusion.samples);

    expect(maxOf(effusionBeat, "Ppc")).toBeGreaterThan(maxOf(baseBeat, "Ppc") + 2);
    expect(effusion.metrics.RAPMean).toBeGreaterThan(base.metrics.RAPMean + 0.6);
    expect(effusion.metrics.LVEDPApprox).toBeGreaterThan(base.metrics.LVEDPApprox + 3);
    expect(effusion.metrics.SV_L).toBeLessThan(base.metrics.SV_L - 4);
    expect(maxOf(effusionBeat, "VLV")).toBeLessThan(maxOf(baseBeat, "VLV") - 5);
    expect(effusion.health.numericalStability).toBe("ok");
  });

  it("moves the septal diagnostic toward the LV under RV pressure overload", () => {
    const base = runScenario(DEFAULT_PARAMS, FAST_OPTIONS);
    const overload = runScenario({
      ...DEFAULT_PARAMS,
      pulmonaryResistance: DEFAULT_PARAMS.pulmonaryResistance * 4,
    }, FAST_OPTIONS);
    const baseBeat = lastCompleteBeat(base.samples);
    const overloadBeat = lastCompleteBeat(overload.samples);

    expect(overload.metrics.PAPMean).toBeGreaterThan(base.metrics.PAPMean + 2);
    expect(meanOf(overloadBeat, "septumShiftMl")).toBeGreaterThan(meanOf(baseBeat, "septumShiftMl") + 2);
    expect(maxOf(overloadBeat, "PVI_LV")).toBeGreaterThan(1);
    expect(overload.health.numericalStability).toBe("ok");
  });
});

function lastCompleteBeat(samples: SimSample[]): SimSample[] {
  const last = samples.at(-1);
  if (!last) return [];
  const beat = Math.floor(last.phi) - 1;
  return samples.filter((sample) => Math.floor(sample.phi) === beat);
}

function maxAbs(samples: SimSample[], key: keyof SimSample): number {
  return Math.max(...samples.map((s) => Math.abs(Number(s[key]))));
}

function maxOf(samples: SimSample[], key: keyof SimSample): number {
  return Math.max(...samples.map((s) => Number(s[key])));
}

function meanOf(samples: SimSample[], key: keyof SimSample): number {
  return samples.reduce((sum, s) => sum + Number(s[key]), 0) / Math.max(samples.length, 1);
}
