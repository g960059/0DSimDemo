import { softplus } from "@/engine/math";

export type VascularPvLaw =
  | {
      kind: "arterial";
      Vu: number;
      P0: number;
      VsEff: number;
    }
  | {
      kind: "linear";
      Vu: number;
      C: number;
    }
  | {
      kind: "venous3";
      Vu: number;
      Ccoll: number;
      Copen: number;
      Cdist: number;
      Popen: number;
      Pstiff: number;
      dOpen: number;
      dStiff: number;
    };

export function stressedVolumeFromPtm(law: VascularPvLaw, Ptm: number): number {
  if (law.kind === "arterial") {
    const p0 = Math.max(law.P0, 1e-6);
    const p = Math.max(Ptm, -0.95 * p0);
    return Math.max(law.VsEff, 1e-6) * Math.log1p(p / p0);
  }
  if (law.kind === "linear") {
    return Math.max(law.C, 1e-6) * Ptm;
  }
  return venousStressedVolume3(law, Ptm);
}

export function complianceFromPtm(law: VascularPvLaw, Ptm: number): number {
  if (law.kind === "arterial") {
    return Math.max(law.VsEff, 1e-6) / Math.max(Math.max(law.P0, 1e-6) + Ptm, 1e-6);
  }
  if (law.kind === "linear") {
    return Math.max(law.C, 1e-6);
  }
  return venousCompliance3(law, Ptm);
}

function venousCompliance3(law: Extract<VascularPvLaw, { kind: "venous3" }>, Ptm: number): number {
  const c = law.Ccoll
    + (law.Copen - law.Ccoll) * sigmoid((Ptm - law.Popen) / Math.max(law.dOpen, 1e-6))
    - (law.Copen - law.Cdist) * sigmoid((Ptm - law.Pstiff) / Math.max(law.dStiff, 1e-6));
  return Math.max(c, 1e-4);
}

function venousStressedVolume3(law: Extract<VascularPvLaw, { kind: "venous3" }>, Ptm: number): number {
  const dOpen = Math.max(law.dOpen, 1e-6);
  const dStiff = Math.max(law.dStiff, 1e-6);
  return law.Ccoll * Ptm
    + (law.Copen - law.Ccoll) * dOpen
      * (softplus((Ptm - law.Popen) / dOpen) - softplus((0 - law.Popen) / dOpen))
    - (law.Copen - law.Cdist) * dStiff
      * (softplus((Ptm - law.Pstiff) / dStiff) - softplus((0 - law.Pstiff) / dStiff));
}

function sigmoid(x: number): number {
  if (x >= 40) return 1;
  if (x <= -40) return 0;
  return 1 / (1 + Math.exp(-x));
}
