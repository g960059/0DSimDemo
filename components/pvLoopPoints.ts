import type { SimSample } from "@/engine/protocol";

export type PvLoopBeatRange = {
  start: number;
  end: number;
  closingIndex: number;
};

export type PvLoopRawPoint = {
  v: number;
  p: number;
};

export type PvLoopBeatData = {
  beatRange: PvLoopBeatRange;
  beatSampleCount: number;
  points: PvLoopRawPoint[];
  vMin: number;
  vMax: number;
};

export type EndSystolicPoint = {
  chamber: "LV" | "RV";
  v: number;
  p: number;
  pointIndex: number;
  elastanceMmHgPerMl: number;
  method: "max-elastance";
  quality: "ok" | "warning";
};

export type PvLoopDisplayBeatData = {
  currentBuffer: SimSample[];
  currentBeatData: PvLoopBeatData | null;
  previousBeatData: PvLoopBeatData | null;
};

export const chamberPVPoint = (d: SimSample, chamber: string): PvLoopRawPoint => {
  switch (chamber) {
    case "LV": return { v: d.VLV, p: d.LVP };
    case "LA": return { v: d.VLA, p: d.LAP };
    case "RV": return { v: d.VRV, p: d.RVP };
    case "RA": return { v: d.VRA, p: d.RAP };
    default: return { v: 0, p: 0 };
  }
};

export const lastCompleteBeatRange = (buf: SimSample[]): PvLoopBeatRange => {
  const phiNow = buf[buf.length - 1]?.phi ?? 0;
  const beatEnd = Math.floor(phiNow);
  if (beatEnd < 1) return { start: 0, end: buf.length, closingIndex: -1 };
  const beatStart = beatEnd - 1;
  let end = buf.length;
  while (end > 0 && buf[end - 1].phi > beatEnd) end--;
  let start = end;
  while (start > 0 && buf[start - 1].phi >= beatStart) start--;
  return { start, end, closingIndex: end < buf.length ? end : -1 };
};

export const pvLoopBeatData = (buf: SimSample[], chamber: string): PvLoopBeatData | null => {
  if (buf.length < 2) return null;
  const beatRange = lastCompleteBeatRange(buf);
  const beatSampleCount = beatRange.end - beatRange.start + (beatRange.closingIndex >= 0 ? 1 : 0);
  const points: PvLoopRawPoint[] = [];
  let vMin = Infinity;
  let vMax = -Infinity;

  const addPoint = (d: SimSample | undefined) => {
    if (!d) return;
    const { v, p } = chamberPVPoint(d, chamber);
    vMin = Math.min(vMin, v);
    vMax = Math.max(vMax, v);
    points.push({ v, p });
  };

  for (let i = beatRange.start; i < beatRange.end; i++) {
    addPoint(buf[i]);
  }
  if (beatRange.closingIndex >= 0) {
    addPoint(buf[beatRange.closingIndex]);
  }
  if (points.length < 2) return null;

  return {
    beatRange,
    beatSampleCount,
    points,
    vMin,
    vMax,
  };
};

export const pvLoopEndSystolicPoint = (
  beatData: PvLoopBeatData,
  chamber: string,
  v0Ml = 0,
): EndSystolicPoint | null => {
  if (chamber !== "LV" && chamber !== "RV") return null;
  let best: EndSystolicPoint | null = null;
  for (let i = 0; i < beatData.points.length; i++) {
    const point = beatData.points[i];
    const volumeMargin = point.v - v0Ml;
    if (!(volumeMargin > 1) || !Number.isFinite(point.p) || !Number.isFinite(point.v)) continue;
    const elastance = point.p / volumeMargin;
    if (!Number.isFinite(elastance)) continue;
    if (best && elastance <= best.elastanceMmHgPerMl) continue;
    best = {
      chamber,
      v: point.v,
      p: point.p,
      pointIndex: i,
      elastanceMmHgPerMl: elastance,
      method: "max-elastance",
      quality: volumeMargin < 5 || point.p < 0 ? "warning" : "ok",
    };
  }
  return best;
};

export const isDrawablePvLoopBeatData = (chamber: string, beatData: PvLoopBeatData): boolean => (
  chamber !== "LA" || beatData.beatSampleCount >= 16
);

export const pvLoopCurrentBufferForDisplay = (
  buf: SimSample[],
  waveformBreakT?: number,
): SimSample[] => (
  waveformBreakT === undefined
    ? buf
    : buf.filter((sample) => sample.t >= waveformBreakT)
);

export const isCompletePvLoopBeatAfterBufferStart = (
  buf: SimSample[],
  beatData: PvLoopBeatData,
): boolean => {
  const firstPhi = buf[0]?.phi;
  const latestPhi = buf.at(-1)?.phi;
  if (!Number.isFinite(firstPhi) || !Number.isFinite(latestPhi)) return false;
  if (beatData.beatRange.closingIndex < 0) return false;
  const beatEnd = Math.floor(latestPhi);
  const beatStart = beatEnd - 1;
  const firstCompleteBeatStart = Math.ceil(firstPhi - 1e-9);
  return beatStart >= firstCompleteBeatStart;
};

export const pvLoopBeatDataForDisplay = ({
  buffer,
  previousBuffer,
  waveformBreakT,
  chamber,
  showPrevious,
}: {
  buffer: SimSample[];
  previousBuffer?: SimSample[];
  waveformBreakT?: number;
  chamber: string;
  showPrevious: boolean;
}): PvLoopDisplayBeatData => {
  const currentBuffer = pvLoopCurrentBufferForDisplay(buffer, waveformBreakT);
  const currentCandidate = pvLoopBeatData(currentBuffer, chamber);
  const currentBeatData = (
    currentCandidate
    && (
      waveformBreakT === undefined
      || isCompletePvLoopBeatAfterBufferStart(currentBuffer, currentCandidate)
    )
  ) ? currentCandidate : null;
  return {
    currentBuffer,
    currentBeatData,
    previousBeatData: showPrevious && previousBuffer
      ? pvLoopBeatData(previousBuffer, chamber)
      : null,
  };
};
