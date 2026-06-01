import { expClamped, softplus } from "@/engine/math";

export type PericardiumParams = {
  enabled: boolean;
  pressureScaleMmHg: number;
  slackVolumeMl: number;
  volumeScaleMl: number;
  softnessMl: number;
  biasMmHg: number;
  fluidMl: number;
};

export type PericardiumInput = {
  VLV: number;
  VRV: number;
  VLA: number;
  VRA: number;
  Pth: number;
};

export type PericardiumResult = {
  Pperi: number;
  Ppc: number;
  Vheart: number;
};

export function pericardialPressure(
  input: PericardiumInput,
  params: PericardiumParams,
): PericardiumResult {
  const Vheart = input.VLV + input.VRV + input.VLA + input.VRA + Math.max(params.fluidMl, 0);
  if (!params.enabled) {
    return { Pperi: input.Pth, Ppc: 0, Vheart };
  }

  const softness = Math.max(params.softnessMl, 1e-6);
  const volumeScale = Math.max(params.volumeScaleMl, 1e-6);
  const dVplus = softness * softplus((Vheart - params.slackVolumeMl) / softness);
  const elastic = Math.max(params.pressureScaleMmHg, 0) * (expClamped(dVplus / volumeScale) - 1);
  const Ppc = params.biasMmHg + elastic;
  return { Pperi: input.Pth + Ppc, Ppc, Vheart };
}
