import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  runFullLeftAVPlaneResidualRoutingBenchV1,
  runFullLeftAVPlaneResidualRoutingTraceV1,
} from "@/engine/mechanics2/benches/FullLeftAVPlaneResidualRoutingBench";
import type { LeftHeartSubsystemSampleV2 } from "@/engine/mechanics2/subsystems/LeftHeartSubsystemV2";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), "../..");
const outPath = resolve(
  repoRoot,
  "data/mechanics2/visuals/full-left-av-plane-normal-hr75-fast-review.svg",
);

const COLORS = [
  "#38bdf8",
  "#f472b6",
  "#fbbf24",
  "#34d399",
  "#c084fc",
  "#fb7185",
  "#67e8f9",
  "#a3e635",
  "#f97316",
  "#e5e7eb",
] as const;

const report = runFullLeftAVPlaneResidualRoutingBenchV1({ profileIds: ["normal-hr75"] });
const rows = report.rows.filter((row) => row.profileId === "normal-hr75");
const pinnedMechanismIds = new Set([
  "v23-wall-v16area-lvrecv3-traj20-mvimplicit02-pr160-fixed8-pv36-mvlite",
  "v24-wall-v16receiverstate-lvrecv3-rpathslow-traj20-mvimplicit02-pr160-fixed8-pv36-mvlite",
  "v25-wall-v16lvreceivercap-lvrecv3-rcap-traj20-mvimplicit02-pr160-fixed8-pv36-mvlite",
  "v25-wall-v16lvreceivercap-lvrecv3-rcapslow-traj20-mvimplicit02-pr160-fixed8-pv36-mvlite",
  "v26-wall-v16phaselock02-lvrecv3-rcap-traj20-mvimplicit02-pr160-fixed8-pv36-mvlite",
  "v26-wall-v16phaselock04-lvrecv3-rcap-traj20-mvimplicit02-pr160-fixed8-pv36-mvlite",
  "v26-wall-v16phaselock085-lvrecv3-rcap-traj20-mvimplicit02-pr160-fixed8-pv36-mvlite",
  "v26-wall-v16phaselock085-lvrecv3-rcapslow-traj20-mvimplicit02-pr160-fixed8-pv36-mvlite",
  "v27-wall-v16phaselock02-cap125-pr180-lvrecv3-rcap-traj20-mvimplicit02-pv52-mvlite",
  "v27-wall-v16phaselock02-cap150-pr200-lvrecv3-rcap-traj20-mvimplicit02-pv64-mvlite",
  "v27-wall-v16phaselock015-cap150-pr200-lvrecv3-rcapslow-traj20-mvimplicit02-pv64-mvlite",
  "v27-wall-v16phaselock03-cap150-pr200-lvrecv4-rcap-traj20-mvimplicit02-pv64-mvlite",
  "v27-wall-v16phaselock02-cap175-pr220-lvrecv4-rcapfast-traj20-mvimplicit02-pv72-mvlite",
  "v28-wall-v16visco2-phaselock02-lvrecv3-rcap-traj20-mvimplicit02-pr160-fixed8-pv36-mvlite",
  "v28-wall-v16visco25-phaselock02-lvrecv3-rcap-traj20-mvimplicit02-pr160-fixed8-pv36-mvlite",
  "v28-wall-v16visco25-viscosoft-phaselock02-lvrecv3-rcap-traj20-mvimplicit02-pr160-fixed8-pv36-mvlite",
  "v28-wall-v16visco3-phaselock02-lvrecv3-rcap-traj20-mvimplicit02-pr160-fixed8-pv36-mvlite",
  "v28-wall-v16visco3-viscosoft-phaselock02-lvrecv3-rcap-traj20-mvimplicit02-pr160-fixed8-pv36-mvlite",
  "v28-wall-v16visco35-phaselock02-lvrecv3-rcap-traj20-mvimplicit02-pr160-fixed8-pv36-mvlite",
  "v28-wall-v16visco35-viscosoft-phaselock02-lvrecv3-rcap-traj20-mvimplicit02-pr160-fixed8-pv36-mvlite",
  "v28-wall-v16visco4-phaselock02-lvrecv3-rcap-traj20-mvimplicit02-pr160-fixed8-pv36-mvlite",
  "v28-wall-v16visco6-phaselock02-lvrecv3-rcap-traj20-mvimplicit02-pr160-fixed8-pv36-mvlite",
  "v28-wall-v16visco8-phaselock02-lvrecv3-rcap-traj20-mvimplicit02-pr160-fixed8-pv36-mvlite",
  "v28-wall-v16visco4-phaselock04-lvrecv3-rcap-traj20-mvimplicit02-pr160-fixed8-pv36-mvlite",
  "v28-wall-v16visco6-phaselock015-lvrecv3-rcapslow-traj20-mvimplicit02-pr160-fixed8-pv36-mvlite",
  "v28-wall-v16visco4-viscosoft-phaselock02-lvrecv3-rcap-traj20-mvimplicit02-pr160-fixed8-pv36-mvlite",
  "v28-wall-v16visco6-viscosoft-phaselock02-lvrecv3-rcap-traj20-mvimplicit02-pr160-fixed8-pv36-mvlite",
  "v29-wall-v16pathmem60-relief12-phaselock02-lvrecv3-rcap-traj20-mvimplicit02-pr160-fixed8-pv36-mvlite",
  "v29-wall-v16pathmem75-relief16-phaselock02-lvrecv3-rcap-traj20-mvimplicit02-pr160-fixed8-pv36-mvlite",
  "v29-wall-v16pathmem90-relief20-phaselock02-lvrecv3-rcap-traj20-mvimplicit02-pr160-fixed8-pv36-mvlite",
  "v29-wall-v16pathmem90-relief24-softpath-phaselock02-lvrecv3-rcap-traj20-mvimplicit02-pr160-fixed8-pv36-mvlite",
  "v29-wall-v16pathmem100-relief28-softpath-phaselock02-lvrecv3-rcap-traj20-mvimplicit02-pr160-fixed8-pv36-mvlite",
  "v29-wall-v16pathmem75-relief16-phaselock04-lvrecv3-rcap-traj20-mvimplicit02-pr160-fixed8-pv36-mvlite",
  "v29-wall-v16pathmem90-relief20-phaselock02-lvrecv4-rcapfast-traj20-mvimplicit02-pr160-fixed8-pv36-mvlite",
  "v29-wall-v16pathmem75-relief16-longmemory-phaselock02-lvrecv3-rcap-traj20-mvimplicit02-pr160-fixed8-pv36-mvlite",
  "v30-wall-v16cup-visco4-pathmem90-relief45-phaselock04-lvrecv3-rcap-traj20-mvimplicit02-pr170-fixed10-pv44-mvloss",
  "v30-wall-v16cup-visco6-pathmem90-relief45-phaselock04-lvrecv3-rcap-traj20-mvimplicit02-pr170-fixed10-pv44-mvloss",
  "v30-wall-v16cup-visco6-pathmem100-relief60-phaselock04-lvrecv3-rcap-traj20-mvimplicit02-pr180-fixed12-pv48-mvloss",
  "v30-wall-v16cup-visco8-pathmem100-relief60-phaselock04-lvrecv3-rcap-traj20-mvimplicit02-pr180-fixed12-pv48-mvloss",
  "v30-wall-v16cup-visco6-pathmem90-relief45-phaselock06-lvrecv4-rcapfast-traj20-mvimplicit02-pr170-fixed10-pv44-mvloss",
  "v30-wall-v16cup-visco8-pathmem90-relief45-phaselock04-lvrecv4-rcapfast-traj20-mvimplicit02-pr170-fixed10-pv44-mvloss",
  "v30-wall-v16cup-visco6-pathmem75-relief36-cupsoft-phaselock04-lvrecv3-rcapslow-traj20-mvimplicit02-pr170-fixed10-pv44-mvloss",
  "v30-wall-v16cup-visco4-pathmem75-relief36-cupsoft-phaselock04-lvrecv3-rcapslow-traj20-mvimplicit02-pr170-fixed10-pv44-mvloss",
  "v31-wall-v16cap125-pathmem75-relief16-phaselock04-lvrecv3-rcap-traj20-mvimplicit02-pr180-fixed10-pv44-mvlite",
  "v31-wall-v16cap125-pathmem90-relief20-phaselock04-lvrecv3-rcap-traj20-mvimplicit02-pr180-fixed10-pv44-mvlite",
  "v31-wall-v16cap150-pathmem75-relief16-phaselock04-lvrecv3-rcap-traj20-mvimplicit02-pr200-fixed10-pv52-mvlite",
  "v31-wall-v16cap150-pathmem90-relief20-phaselock04-lvrecv3-rcap-traj20-mvimplicit02-pr200-fixed10-pv52-mvlite",
  "v31-wall-v16cap125-visco25-pathmem75-relief16-phaselock04-lvrecv3-rcap-traj20-mvimplicit02-pr180-fixed10-pv44-mvlite",
  "v31-wall-v16cap125-visco3-pathmem75-relief12-phaselock04-lvrecv3-rcapslow-traj20-mvimplicit02-pr180-fixed10-pv44-mvlite",
  "v31-wall-v16cap150-visco25-pathmem75-relief16-phaselock03-lvrecv2-rcapslow-traj20-mvimplicit02-pr200-fixed10-pv52-mvlite",
  "v31-wall-v16cap125-pathmem100-relief20-softpath-phaselock04-lvrecv3-rcap-traj20-mvimplicit02-pr180-fixed10-pv44-mvlite",
  "v32-wall-v16lvref8-cap125-visco3-pathmem75-relief12-phaselock04-lvrecv3-rcapslow-traj20-mvimplicit02-pr180-fixed10-pv44-mvlite",
  "v32-wall-v16lvref12-cap125-visco3-pathmem75-relief12-phaselock04-lvrecv3-rcapslow-traj20-mvimplicit02-pr180-fixed10-pv44-mvlite",
  "v32-wall-v16lvref16-cap125-visco3-pathmem75-relief12-phaselock04-lvrecv3-rcapslow-traj20-mvimplicit02-pr180-fixed10-pv44-mvlite",
  "v32-wall-v16lvref12-cap150-visco25-pathmem75-relief16-phaselock04-lvrecv3-rcapslow-traj20-mvimplicit02-pr200-fixed10-pv52-mvlite",
  "v32-wall-v16lvref16-cap150-visco25-pathmem75-relief16-phaselock04-lvrecv3-rcap-traj20-mvimplicit02-pr200-fixed10-pv52-mvlite",
  "v32-wall-v16lvref20-cap150-visco25-pathmem90-relief20-phaselock04-lvrecv3-rcap-traj20-mvimplicit02-pr200-fixed10-pv52-mvlite",
  "v32-wall-v16lvref80-cap125-visco3-pathmem75-relief12-phaselock04-lvrecv3-rcapslow-traj20-mvimplicit02-pr180-fixed10-pv44-mvlite",
  "v32-wall-v16lvref32-cap125-visco3-pathmem75-relief12-phaselock04-lvrecv3-rcapslow-traj20-mvimplicit02-pr180-fixed10-pv44-mvlite",
  "v32-wall-v16lvref48-cap125-visco3-pathmem75-relief12-phaselock04-lvrecv3-rcapslow-traj20-mvimplicit02-pr180-fixed10-pv44-mvlite",
  "v32-wall-v16lvref52-cap125-visco3-pathmem75-relief12-phaselock04-lvrecv3-rcapslow-traj20-mvimplicit02-pr180-fixed10-pv44-mvlite",
  "v32-wall-v16lvref56-cap125-visco3-pathmem75-relief12-phaselock04-lvrecv3-rcapslow-traj20-mvimplicit02-pr180-fixed10-pv44-mvlite",
  "v32-wall-v16lvref48-cap125-visco3-pathmem75-relief12-phaselock04-lvrecv6-rcapslow-traj20-mvimplicit02-pr180-fixed10-pv44-mvlite",
  "v32-wall-v16lvref56-cap125-visco3-pathmem75-relief12-phaselock04-lvrecv6-rcapslow-traj20-mvimplicit02-pr180-fixed10-pv44-mvlite",
  "v32-wall-v16lvref48-cap125-visco3-pathmem75-relief12-phaselock04-lvrecv8-rcapslow-traj20-mvimplicit02-pr180-fixed10-pv44-mvlite",
  "v32-wall-v16lvref56-cap125-visco3-pathmem75-relief12-phaselock04-lvrecv8-rcapslow-traj20-mvimplicit02-pr180-fixed10-pv44-mvlite",
  "v32-wall-v16lvref48-cap125-visco3-pathmem75-relief12-phaselock04-lvrecv12-rcapslow-traj20-mvimplicit02-pr180-fixed10-pv44-mvlite",
  "v32-wall-v16lvref56-cap125-visco3-pathmem75-relief12-phaselock04-lvrecv12-rcapslow-traj20-mvimplicit02-pr180-fixed10-pv44-mvlite",
	  "v32-wall-v16lvref48-cap125-visco3-pathmem75-relief12-phaselock04-lvrecv16-rcapslow-traj20-mvimplicit02-pr180-fixed10-pv44-mvlite",
	  "v32-wall-v16lvref56-cap125-visco3-pathmem75-relief12-phaselock04-lvrecv16-rcapslow-traj20-mvimplicit02-pr180-fixed10-pv44-mvlite",
	  "v32-wall-v16lvref60-cap125-visco3-pathmem75-relief12-phaselock04-lvrecv3-rcapslow-traj20-mvimplicit02-pr180-fixed10-pv44-mvlite",
	  "v32-wall-v16lvref64-cap125-visco3-pathmem75-relief12-phaselock04-lvrecv3-rcapslow-traj20-mvimplicit02-pr180-fixed10-pv44-mvlite",
	  "v32-wall-v16lvref120-cap125-visco3-pathmem75-relief12-phaselock04-lvrecv3-rcapslow-traj20-mvimplicit02-pr180-fixed10-pv44-mvlite",
	  "v32-wall-v16lvref80-cap125-visco3-pathmem90-relief16-phaselock04-lvrecv3-rcapslow-traj20-mvimplicit02-pr180-fixed10-pv44-mvlite",
	  "v32-wall-v16lvref120-cap125-visco3-pathmem90-relief16-phaselock04-lvrecv3-rcapslow-traj20-mvimplicit02-pr180-fixed10-pv44-mvlite",
	  "v33-wall-v16lvref48-cap125-visco6-pathmem90-relief45-phaselock04-lvrecv8-rpathslow-rcapslow-traj20-mvimplicit02-pr170-fixed10-pv44-mvlite",
	  "v33-wall-v16lvref56-cap125-visco6-pathmem90-relief45-phaselock04-lvrecv8-rpathslow-rcapslow-traj20-mvimplicit02-pr170-fixed10-pv44-mvlite",
	  "v33-wall-v16lvref48-cap125-visco6-pathmem90-relief45-phaselock04-lvrecv12-rpathslow-rcapslow-traj20-mvimplicit02-pr170-fixed10-pv44-mvlite",
	  "v33-wall-v16lvref56-cap125-visco6-pathmem90-relief45-phaselock04-lvrecv12-rpathslow-rcapslow-traj20-mvimplicit02-pr170-fixed10-pv44-mvlite",
	  "v33-wall-v16lvref48-cap125-visco4-pathmem75-relief36-cupsoft-phaselock04-lvrecv8-rpathslow-rcapslow-traj20-mvimplicit02-pr170-fixed10-pv44-mvlite",
	  "v33-wall-v16lvref56-cap125-visco4-pathmem75-relief36-cupsoft-phaselock04-lvrecv12-rpathslow-rcapslow-traj20-mvimplicit02-pr170-fixed10-pv44-mvlite",
]);
void pinnedMechanismIds;
const eligibleRows = rows
  .filter((row) =>
    isCurrentNormalFirstFamily(row.family)
    && row.sourceSurfacePass
	    && row.mvfClean
	    && row.phaseOrientedPvPass
	    && row.hiddenVolumeClean
	    && row.phasePv.vLoopArea >= 40
	    && row.phasePv.postOpeningEarlyPressureDropMmHg > 1.0
	    && row.phasePv.postOpeningEarlyVolumeDropMl > 0.8
    && !row.phasePv.failureReasons.includes("mv-opening-starts-upward")
    && !row.phasePv.failureReasons.includes("mv-opening-conduit-start-not-downstroke")
  );
