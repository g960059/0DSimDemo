import { defaultParams } from "@/engine/ModelCore";
import type { CoreRuntimeParams, ParameterPatch } from "@/engine/protocol";

export type ParameterScale = "linear" | "log";

export type ParameterDimension = {
  id: string;
  label: string;
  min: number;
  max: number;
  scale: ParameterScale;
  defaultValue: number;
  apply: (params: Partial<CoreRuntimeParams>, value: number) => Partial<CoreRuntimeParams>;
};

export type CandidateValue = {
  id: string;
  value: number;
};

export type CandidatePatch = {
  id: string;
  label?: string;
  values: CandidateValue[];
  patch: ParameterPatch;
};

const base = defaultParams();

export const DEFAULT_FITTING_DIMENSIONS: ParameterDimension[] = [
  directDimension("lvTmaxScale", "LV active-stress scale", 0.75, 1.25, "linear"),
  directDimension("rvTmaxScale", "RV active-stress scale", 0.75, 1.35, "linear"),
  directDimension("avDelaySec", "AV delay", 0.04, 0.20, "linear"),
  directDimension("MV_R", "Mitral linear loss", 0.0015, 0.0045, "linear"),
  directDimension("MV_B", "Mitral quadratic loss", 1e-6, 2e-5, "log"),
  edgeDimension("pvein-la-r", "PVein_LA ostial R", "PVein_LA", "R", 0.020, 0.050, "linear"),
  edgeDimension("pvein-la-l", "PVein_LA ostial inertance", "PVein_LA", "pvOstialInertanceL", 0, 0.002, "linear"),
];

export function makeCandidatePatch(
  id: string,
  values: CandidateValue[],
  dimensions: ParameterDimension[] = DEFAULT_FITTING_DIMENSIONS,
): CandidatePatch {
  const byId = new Map(dimensions.map((dimension) => [dimension.id, dimension]));
  const patch = values.reduce<Partial<CoreRuntimeParams>>((acc, item) => {
    const dimension = byId.get(item.id);
    if (!dimension) throw new Error(`Unknown fitting dimension: ${item.id}`);
    return dimension.apply(acc, item.value);
  }, {});
  return {
    id,
    values,
    patch,
  };
}

export function mergeParameterPatch(
  params: Partial<CoreRuntimeParams>,
  patch: ParameterPatch,
): Partial<CoreRuntimeParams> {
  return {
    ...params,
    ...patch,
    nodeOverrides: mergeNestedNumeric(params.nodeOverrides, patch.nodeOverrides),
    edgeOverrides: mergeNestedNumeric(params.edgeOverrides, patch.edgeOverrides),
  };
}

export function sampleDimensionValues(dimension: ParameterDimension, count: number): number[] {
  const n = Math.max(1, Math.floor(count));
  if (n === 1) return [dimension.defaultValue];
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const frac = i / (n - 1);
    if (dimension.scale === "log") {
      const lo = Math.log(dimension.min);
      const hi = Math.log(dimension.max);
      out.push(Math.exp(lo + frac * (hi - lo)));
    } else {
      out.push(dimension.min + frac * (dimension.max - dimension.min));
    }
  }
  return out;
}

export function oneAtATimeCandidates(
  dimensions: ParameterDimension[] = DEFAULT_FITTING_DIMENSIONS,
  samplesPerDimension = 5,
): CandidatePatch[] {
  const candidates: CandidatePatch[] = [];
  for (const dimension of dimensions) {
    for (const value of sampleDimensionValues(dimension, samplesPerDimension)) {
      candidates.push(makeCandidatePatch(`${dimension.id}=${roundForId(value)}`, [{ id: dimension.id, value }], dimensions));
    }
  }
  return candidates;
}

function directDimension(
  key: keyof CoreRuntimeParams,
  label: string,
  min: number,
  max: number,
  scale: ParameterScale,
): ParameterDimension {
  const defaultValue = Number(base[key]);
  return {
    id: String(key),
    label,
    min,
    max,
    scale,
    defaultValue,
    apply: (params, value) => ({ ...params, [key]: value }),
  };
}

function edgeDimension(
  id: string,
  label: string,
  edgeName: string,
  field: string,
  min: number,
  max: number,
  scale: ParameterScale,
): ParameterDimension {
  return {
    id,
    label,
    min,
    max,
    scale,
    defaultValue: field === "R" ? 0.030 : 0,
    apply: (params, value) => ({
      ...params,
      edgeOverrides: {
        ...(params.edgeOverrides ?? {}),
        [edgeName]: {
          ...(params.edgeOverrides?.[edgeName] ?? {}),
          [field]: value,
          ...(edgeName === "PVein_LA" && field === "R" ? { pvOstialResistanceR: value } : {}),
        },
      },
    }),
  };
}

function mergeNestedNumeric<T extends Record<string, Record<string, any>> | undefined>(
  a: T,
  b: T,
): T {
  if (!a && !b) return undefined as T;
  const out: Record<string, Record<string, any>> = { ...(a ?? {}) };
  for (const [outerKey, inner] of Object.entries(b ?? {})) {
    out[outerKey] = {
      ...(out[outerKey] ?? {}),
      ...inner,
    };
  }
  return out as T;
}

function roundForId(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toPrecision(4);
}