const visualAnchorIds = [
  "v29-wall-v16pathmem75-relief16-phaselock04-lvrecv3-rcap-traj20-mvimplicit02-pr160-fixed8-pv36-mvlite",
  "v30-wall-v16cup-visco6-pathmem90-relief45-phaselock04-lvrecv3-rcap-traj20-mvimplicit02-pr170-fixed10-pv44-mvloss",
  "v30-wall-v16cup-visco6-pathmem75-relief36-cupsoft-phaselock04-lvrecv3-rcapslow-traj20-mvimplicit02-pr170-fixed10-pv44-mvloss",
  "v31-wall-v16cap125-visco3-pathmem75-relief12-phaselock04-lvrecv3-rcapslow-traj20-mvimplicit02-pr180-fixed10-pv44-mvlite",
  "v32-wall-v16lvref56-cap125-visco3-pathmem75-relief12-phaselock04-lvrecv16-rcapslow-traj20-mvimplicit02-pr180-fixed10-pv44-mvlite",
  "v32-wall-v16lvref48-cap125-visco3-pathmem75-relief12-phaselock04-lvrecv16-rcapslow-traj20-mvimplicit02-pr180-fixed10-pv44-mvlite",
  "v32-wall-v16lvref48-cap125-visco3-pathmem75-relief12-phaselock04-lvrecv3-rcapslow-traj20-mvimplicit02-pr180-fixed10-pv44-mvlite",
  "v33-wall-v16lvref48-cap125-visco6-pathmem90-relief45-phaselock04-lvrecv8-rpathslow-rcapslow-traj20-mvimplicit02-pr170-fixed10-pv44-mvlite",
  "v33-wall-v16lvref56-cap125-visco4-pathmem75-relief36-cupsoft-phaselock04-lvrecv12-rpathslow-rcapslow-traj20-mvimplicit02-pr170-fixed10-pv44-mvlite",
  "v28-wall-v16visco3-phaselock02-lvrecv3-rcap-traj20-mvimplicit02-pr160-fixed8-pv36-mvlite",
] as const;

const visualAnchorRows = visualAnchorIds
  .map((variantId) => rows.find((row) =>
    row.variantId === variantId
    && row.hiddenVolumeClean
    && row.phaseOrientedPvPass
    && !row.phasePv.failureReasons.includes("mv-opening-starts-upward")
    && !row.phasePv.failureReasons.includes("mv-opening-conduit-start-not-downstroke")
  ))
  .filter((row): row is (typeof rows)[number] => row != null);

const topCleanRows = eligibleRows
  .sort((a, b) =>
    b.phasePv.conduitBellyDepthMmHg - a.phasePv.conduitBellyDepthMmHg
    || b.phasePv.meanReservoirConduitSeparationMmHg - a.phasePv.meanReservoirConduitSeparationMmHg
    || b.phasePv.vLoopArea - a.phasePv.vLoopArea
    || b.phasePv.postOpeningEarlyPressureDropMmHg - a.phasePv.postOpeningEarlyPressureDropMmHg
  )
  .slice(0, 4);

const candidateRows = uniqueRowsByVariantId([
  ...visualAnchorRows,
  ...topCleanRows,
]).slice(0, 10);

const traces = candidateRows.map((row, index) => ({
  row,
  color: COLORS[index % COLORS.length]!,
  samples: runFullLeftAVPlaneResidualRoutingTraceV1("normal-hr75", row.variantId),
}));

const width = 1500;
const height = 870;
const svg: string[] = [];
svg.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`);
svg.push(`<rect width="${width}" height="${height}" fill="#070b13"/>`);
svg.push(`<text x="34" y="34" fill="#e5e7eb" font-family="Inter,Arial,sans-serif" font-size="24" font-weight="700">Normal HR75 fast LA AV-plane residual review</text>`);
svg.push(`<text x="34" y="60" fill="#9ca3af" font-family="Inter,Arial,sans-serif" font-size="13">Only normal-hr75 is evaluated here. Candidate traces require source surface, MVF, blood-volume PV phase, hidden-volume cleanliness, and blood v-loop area >= 40 for visual triage; prime readbacks are ignored.</text>`);
svg.push(`<text x="34" y="84" fill="#cbd5e1" font-family="Inter,Arial,sans-serif" font-size="13">Shown rows: ${candidateRows.length}; fast report rows: ${rows.length}. Includes dirty shape anchors when labeled; this artifact is a visual research shortcut, not broad-envelope acceptance.</text>`);

if (traces.length === 0) {
  svg.push(`<text x="34" y="138" fill="#fca5a5" font-family="Inter,Arial,sans-serif" font-size="16">No normal-hr75 candidate survived the visual prefilter.</text>`);
} else {
  renderLegend(svg, traces, 34, 116);
  renderPvPanel(svg, traces, 34, 248, 780, 440, "LA blood PV (ledger volume only)", (sample) => sample.acceptedLaVolumeMl);
  renderTimePanel(svg, traces, 860, 248, 560, 206, "QMV / QPV", [
    { key: "qMvMlPerSec", label: "QMV", dash: "" },
    { key: "qPulmonaryVenousMlPerSec", label: "QPV", dash: "5 4" },
  ]);
  renderPressurePanel(svg, traces, 860, 482, 560, 206);
}

svg.push(`</svg>`);
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${svg.join("\n")}\n`);
console.log(outPath.replace(`${repoRoot}/`, ""));

type Trace = {
  readonly row: (typeof report.rows)[number];
  readonly color: string;
  readonly samples: readonly LeftHeartSubsystemSampleV2[];
};

function renderLegend(out: string[], traces: readonly Trace[], x: number, y: number): void {
  traces.forEach((trace, index) => {
    const yy = y + index * 17;
    out.push(`<line x1="${x}" y1="${yy}" x2="${x + 24}" y2="${yy}" stroke="${trace.color}" stroke-width="3"/>`);
    const status = trace.row.sourceSurfacePass && trace.row.mvfClean ? "clean" : "dirty-shape-anchor";
    out.push(`<text x="${x + 32}" y="${yy + 4}" fill="#cbd5e1" font-family="Inter,Arial,sans-serif" font-size="12">${escapeXml(trace.row.variantId)} | ${status} | blood vArea ${trace.row.phasePv.vLoopArea.toFixed(1)} | sep ${trace.row.phasePv.meanReservoirConduitSeparationMmHg.toFixed(2)} | belly ${trace.row.phasePv.conduitBellyDepthMmHg.toFixed(2)} | arc ${trace.row.phasePv.conduitArcLengthOverChord.toFixed(2)} | postMVO ${trace.row.phasePv.postOpeningEarlyPressureDropMmHg.toFixed(2)}mmHg/${trace.row.phasePv.postOpeningEarlyVolumeDropMl.toFixed(2)}mL</text>`);
  });
}

function isCurrentNormalFirstFamily(family: string): boolean {
  return family === "full-left-v16-area-receiver-hysteresis-v23"
    || family === "full-left-v16-receiver-state-hysteresis-v24"
    || family === "full-left-v16-lvreceiver-capacity-hysteresis-v25"
    || family === "full-left-v16-phase-locked-avplane-hysteresis-v26"
    || family === "full-left-normal-first-large-vloop-hysteresis-v27"
    || family === "full-left-normal-first-wall-viscoelastic-hysteresis-v28"
    || family === "full-left-normal-first-path-state-hysteresis-v29"
    || family === "full-left-normal-first-conduit-cup-hysteresis-v30"
    || family === "full-left-normal-first-capacity-path-hysteresis-v31"
    || family === "full-left-normal-first-lv-reference-receiver-v32";
}

function renderPvPanel(
  out: string[],
  traces: readonly Trace[],
  x: number,
  y: number,
  w: number,
  h: number,
  title: string,
  volumeFor: (sample: LeftHeartSubsystemSampleV2) => number,
): void {
  const all = traces.flatMap((trace) => trace.samples);
  const xs = all.map(volumeFor);
  const ys = all.map((sample) => sample.lapMmHg);
  const sx = scaleFor(xs, x, w);
  const sy = scaleFor(ys, y + h, -h);
  panelFrame(out, x, y, w, h, title);
  for (const [traceIndex, trace] of traces.entries()) {
    const openingIndex = findMvOpeningIndex(trace.samples);
    const closureIndex = openingIndex == null ? null : findMvClosureIndexAfter(trace.samples, openingIndex);
    if (openingIndex != null && closureIndex != null) {
      const opening = trace.samples[openingIndex]!;
      const closure = trace.samples[closureIndex]!;
      out.push(`<line x1="${sx(volumeFor(closure)).toFixed(1)}" y1="${sy(closure.lapMmHg).toFixed(1)}" x2="${sx(volumeFor(opening)).toFixed(1)}" y2="${sy(opening.lapMmHg).toFixed(1)}" stroke="${trace.color}" stroke-width="1" stroke-dasharray="4 4" opacity="0.42"/>`);
      out.push(`<circle cx="${sx(volumeFor(opening)).toFixed(1)}" cy="${sy(opening.lapMmHg).toFixed(1)}" r="4" fill="${trace.color}" stroke="#020617" stroke-width="1.2"/>`);
      out.push(`<circle cx="${sx(volumeFor(closure)).toFixed(1)}" cy="${sy(closure.lapMmHg).toFixed(1)}" r="4" fill="#020617" stroke="${trace.color}" stroke-width="1.6"/>`);
    }
    out.push(`<path d="${pathFor(trace.samples, (sample) => sx(volumeFor(sample)), (sample) => sy(sample.lapMmHg))}" fill="none" stroke="${trace.color}" stroke-width="${traceIndex === 0 ? 1.6 : 1.2}" opacity="${traceIndex === 0 ? 0.32 : 0.18}"/>`);
    if (traceIndex === 0 && openingIndex != null && closureIndex != null) {
      renderPhaseSegments(out, trace.samples, openingIndex, closureIndex, (sample) => sx(volumeFor(sample)), (sample) => sy(sample.lapMmHg));
    }
  }
  out.push(`<text x="${x + w - 270}" y="${y + 25}" fill="#60a5fa" font-family="Inter,Arial,sans-serif" font-size="11">reservoir</text>`);
  out.push(`<text x="${x + w - 194}" y="${y + 25}" fill="#fb923c" font-family="Inter,Arial,sans-serif" font-size="11">conduit</text>`);
  out.push(`<text x="${x + w - 128}" y="${y + 25}" fill="#d1d5db" font-family="Inter,Arial,sans-serif" font-size="11">pumping</text>`);
}

function renderPhaseSegments(
  out: string[],
  samples: readonly LeftHeartSubsystemSampleV2[],
  openingIndex: number,
  closureIndex: number,
  xFor: (sample: LeftHeartSubsystemSampleV2) => number,
  yFor: (sample: LeftHeartSubsystemSampleV2) => number,
): void {
  const aWaveStartIndex = findYValleyIndex(samples, openingIndex, closureIndex)
    ?? findIndexAfterTheta(samples, openingIndex, 0.80)
    ?? Math.floor(samples.length * 0.80);
  const reservoir = cyclicSegment(samples, closureIndex, openingIndex);
  const conduit = cyclicSegment(samples, openingIndex, aWaveStartIndex);
  const pumping = cyclicSegment(samples, aWaveStartIndex, closureIndex);
  out.push(`<path d="${pathFor(reservoir, xFor, yFor)}" fill="none" stroke="#60a5fa" stroke-width="4.0" opacity="0.94"/>`);
  out.push(`<path d="${pathFor(conduit, xFor, yFor)}" fill="none" stroke="#fb923c" stroke-width="4.0" opacity="0.94"/>`);
  out.push(`<path d="${pathFor(pumping, xFor, yFor)}" fill="none" stroke="#d1d5db" stroke-width="3.6" opacity="0.90"/>`);
}

function formatNullable(value: number | null): string {
  return value == null ? "n/a" : value.toFixed(2);
}

function cyclicSegment<T>(items: readonly T[], startIndex: number, endIndex: number): readonly T[] {
  const segment: T[] = [];
  for (let step = 0; step <= items.length; step++) {
    const index = (startIndex + step) % items.length;
    segment.push(items[index]!);
    if (index === endIndex) break;
  }
  return segment;
}

function findIndexAfterTheta(
  samples: readonly LeftHeartSubsystemSampleV2[],
  startIndex: number,
  theta: number,
): number | null {
  for (let step = 0; step < samples.length; step++) {
    const index = (startIndex + step) % samples.length;
    if (samples[index]!.theta >= theta) return index;
  }
  return null;
}

function findYValleyIndex(
  samples: readonly LeftHeartSubsystemSampleV2[],
  openingIndex: number,
  closureIndex: number,
): number | null {
  const conduit = cyclicSegment(samples, openingIndex, closureIndex)
    .filter((sample) => sample.theta >= samples[openingIndex]!.theta && sample.theta <= 0.88);
  if (conduit.length === 0) return null;
  const valley = conduit.reduce((best, sample) => sample.lapMmHg < best.lapMmHg ? sample : best, conduit[0]!);
  return samples.indexOf(valley);
}

function renderTimePanel(
  out: string[],
  traces: readonly Trace[],
  x: number,
  y: number,
  w: number,
  h: number,
  title: string,
  specs: readonly {
    readonly key: "qMvMlPerSec" | "qPulmonaryVenousMlPerSec";
    readonly label: string;
    readonly dash: string;
  }[],
): void {
  const ys = traces.flatMap((trace) => trace.samples.flatMap((sample) => specs.map((spec) => sample[spec.key])));
  const sx = (theta: number) => x + theta * w;
  const sy = scaleFor(ys, y + h, -h);
  panelFrame(out, x, y, w, h, title);
  for (const trace of traces) {
    for (const spec of specs) {
      out.push(`<path d="${pathFor(trace.samples, (sample) => sx(sample.theta), (sample) => sy(sample[spec.key]))}" fill="none" stroke="${trace.color}" stroke-width="${spec.key === "qMvMlPerSec" ? 2.0 : 1.2}" stroke-dasharray="${spec.dash}" opacity="${spec.key === "qMvMlPerSec" ? 0.86 : 0.45}"/>`);
    }
  }
}

function renderPressurePanel(out: string[], traces: readonly Trace[], x: number, y: number, w: number, h: number): void {
  const ys = traces.flatMap((trace) => trace.samples.flatMap((sample) => [sample.lapMmHg, sample.lvpMmHg]));
  const sx = (theta: number) => x + theta * w;
  const sy = scaleFor(ys, y + h, -h);
  panelFrame(out, x, y, w, h, "LAP / LVP");
  for (const trace of traces) {
    out.push(`<path d="${pathFor(trace.samples, (sample) => sx(sample.theta), (sample) => sy(sample.lapMmHg))}" fill="none" stroke="${trace.color}" stroke-width="2.0" opacity="0.85"/>`);
    out.push(`<path d="${pathFor(trace.samples, (sample) => sx(sample.theta), (sample) => sy(sample.lvpMmHg))}" fill="none" stroke="${trace.color}" stroke-width="1.1" stroke-dasharray="5 4" opacity="0.45"/>`);
  }
}

function renderPrimePanel(out: string[], traces: readonly Trace[], x: number, y: number, w: number, h: number): void {
  const values = traces.flatMap((trace) => trace.samples.flatMap((sample) => [
    finiteOrZero(sample.avPlaneGeometryReadback.sPrimeProxyCmPerSec),
    finiteOrZero(sample.avPlaneGeometryReadback.ePrimeProxyCmPerSec),
    finiteOrZero(sample.avPlaneGeometryReadback.aPrimeProxyCmPerSec),
  ]));
  const sx = (theta: number) => x + theta * w;
  const sy = scaleFor(values, y + h, -h);
  panelFrame(out, x, y, w, h, "s' / e' / a' proxy");
  for (const trace of traces) {
    out.push(`<path d="${pathFor(trace.samples, (sample) => sx(sample.theta), (sample) => sy(finiteOrZero(sample.avPlaneGeometryReadback.sPrimeProxyCmPerSec)))}" fill="none" stroke="${trace.color}" stroke-width="1.8" opacity="0.86"/>`);
    out.push(`<path d="${pathFor(trace.samples, (sample) => sx(sample.theta), (sample) => sy(finiteOrZero(sample.avPlaneGeometryReadback.ePrimeProxyCmPerSec)))}" fill="none" stroke="${trace.color}" stroke-width="1.2" stroke-dasharray="7 4" opacity="0.58"/>`);
    out.push(`<path d="${pathFor(trace.samples, (sample) => sx(sample.theta), (sample) => sy(finiteOrZero(sample.avPlaneGeometryReadback.aPrimeProxyCmPerSec)))}" fill="none" stroke="${trace.color}" stroke-width="1.2" stroke-dasharray="2 4" opacity="0.72"/>`);
  }
}

function panelFrame(out: string[], x: number, y: number, w: number, h: number, title: string): void {
  out.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="#111827" stroke="#253044"/>`);
  out.push(`<path d="M${x + w / 2},${y + 32} L${x + w / 2},${y + h - 14} M${x + 14},${y + h / 2} L${x + w - 14},${y + h / 2}" stroke="#263244" stroke-width="1"/>`);
  out.push(`<text x="${x + 14}" y="${y + 25}" fill="#cbd5e1" font-family="Inter,Arial,sans-serif" font-size="13" font-weight="700">${title}</text>`);
}

function pathFor(
  samples: readonly LeftHeartSubsystemSampleV2[],
  xFor: (sample: LeftHeartSubsystemSampleV2) => number,
  yFor: (sample: LeftHeartSubsystemSampleV2) => number,
): string {
  return samples.map((sample, index) =>
    `${index === 0 ? "M" : "L"}${xFor(sample).toFixed(1)},${yFor(sample).toFixed(1)}`
  ).join(" ");
}

function scaleFor(values: readonly number[], offset: number, span: number): (value: number) => number {
  const finite = values.filter((value) => Number.isFinite(value));
  const min = Math.min(...finite);
  const max = Math.max(...finite);
  const pad = Math.max((max - min) * 0.08, 1e-6);
  const lo = min - pad;
  const hi = max + pad;
  return (value) => offset + (value - lo) / Math.max(hi - lo, 1e-9) * span;
}

function findMvOpeningIndex(samples: readonly LeftHeartSubsystemSampleV2[]): number | null {
  for (let i = 0; i < samples.length; i++) {
    const previous = samples[(i + samples.length - 1) % samples.length]!.mvOpen01;
    const current = samples[i]!.mvOpen01;
    if (previous < 0.45 && current >= 0.45) return i;
  }
  return null;
}

function findMvClosureIndexAfter(samples: readonly LeftHeartSubsystemSampleV2[], openingIndex: number): number | null {
  for (let step = 1; step <= samples.length; step++) {
    const index = (openingIndex + step) % samples.length;
    const previous = samples[(index + samples.length - 1) % samples.length]!.mvOpen01;
    const current = samples[index]!.mvOpen01;
    if (previous >= 0.45 && current < 0.45) return index;
  }
  return null;
}

function finiteOrZero(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function uniqueRowsByVariantId<T extends { readonly variantId: string }>(rows: readonly T[]): T[] {
  const seen = new Set<string>();
  const unique: T[] = [];
  for (const row of rows) {
    if (seen.has(row.variantId)) continue;
    seen.add(row.variantId);
    unique.push(row);
  }
  return unique;
}
