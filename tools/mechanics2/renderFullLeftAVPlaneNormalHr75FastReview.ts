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
const cardsOutPath = resolve(
  repoRoot,
  "data/mechanics2/visuals/full-left-av-plane-normal-hr75-candidate-cards.svg",
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
const MIN_VISUAL_A_LOOP_AREA = 28;
const MIN_VISUAL_V_LOOP_AREA = 40;
const MIN_VISUAL_RESERVOIR_CONDUIT_SEPARATION_MMHG = 1.5;
const MIN_VISUAL_CONDUIT_BELLY_DEPTH_MMHG = 0.25;
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
  "v33-wall-v16lvref48-cap150-visco6-pathmem90-relief45-phaselock04-lvrecv8-rpathslow-rcapslow-traj20-mvimplicit02-pr180-fixed10-pv52-mvlite",
  "v33-wall-v16lvref56-cap150-visco6-pathmem90-relief45-phaselock04-lvrecv12-rpathslow-rcapslow-traj20-mvimplicit02-pr180-fixed10-pv52-mvlite",
  "v34-wall-v16lvref48-cap150-visco6-pathmem90-relief45-cupwide-phaselock04-lvrecv8-rpathbelly-rcapbelly-traj20-mvimplicit02-pr180-fixed10-pv52-mvlite",
  "v34-wall-v16lvref56-cap150-visco6-pathmem90-relief45-cupwide-phaselock04-lvrecv12-rpathbelly-rcapbelly-traj20-mvimplicit02-pr180-fixed10-pv52-mvlite",
  "v34-wall-v16lvref56-cap125-visco6-pathmem90-relief45-cupwide-longrecv-phaselock04-lvrecv12-rpathbelly-rcapbelly-traj20-mvimplicit02-pr170-fixed10-pv44-mvlite",
  "v35-wall-v16lvref48-cap150-visco6-conduitvisco025-pathmem90-relief45-phaselock04-lvrecv8-rpathslow-rcapslow-traj20-mvimplicit02-pr180-fixed10-pv52-mvlite",
  "v35-wall-v16lvref56-cap150-visco6-conduitvisco025-pathmem90-relief45-phaselock04-lvrecv12-rpathslow-rcapslow-traj20-mvimplicit02-pr180-fixed10-pv52-mvlite",
  "v35-wall-v16lvref48-cap150-visco8-conduitvisco020-pathmem90-relief45-phaselock04-lvrecv8-rpathslow-rcapslow-traj20-mvimplicit02-pr180-fixed10-pv52-mvlite",
  "v35-wall-v16lvref56-cap150-visco8-conduitvisco020-pathmem90-relief45-phaselock04-lvrecv12-rpathslow-rcapslow-traj20-mvimplicit02-pr180-fixed10-pv52-mvlite",
  "v36-wall-v16lvref48-cap150-visco6-pathmem90-relief45-cupwide-lvrcup04-phaselock04-lvrecv8-rpathbelly-rcapbelly-traj20-mvimplicit02-pr180-fixed14-pv52-mvlite",
  "v36-wall-v16lvref56-cap150-visco6-pathmem90-relief45-cupwide-lvrcup04-phaselock04-lvrecv12-rpathbelly-rcapbelly-traj20-mvimplicit02-pr180-fixed14-pv52-mvlite",
  "v36-wall-v16lvref64-cap150-visco6-pathmem90-relief45-cupwide-lvrcup04-phaselock04-lvrecv12-rpathbelly-rcapbelly-traj20-mvimplicit02-pr180-fixed14-pv52-mvlite",
  "v36-wall-v16lvref56-cap150-visco6-pathmem90-relief45-cupwide-lvrcup06-phaselock04-lvrecv12-rpathbelly-rcapbelly-traj20-mvimplicit02-pr180-fixed14-pv52-mvlite",
  "v36-wall-v16lvref56-cap125-visco6-pathmem90-relief45-cupwide-lvrcup04-longrecv-phaselock04-lvrecv12-rpathbelly-rcapbelly-traj20-mvimplicit02-pr170-fixed14-pv44-mvlite",
  "v36-wall-v16lvref56-cap150-visco6-pathmem100-relief60-cupwide-lvrcup04-longrecv-phaselock04-lvrecv12-rpathbelly-rcapbelly-traj20-mvimplicit02-pr180-fixed16-pv52-mvlite",
  "v36-wall-v16lvref64-cap175-visco6-pathmem90-relief45-cupwide-lvrcup06-longrecv-phaselock04-lvrecv12-rpathbelly-rcapbelly-traj20-mvimplicit02-pr200-fixed16-pv56-mvlite",
  "v37-wall-v16lvref56-cap150-visco6-pathmem90-relief45-cupwide-lvrcup08-longrecv-phaselock04-lvrecv12-rpathbelly-rcapbelly-traj20-mvimplicit02-pr180-fixed16-pv52-mvlite",
  "v37-wall-v16lvref64-cap150-visco6-pathmem90-relief45-cupwide-lvrcup08-longrecv-phaselock04-lvrecv12-rpathbelly-rcapbelly-traj20-mvimplicit02-pr180-fixed16-pv52-mvlite",
  "v37-wall-v16lvref64-cap175-visco6-pathmem90-relief45-cupwide-lvrcup08-longrecv-phaselock04-lvrecv12-rpathbelly-rcapbelly-traj20-mvimplicit02-pr200-fixed16-pv56-mvlite",
  "v37-wall-v16lvref56-cap150-visco6-pathmem100-relief60-cupwide-lvrcup10-longrecv-phaselock04-lvrecv12-rpathbelly-rcapbelly-traj20-mvimplicit02-pr180-fixed18-pv52-mvlite",
  "v37-wall-v16lvref64-cap150-visco6-pathmem100-relief60-cupwide-lvrcup10-longrecv-phaselock04-lvrecv12-rpathbelly-rcapbelly-traj20-mvimplicit02-pr180-fixed18-pv52-mvlite",
  "v37-wall-v16lvref80-cap175-visco6-pathmem100-relief60-cupwide-lvrcup10-longrecv-phaselock04-lvrecv12-rpathbelly-rcapbelly-traj20-mvimplicit02-pr200-fixed18-pv56-mvlite",
  "v38-wall-v16lvref56-cap150-visco6-pathmem90-relief45-cupwide-mvres30-rpathbelly-rcapbelly-traj20-mvimplicit02-pr180-fixed16-pv52-mvlite",
  "v38-wall-v16lvref64-cap150-visco6-pathmem90-relief45-cupwide-mvres30-rpathbelly-rcapbelly-traj20-mvimplicit02-pr180-fixed16-pv52-mvlite",
  "v38-wall-v16lvref64-cap175-visco6-pathmem90-relief45-cupwide-mvres30-rpathbelly-rcapbelly-traj20-mvimplicit02-pr200-fixed18-pv56-mvlite",
  "v38-wall-v16lvref80-cap175-visco6-pathmem100-relief60-cupwide-mvres30-rpathbelly-rcapbelly-traj20-mvimplicit02-pr200-fixed18-pv56-mvlite",
  "v39-wall-v16lvref64-cap150-visco6-pathmem90-relief45-cupwide-mvres30-rpathfast-rcapfast-traj20-mvimplicit02-pr180-fixed16-pv52-mvlite",
  "v39-wall-v16lvref80-cap150-visco6-pathmem90-relief45-cupwide-mvres30-rpathfast-rcapfast-traj20-mvimplicit02-pr180-fixed16-pv52-mvlite",
  "v39-wall-v16lvref80-cap175-visco6-pathmem90-relief45-cupwide-mvres30-rpathfast-rcapfast-traj20-mvimplicit02-pr200-fixed18-pv56-mvlite",
  "v39-wall-v16lvref120-cap175-visco6-pathmem100-relief60-cupwide-mvres30-rpathfast-rcapfast-traj20-mvimplicit02-pr200-fixed18-pv56-mvlite",
  "v40-statepath-wall-v16lvref56-cap150-visco6-pathmem90-relief45-cupwide-mvres30-rpathslow-rcapslow-traj20-mvimplicit02-pr180-fixed10-pv52-mvlite",
  "v40-statepath-wall-v16lvref56-cap150-visco6-pathmem90-relief45-cupwide-mvres30-rpathbelly-rcapbelly-traj20-mvimplicit02-pr180-fixed10-pv52-mvlite",
  "v40-statepath-wall-v16lvref64-cap150-visco6-pathmem90-relief45-cupwide-mvres30-rpathbelly-rcapbelly-traj20-mvimplicit02-pr180-fixed12-pv52-mvlite",
  "v40-statepath-branchmem-wall-v16lvref56-cap150-visco6-pathmem90-relief45-cupwide-mvres30-rpathbelly-rcapbelly-traj20-mvimplicit02-pr180-fixed12-pv52-mvlite",
  "v40-statepath-wall-v16lvref64-cap175-visco6-pathmem90-relief45-cupwide-mvres30-rpathbelly-rcapbelly-traj20-mvimplicit02-pr200-fixed14-pv56-mvlite",
  "v40-statepath-wall-v16lvref80-cap175-visco6-pathmem100-relief60-cupwide-mvres30-rpathbelly-rcapbelly-traj20-mvimplicit02-pr200-fixed14-pv56-mvlite",
  "v41-wall-v16lvref48-cap150-visco8-pathmem100-relief60-phaselock04-lvrecv8-rpathslow-rcapslow-traj20-mvimplicit02-pr180-fixed10-pv52-mvlite",
  "v41-wall-v16lvref56-cap150-visco6-pathmem100-relief60-phaselock04-lvrecv8-rpathslow-rcapslow-traj20-mvimplicit02-pr180-fixed10-pv52-mvlite",
  "v41-wall-v16lvref56-cap150-visco8-pathmem100-relief60-phaselock04-lvrecv8-rpathslow-rcapslow-traj20-mvimplicit02-pr180-fixed10-pv52-mvlite",
  "v41-wall-v16lvref56-cap150-visco8-pathmem100-relief60-phaselock04-lvrecv12-rpathslow-rcapslow-traj20-mvimplicit02-pr180-fixed10-pv52-mvlite",
  "v41-wall-v16lvref64-cap175-visco8-pathmem100-relief60-phaselock04-lvrecv8-rpathslow-rcapslow-traj20-mvimplicit02-pr200-fixed12-pv56-mvlite",
  "v41-wall-v16lvref64-cap175-visco8-pathmem100-relief60-phaselock04-lvrecv12-rpathslow-rcapslow-traj20-mvimplicit02-pr200-fixed12-pv56-mvlite",
  "v42-wall-v16lvref64-cap175-visco8-pathmem100-relief60-phaselock04-lvrecv8-rpathslow-rcapslow-traj20-mvimplicit02-pr200-fixed18-pv56-mvlite",
  "v42-wall-v16lvref64-cap175-visco8-pathmem100-relief60-phaselock04-lvrecv12-rpathslow-rcapslow-traj20-mvimplicit02-pr200-fixed18-pv56-mvlite",
  "v42-wall-v16lvref64-cap175-visco8-pathmem100-relief60-phaselock04-lvrecv8-rpathslow-rcapslow-traj20-mvimplicit02-pr200-fixed24-pv56-mvlite",
  "v42-wall-v16lvref64-cap175-visco8-pathmem100-relief60-phaselock04-lvrecv12-rpathslow-rcapslow-traj20-mvimplicit02-pr200-fixed24-pv56-mvlite",
  "v43-wall-v16lvref56-cap175-visco6-pathmem90-relief45-phaselock04-lvrecv12-rpathslow-rcapslow-traj20-mvimplicit02-pr200-fixed18-pv56-mvlite",
  "v43-wall-v16lvref64-cap175-visco6-pathmem90-relief45-phaselock04-lvrecv12-rpathslow-rcapslow-traj20-mvimplicit02-pr200-fixed18-pv56-mvlite",
  "v43-wall-v16lvref56-cap150-visco6-pathmem100-relief52-phaselock04-lvrecv12-rpathslow-rcapslow-traj20-mvimplicit02-pr180-fixed18-pv52-mvlite",
  "v43-wall-v16lvref64-cap150-visco6-pathmem100-relief52-phaselock04-lvrecv12-rpathslow-rcapslow-traj20-mvimplicit02-pr180-fixed18-pv52-mvlite",
  "v43-wall-v16lvref64-cap175-visco6-pathmem100-relief52-phaselock04-lvrecv12-rpathslow-rcapslow-traj20-mvimplicit02-pr200-fixed24-pv56-mvlite",
  "v44-wall-v16lvref64-cap175-visco8-pathmem100-relief60-phaselock04-lvrecv8-rpathslow-rcapslow-traj20-mvimplicit02-pr200-fixed36-pv56-mvlite",
  "v44-wall-v16lvref64-cap175-visco8-pathmem100-relief60-phaselock04-lvrecv12-rpathslow-rcapslow-traj20-mvimplicit02-pr200-fixed36-pv56-mvlite",
  "v44-wall-v16lvref64-cap175-visco8-pathmem100-relief60-phaselock04-lvrecv8-rpathslow-rcapslow-traj20-mvimplicit02-pr200-fixed48-pv56-mvlite",
  "v44-wall-v16lvref64-cap175-visco8-pathmem100-relief60-phaselock04-lvrecv12-rpathslow-rcapslow-traj20-mvimplicit02-pr200-fixed48-pv56-mvlite",
  "v45-wall-v16lvref64-cap175-visco8-pathmem100-relief60-phaselock04-lvrecv8-rpathslow-rcapslow-traj20-mvimplicit02-pr200-fixed72-pv56-mvlite",
  "v45-wall-v16lvref64-cap175-visco8-pathmem100-relief60-phaselock04-lvrecv12-rpathslow-rcapslow-traj20-mvimplicit02-pr200-fixed72-pv56-mvlite",
  "v46-wall-v16lvref64-cap175-visco8-pathmem100-relief60-phaselock04-lvrecv16-rpathslow-rcapslow-traj20-mvimplicit02-pr200-fixed72-pv56-mvlite",
  "v46-wall-v16lvref72-cap175-visco8-pathmem100-relief60-phaselock04-lvrecv12-rpathslow-rcapslow-traj20-mvimplicit02-pr200-fixed72-pv56-mvlite",
  "v46-wall-v16lvref72-cap175-visco8-pathmem100-relief60-phaselock04-lvrecv16-rpathslow-rcapslow-traj20-mvimplicit02-pr200-fixed72-pv56-mvlite",
  "v46-wall-v16lvref80-cap175-visco8-pathmem100-relief60-phaselock04-lvrecv16-rpathslow-rcapslow-traj20-mvimplicit02-pr200-fixed72-pv56-mvlite",
  "v47-wall-v16lvref64-cap175-visco8-pathmem100-relief60-lvrcup02-phaselock04-lvrecv12-rpathslow-rcapslow-traj20-mvimplicit02-pr200-fixed72-pv56-mvlite",
  "v47-wall-v16lvref64-cap175-visco8-pathmem100-relief60-lvrcup03-phaselock04-lvrecv12-rpathslow-rcapslow-traj20-mvimplicit02-pr200-fixed72-pv56-mvlite",
  "v47-wall-v16lvref64-cap175-visco8-pathmem100-relief60-lvrcup04-phaselock04-lvrecv12-rpathslow-rcapslow-traj20-mvimplicit02-pr200-fixed72-pv56-mvlite",
  "v47-wall-v16lvref64-cap175-visco8-pathmem100-relief60-lvrcup02-longrecv-phaselock04-lvrecv12-rpathslow-rcapslow-traj20-mvimplicit02-pr200-fixed72-pv56-mvlite",
  "v47-wall-v16lvref64-cap175-visco8-pathmem100-relief60-lvrcup03-longrecv-phaselock04-lvrecv12-rpathslow-rcapslow-traj20-mvimplicit02-pr200-fixed72-pv56-mvlite",
  "v48-wall-v16lvref64-cap175-visco8-pathmem100-relief60-cupwide-phaselock04-lvrecv12-rpathslow-rcapslow-traj20-mvimplicit02-pr200-fixed72-pv56-mvlite",
  "v48-wall-v16lvref64-cap175-visco8-pathmem100-relief60-cupwide-lvrcup02-phaselock04-lvrecv12-rpathslow-rcapslow-traj20-mvimplicit02-pr200-fixed72-pv56-mvlite",
  "v48-wall-v16lvref64-cap175-visco8-pathmem100-relief60-cupwide-lvrcup03-phaselock04-lvrecv12-rpathslow-rcapslow-traj20-mvimplicit02-pr200-fixed72-pv56-mvlite",
  "v48-wall-v16lvref64-cap175-visco8-pathmem100-relief60-cupwide-lvrcup02-longrecv-phaselock04-lvrecv12-rpathslow-rcapslow-traj20-mvimplicit02-pr200-fixed72-pv56-mvlite",
  "v48-wall-v16lvref64-cap175-visco8-pathmem100-relief60-cupwide-lvrcup03-longrecv-phaselock04-lvrecv12-rpathslow-rcapslow-traj20-mvimplicit02-pr200-fixed72-pv56-mvlite",
  "v49-wall-v16lvref64-cap175-visco8-pathmem100-relief60-lvrcup04-longrecv-mvres30-phaselock04-lvrecv12-rpathslow-rcapslow-traj20-mvimplicit02-pr200-fixed72-pv56-mvlite",
  "v49-wall-v16lvref64-cap175-visco8-pathmem100-relief60-lvrcup05-longrecv-mvres30-phaselock04-lvrecv12-rpathslow-rcapslow-traj20-mvimplicit02-pr200-fixed72-pv56-mvlite",
  "v49-wall-v16lvref64-cap175-visco8-pathmem100-relief60-lvrcup06-longrecv-mvres30-phaselock04-lvrecv12-rpathslow-rcapslow-traj20-mvimplicit02-pr200-fixed72-pv56-mvlite",
  "v49-wall-v16lvref64-cap175-visco8-pathmem100-relief60-cupwide-lvrcup03-longrecv-mvres30-phaselock04-lvrecv12-rpathslow-rcapslow-traj20-mvimplicit02-pr200-fixed72-pv56-mvlite",
  "v50-wall-v16cap125-visco35-viscosoft-pathmem75-relief16-lvrcup02-phaselock02-lvrecv3-rcapslow-traj20-mvimplicit02-pr180-fixed10-pv44-mvlite",
  "v50-wall-v16cap125-visco35-viscosoft-pathmem90-relief20-lvrcup02-phaselock04-lvrecv3-rcapslow-traj20-mvimplicit02-pr180-fixed10-pv44-mvlite",
  "v50-wall-v16cap125-visco3-pathmem75-relief16-lvrcup02-phaselock04-lvrecv3-rcapslow-traj20-mvimplicit02-pr180-fixed10-pv44-mvlite",
  "v50-wall-v16cap125-visco35-viscosoft-pathmem75-relief16-lvrcup03-phaselock02-lvrecv3-rcapslow-traj20-mvimplicit02-pr180-fixed10-pv44-mvlite",
  "v50-wall-v16cap150-visco35-viscosoft-pathmem75-relief16-lvrcup02-phaselock02-lvrecv3-rcapslow-traj20-mvimplicit02-pr200-fixed10-pv52-mvlite",
  "v51-wall-v16visco35-viscosoft-phaselock02-lvrecv3-rcap-traj20-mvimplicit02-pr170-fixed10-pv44-mvlite",
  "v51-wall-v16visco35-viscosoft-phaselock02-lvrecv3-rcap-traj20-mvimplicit02-pr180-fixed10-pv44-mvlite",
  "v51-wall-v16visco35-viscosoft-phaselock02-lvrecv3-rcap-traj20-mvimplicit02-pr180-fixed12-pv48-mvlite",
  "v51-wall-v16visco4-viscosoft-phaselock02-lvrecv3-rcap-traj20-mvimplicit02-pr170-fixed10-pv44-mvlite",
  "v51-wall-v16visco35-viscosoft-phaselock03-lvrecv3-rcap-traj20-mvimplicit02-pr170-fixed10-pv44-mvlite",
  "v51-wall-v16visco35-viscosoft-phaselock02-lvrecv2-rcap-traj20-mvimplicit02-pr170-fixed10-pv44-mvlite",
  "v51-wall-v16visco35-viscosoft-phaselock02-lvrecv3-rcapfast-traj20-mvimplicit02-pr170-fixed10-pv44-mvlite",
  "v52-wall-v16visco4-viscosoft-phaselock02-lvrecv3-rcap-traj20-mvimplicit02-pr170-fixed10-pv44-mvsmooth",
  "v52-wall-v16visco4-viscosoft-phaselock02-lvrecv2-rcap-traj20-mvimplicit02-pr170-fixed10-pv44-mvsmooth",
  "v52-wall-v16visco4-viscosoft-phaselock02-lvrecv3-rcap-traj20-mvimplicit05-pr170-fixed10-pv44-mvsmooth",
  "v52-wall-v16visco4-viscosoft-phaselock02-lvrecv2-rcap-traj20-mvimplicit05-pr170-fixed10-pv44-mvsmooth",
  "v52-wall-v16visco35-viscosoft-phaselock02-lvrecv3-rcap-traj20-mvimplicit05-pr170-fixed10-pv44-mvsmooth",
  "v52-wall-v16visco4-viscosoft-phaselock02-lvrecv3-rcapbelly-traj20-mvimplicit02-pr170-fixed10-pv44-mvsmooth",
  "v52-wall-v16visco4-viscosoft-phaselock02-lvrecv3-rcap-traj20-mvimplicit02-pr170-fixed10-pv44-mvloss",
]);
void pinnedMechanismIds;
const eligibleRows = rows
  .filter((row) =>
    isCurrentNormalFirstFamily(row.family)
    && row.sourceSurfacePass
	    && row.mvfClean
	    && row.phaseOrientedPvPass
	    && row.hiddenVolumeClean
	    && row.phasePv.vLoopArea >= MIN_VISUAL_V_LOOP_AREA
	    && row.phasePv.aLoopArea >= MIN_VISUAL_A_LOOP_AREA
	    && row.phasePv.meanReservoirConduitSeparationMmHg >= MIN_VISUAL_RESERVOIR_CONDUIT_SEPARATION_MMHG
	    && row.phasePv.conduitBellyDepthMmHg >= MIN_VISUAL_CONDUIT_BELLY_DEPTH_MMHG
	    && row.phasePv.postOpeningEarlyPressureDropMmHg > 1.0
	    && row.phasePv.postOpeningEarlyVolumeDropMl > 0.8
    && !row.phasePv.failureReasons.includes("mv-opening-starts-upward")
    && !row.phasePv.failureReasons.includes("mv-opening-conduit-start-not-downstroke")
  );
const visualAnchorIds = [
  "v38-wall-v16lvref56-cap150-visco6-pathmem90-relief45-cupwide-mvres30-rpathbelly-rcapbelly-traj20-mvimplicit02-pr180-fixed16-pv52-mvlite",
  "v38-wall-v16lvref64-cap150-visco6-pathmem90-relief45-cupwide-mvres30-rpathbelly-rcapbelly-traj20-mvimplicit02-pr180-fixed16-pv52-mvlite",
  "v38-wall-v16lvref64-cap175-visco6-pathmem90-relief45-cupwide-mvres30-rpathbelly-rcapbelly-traj20-mvimplicit02-pr200-fixed18-pv56-mvlite",
  "v38-wall-v16lvref80-cap175-visco6-pathmem100-relief60-cupwide-mvres30-rpathbelly-rcapbelly-traj20-mvimplicit02-pr200-fixed18-pv56-mvlite",
  "v39-wall-v16lvref64-cap150-visco6-pathmem90-relief45-cupwide-mvres30-rpathfast-rcapfast-traj20-mvimplicit02-pr180-fixed16-pv52-mvlite",
  "v39-wall-v16lvref80-cap150-visco6-pathmem90-relief45-cupwide-mvres30-rpathfast-rcapfast-traj20-mvimplicit02-pr180-fixed16-pv52-mvlite",
  "v39-wall-v16lvref80-cap175-visco6-pathmem90-relief45-cupwide-mvres30-rpathfast-rcapfast-traj20-mvimplicit02-pr200-fixed18-pv56-mvlite",
  "v39-wall-v16lvref120-cap175-visco6-pathmem100-relief60-cupwide-mvres30-rpathfast-rcapfast-traj20-mvimplicit02-pr200-fixed18-pv56-mvlite",
  "v40-statepath-wall-v16lvref56-cap150-visco6-pathmem90-relief45-cupwide-mvres30-rpathslow-rcapslow-traj20-mvimplicit02-pr180-fixed10-pv52-mvlite",
  "v40-statepath-wall-v16lvref56-cap150-visco6-pathmem90-relief45-cupwide-mvres30-rpathbelly-rcapbelly-traj20-mvimplicit02-pr180-fixed10-pv52-mvlite",
  "v40-statepath-wall-v16lvref64-cap150-visco6-pathmem90-relief45-cupwide-mvres30-rpathbelly-rcapbelly-traj20-mvimplicit02-pr180-fixed12-pv52-mvlite",
  "v40-statepath-branchmem-wall-v16lvref56-cap150-visco6-pathmem90-relief45-cupwide-mvres30-rpathbelly-rcapbelly-traj20-mvimplicit02-pr180-fixed12-pv52-mvlite",
  "v40-statepath-wall-v16lvref64-cap175-visco6-pathmem90-relief45-cupwide-mvres30-rpathbelly-rcapbelly-traj20-mvimplicit02-pr200-fixed14-pv56-mvlite",
  "v40-statepath-wall-v16lvref80-cap175-visco6-pathmem100-relief60-cupwide-mvres30-rpathbelly-rcapbelly-traj20-mvimplicit02-pr200-fixed14-pv56-mvlite",
  "v41-wall-v16lvref48-cap150-visco8-pathmem100-relief60-phaselock04-lvrecv8-rpathslow-rcapslow-traj20-mvimplicit02-pr180-fixed10-pv52-mvlite",
  "v41-wall-v16lvref56-cap150-visco6-pathmem100-relief60-phaselock04-lvrecv8-rpathslow-rcapslow-traj20-mvimplicit02-pr180-fixed10-pv52-mvlite",
  "v41-wall-v16lvref56-cap150-visco8-pathmem100-relief60-phaselock04-lvrecv8-rpathslow-rcapslow-traj20-mvimplicit02-pr180-fixed10-pv52-mvlite",
  "v41-wall-v16lvref56-cap150-visco8-pathmem100-relief60-phaselock04-lvrecv12-rpathslow-rcapslow-traj20-mvimplicit02-pr180-fixed10-pv52-mvlite",
  "v41-wall-v16lvref64-cap175-visco8-pathmem100-relief60-phaselock04-lvrecv8-rpathslow-rcapslow-traj20-mvimplicit02-pr200-fixed12-pv56-mvlite",
  "v41-wall-v16lvref64-cap175-visco8-pathmem100-relief60-phaselock04-lvrecv12-rpathslow-rcapslow-traj20-mvimplicit02-pr200-fixed12-pv56-mvlite",
  "v42-wall-v16lvref64-cap175-visco8-pathmem100-relief60-phaselock04-lvrecv8-rpathslow-rcapslow-traj20-mvimplicit02-pr200-fixed18-pv56-mvlite",
  "v42-wall-v16lvref64-cap175-visco8-pathmem100-relief60-phaselock04-lvrecv12-rpathslow-rcapslow-traj20-mvimplicit02-pr200-fixed18-pv56-mvlite",
  "v42-wall-v16lvref64-cap175-visco8-pathmem100-relief60-phaselock04-lvrecv8-rpathslow-rcapslow-traj20-mvimplicit02-pr200-fixed24-pv56-mvlite",
  "v42-wall-v16lvref64-cap175-visco8-pathmem100-relief60-phaselock04-lvrecv12-rpathslow-rcapslow-traj20-mvimplicit02-pr200-fixed24-pv56-mvlite",
  "v43-wall-v16lvref56-cap175-visco6-pathmem90-relief45-phaselock04-lvrecv12-rpathslow-rcapslow-traj20-mvimplicit02-pr200-fixed18-pv56-mvlite",
  "v43-wall-v16lvref64-cap175-visco6-pathmem90-relief45-phaselock04-lvrecv12-rpathslow-rcapslow-traj20-mvimplicit02-pr200-fixed18-pv56-mvlite",
  "v43-wall-v16lvref56-cap150-visco6-pathmem100-relief52-phaselock04-lvrecv12-rpathslow-rcapslow-traj20-mvimplicit02-pr180-fixed18-pv52-mvlite",
  "v43-wall-v16lvref64-cap150-visco6-pathmem100-relief52-phaselock04-lvrecv12-rpathslow-rcapslow-traj20-mvimplicit02-pr180-fixed18-pv52-mvlite",
  "v43-wall-v16lvref64-cap175-visco6-pathmem100-relief52-phaselock04-lvrecv12-rpathslow-rcapslow-traj20-mvimplicit02-pr200-fixed24-pv56-mvlite",
  "v44-wall-v16lvref64-cap175-visco8-pathmem100-relief60-phaselock04-lvrecv8-rpathslow-rcapslow-traj20-mvimplicit02-pr200-fixed36-pv56-mvlite",
  "v44-wall-v16lvref64-cap175-visco8-pathmem100-relief60-phaselock04-lvrecv12-rpathslow-rcapslow-traj20-mvimplicit02-pr200-fixed36-pv56-mvlite",
  "v44-wall-v16lvref64-cap175-visco8-pathmem100-relief60-phaselock04-lvrecv8-rpathslow-rcapslow-traj20-mvimplicit02-pr200-fixed48-pv56-mvlite",
  "v44-wall-v16lvref64-cap175-visco8-pathmem100-relief60-phaselock04-lvrecv12-rpathslow-rcapslow-traj20-mvimplicit02-pr200-fixed48-pv56-mvlite",
  "v45-wall-v16lvref64-cap175-visco8-pathmem100-relief60-phaselock04-lvrecv8-rpathslow-rcapslow-traj20-mvimplicit02-pr200-fixed72-pv56-mvlite",
  "v45-wall-v16lvref64-cap175-visco8-pathmem100-relief60-phaselock04-lvrecv12-rpathslow-rcapslow-traj20-mvimplicit02-pr200-fixed72-pv56-mvlite",
  "v46-wall-v16lvref64-cap175-visco8-pathmem100-relief60-phaselock04-lvrecv16-rpathslow-rcapslow-traj20-mvimplicit02-pr200-fixed72-pv56-mvlite",
  "v46-wall-v16lvref72-cap175-visco8-pathmem100-relief60-phaselock04-lvrecv12-rpathslow-rcapslow-traj20-mvimplicit02-pr200-fixed72-pv56-mvlite",
  "v46-wall-v16lvref72-cap175-visco8-pathmem100-relief60-phaselock04-lvrecv16-rpathslow-rcapslow-traj20-mvimplicit02-pr200-fixed72-pv56-mvlite",
  "v46-wall-v16lvref80-cap175-visco8-pathmem100-relief60-phaselock04-lvrecv16-rpathslow-rcapslow-traj20-mvimplicit02-pr200-fixed72-pv56-mvlite",
  "v47-wall-v16lvref64-cap175-visco8-pathmem100-relief60-lvrcup02-phaselock04-lvrecv12-rpathslow-rcapslow-traj20-mvimplicit02-pr200-fixed72-pv56-mvlite",
  "v47-wall-v16lvref64-cap175-visco8-pathmem100-relief60-lvrcup03-phaselock04-lvrecv12-rpathslow-rcapslow-traj20-mvimplicit02-pr200-fixed72-pv56-mvlite",
  "v47-wall-v16lvref64-cap175-visco8-pathmem100-relief60-lvrcup04-phaselock04-lvrecv12-rpathslow-rcapslow-traj20-mvimplicit02-pr200-fixed72-pv56-mvlite",
  "v47-wall-v16lvref64-cap175-visco8-pathmem100-relief60-lvrcup02-longrecv-phaselock04-lvrecv12-rpathslow-rcapslow-traj20-mvimplicit02-pr200-fixed72-pv56-mvlite",
  "v47-wall-v16lvref64-cap175-visco8-pathmem100-relief60-lvrcup03-longrecv-phaselock04-lvrecv12-rpathslow-rcapslow-traj20-mvimplicit02-pr200-fixed72-pv56-mvlite",
  "v48-wall-v16lvref64-cap175-visco8-pathmem100-relief60-cupwide-phaselock04-lvrecv12-rpathslow-rcapslow-traj20-mvimplicit02-pr200-fixed72-pv56-mvlite",
  "v48-wall-v16lvref64-cap175-visco8-pathmem100-relief60-cupwide-lvrcup02-phaselock04-lvrecv12-rpathslow-rcapslow-traj20-mvimplicit02-pr200-fixed72-pv56-mvlite",
  "v48-wall-v16lvref64-cap175-visco8-pathmem100-relief60-cupwide-lvrcup03-phaselock04-lvrecv12-rpathslow-rcapslow-traj20-mvimplicit02-pr200-fixed72-pv56-mvlite",
  "v48-wall-v16lvref64-cap175-visco8-pathmem100-relief60-cupwide-lvrcup02-longrecv-phaselock04-lvrecv12-rpathslow-rcapslow-traj20-mvimplicit02-pr200-fixed72-pv56-mvlite",
  "v48-wall-v16lvref64-cap175-visco8-pathmem100-relief60-cupwide-lvrcup03-longrecv-phaselock04-lvrecv12-rpathslow-rcapslow-traj20-mvimplicit02-pr200-fixed72-pv56-mvlite",
  "v49-wall-v16lvref64-cap175-visco8-pathmem100-relief60-lvrcup04-longrecv-mvres30-phaselock04-lvrecv12-rpathslow-rcapslow-traj20-mvimplicit02-pr200-fixed72-pv56-mvlite",
  "v49-wall-v16lvref64-cap175-visco8-pathmem100-relief60-lvrcup05-longrecv-mvres30-phaselock04-lvrecv12-rpathslow-rcapslow-traj20-mvimplicit02-pr200-fixed72-pv56-mvlite",
  "v49-wall-v16lvref64-cap175-visco8-pathmem100-relief60-lvrcup06-longrecv-mvres30-phaselock04-lvrecv12-rpathslow-rcapslow-traj20-mvimplicit02-pr200-fixed72-pv56-mvlite",
  "v49-wall-v16lvref64-cap175-visco8-pathmem100-relief60-cupwide-lvrcup03-longrecv-mvres30-phaselock04-lvrecv12-rpathslow-rcapslow-traj20-mvimplicit02-pr200-fixed72-pv56-mvlite",
  "v50-wall-v16cap125-visco35-viscosoft-pathmem75-relief16-lvrcup02-phaselock02-lvrecv3-rcapslow-traj20-mvimplicit02-pr180-fixed10-pv44-mvlite",
  "v50-wall-v16cap125-visco35-viscosoft-pathmem90-relief20-lvrcup02-phaselock04-lvrecv3-rcapslow-traj20-mvimplicit02-pr180-fixed10-pv44-mvlite",
  "v50-wall-v16cap125-visco3-pathmem75-relief16-lvrcup02-phaselock04-lvrecv3-rcapslow-traj20-mvimplicit02-pr180-fixed10-pv44-mvlite",
  "v50-wall-v16cap125-visco35-viscosoft-pathmem75-relief16-lvrcup03-phaselock02-lvrecv3-rcapslow-traj20-mvimplicit02-pr180-fixed10-pv44-mvlite",
  "v50-wall-v16cap150-visco35-viscosoft-pathmem75-relief16-lvrcup02-phaselock02-lvrecv3-rcapslow-traj20-mvimplicit02-pr200-fixed10-pv52-mvlite",
  "v51-wall-v16visco35-viscosoft-phaselock02-lvrecv3-rcap-traj20-mvimplicit02-pr170-fixed10-pv44-mvlite",
  "v51-wall-v16visco35-viscosoft-phaselock02-lvrecv3-rcap-traj20-mvimplicit02-pr180-fixed10-pv44-mvlite",
  "v51-wall-v16visco35-viscosoft-phaselock02-lvrecv3-rcap-traj20-mvimplicit02-pr180-fixed12-pv48-mvlite",
  "v51-wall-v16visco4-viscosoft-phaselock02-lvrecv3-rcap-traj20-mvimplicit02-pr170-fixed10-pv44-mvlite",
  "v51-wall-v16visco35-viscosoft-phaselock03-lvrecv3-rcap-traj20-mvimplicit02-pr170-fixed10-pv44-mvlite",
  "v51-wall-v16visco35-viscosoft-phaselock02-lvrecv2-rcap-traj20-mvimplicit02-pr170-fixed10-pv44-mvlite",
  "v51-wall-v16visco35-viscosoft-phaselock02-lvrecv3-rcapfast-traj20-mvimplicit02-pr170-fixed10-pv44-mvlite",
  "v52-wall-v16visco4-viscosoft-phaselock02-lvrecv3-rcap-traj20-mvimplicit02-pr170-fixed10-pv44-mvsmooth",
  "v52-wall-v16visco4-viscosoft-phaselock02-lvrecv2-rcap-traj20-mvimplicit02-pr170-fixed10-pv44-mvsmooth",
  "v52-wall-v16visco4-viscosoft-phaselock02-lvrecv3-rcap-traj20-mvimplicit05-pr170-fixed10-pv44-mvsmooth",
  "v52-wall-v16visco4-viscosoft-phaselock02-lvrecv2-rcap-traj20-mvimplicit05-pr170-fixed10-pv44-mvsmooth",
  "v52-wall-v16visco35-viscosoft-phaselock02-lvrecv3-rcap-traj20-mvimplicit05-pr170-fixed10-pv44-mvsmooth",
  "v52-wall-v16visco4-viscosoft-phaselock02-lvrecv3-rcapbelly-traj20-mvimplicit02-pr170-fixed10-pv44-mvsmooth",
  "v52-wall-v16visco4-viscosoft-phaselock02-lvrecv3-rcap-traj20-mvimplicit02-pr170-fixed10-pv44-mvloss",
  "v37-wall-v16lvref56-cap150-visco6-pathmem90-relief45-cupwide-lvrcup08-longrecv-phaselock04-lvrecv12-rpathbelly-rcapbelly-traj20-mvimplicit02-pr180-fixed16-pv52-mvlite",
  "v37-wall-v16lvref64-cap150-visco6-pathmem90-relief45-cupwide-lvrcup08-longrecv-phaselock04-lvrecv12-rpathbelly-rcapbelly-traj20-mvimplicit02-pr180-fixed16-pv52-mvlite",
  "v37-wall-v16lvref64-cap175-visco6-pathmem90-relief45-cupwide-lvrcup08-longrecv-phaselock04-lvrecv12-rpathbelly-rcapbelly-traj20-mvimplicit02-pr200-fixed16-pv56-mvlite",
  "v37-wall-v16lvref56-cap150-visco6-pathmem100-relief60-cupwide-lvrcup10-longrecv-phaselock04-lvrecv12-rpathbelly-rcapbelly-traj20-mvimplicit02-pr180-fixed18-pv52-mvlite",
  "v37-wall-v16lvref64-cap150-visco6-pathmem100-relief60-cupwide-lvrcup10-longrecv-phaselock04-lvrecv12-rpathbelly-rcapbelly-traj20-mvimplicit02-pr180-fixed18-pv52-mvlite",
  "v37-wall-v16lvref80-cap175-visco6-pathmem100-relief60-cupwide-lvrcup10-longrecv-phaselock04-lvrecv12-rpathbelly-rcapbelly-traj20-mvimplicit02-pr200-fixed18-pv56-mvlite",
  "v36-wall-v16lvref48-cap150-visco6-pathmem90-relief45-cupwide-lvrcup04-phaselock04-lvrecv8-rpathbelly-rcapbelly-traj20-mvimplicit02-pr180-fixed14-pv52-mvlite",
  "v36-wall-v16lvref56-cap150-visco6-pathmem90-relief45-cupwide-lvrcup04-phaselock04-lvrecv12-rpathbelly-rcapbelly-traj20-mvimplicit02-pr180-fixed14-pv52-mvlite",
  "v36-wall-v16lvref64-cap150-visco6-pathmem90-relief45-cupwide-lvrcup04-phaselock04-lvrecv12-rpathbelly-rcapbelly-traj20-mvimplicit02-pr180-fixed14-pv52-mvlite",
  "v36-wall-v16lvref56-cap150-visco6-pathmem90-relief45-cupwide-lvrcup06-phaselock04-lvrecv12-rpathbelly-rcapbelly-traj20-mvimplicit02-pr180-fixed14-pv52-mvlite",
  "v36-wall-v16lvref56-cap125-visco6-pathmem90-relief45-cupwide-lvrcup04-longrecv-phaselock04-lvrecv12-rpathbelly-rcapbelly-traj20-mvimplicit02-pr170-fixed14-pv44-mvlite",
  "v36-wall-v16lvref56-cap150-visco6-pathmem100-relief60-cupwide-lvrcup04-longrecv-phaselock04-lvrecv12-rpathbelly-rcapbelly-traj20-mvimplicit02-pr180-fixed16-pv52-mvlite",
  "v36-wall-v16lvref64-cap175-visco6-pathmem90-relief45-cupwide-lvrcup06-longrecv-phaselock04-lvrecv12-rpathbelly-rcapbelly-traj20-mvimplicit02-pr200-fixed16-pv56-mvlite",
  "v29-wall-v16pathmem75-relief16-phaselock04-lvrecv3-rcap-traj20-mvimplicit02-pr160-fixed8-pv36-mvlite",
  "v30-wall-v16cup-visco6-pathmem90-relief45-phaselock04-lvrecv3-rcap-traj20-mvimplicit02-pr170-fixed10-pv44-mvloss",
  "v30-wall-v16cup-visco6-pathmem75-relief36-cupsoft-phaselock04-lvrecv3-rcapslow-traj20-mvimplicit02-pr170-fixed10-pv44-mvloss",
  "v31-wall-v16cap125-visco3-pathmem75-relief12-phaselock04-lvrecv3-rcapslow-traj20-mvimplicit02-pr180-fixed10-pv44-mvlite",
  "v32-wall-v16lvref56-cap125-visco3-pathmem75-relief12-phaselock04-lvrecv16-rcapslow-traj20-mvimplicit02-pr180-fixed10-pv44-mvlite",
  "v32-wall-v16lvref48-cap125-visco3-pathmem75-relief12-phaselock04-lvrecv16-rcapslow-traj20-mvimplicit02-pr180-fixed10-pv44-mvlite",
  "v32-wall-v16lvref48-cap125-visco3-pathmem75-relief12-phaselock04-lvrecv3-rcapslow-traj20-mvimplicit02-pr180-fixed10-pv44-mvlite",
  "v33-wall-v16lvref48-cap125-visco6-pathmem90-relief45-phaselock04-lvrecv8-rpathslow-rcapslow-traj20-mvimplicit02-pr170-fixed10-pv44-mvlite",
  "v33-wall-v16lvref56-cap125-visco4-pathmem75-relief36-cupsoft-phaselock04-lvrecv12-rpathslow-rcapslow-traj20-mvimplicit02-pr170-fixed10-pv44-mvlite",
  "v33-wall-v16lvref48-cap150-visco6-pathmem90-relief45-phaselock04-lvrecv8-rpathslow-rcapslow-traj20-mvimplicit02-pr180-fixed10-pv52-mvlite",
  "v33-wall-v16lvref56-cap150-visco6-pathmem90-relief45-phaselock04-lvrecv12-rpathslow-rcapslow-traj20-mvimplicit02-pr180-fixed10-pv52-mvlite",
  "v34-wall-v16lvref48-cap150-visco6-pathmem90-relief45-cupwide-phaselock04-lvrecv8-rpathbelly-rcapbelly-traj20-mvimplicit02-pr180-fixed10-pv52-mvlite",
  "v34-wall-v16lvref56-cap150-visco6-pathmem90-relief45-cupwide-phaselock04-lvrecv12-rpathbelly-rcapbelly-traj20-mvimplicit02-pr180-fixed10-pv52-mvlite",
  "v34-wall-v16lvref56-cap125-visco6-pathmem90-relief45-cupwide-longrecv-phaselock04-lvrecv12-rpathbelly-rcapbelly-traj20-mvimplicit02-pr170-fixed10-pv44-mvlite",
  "v35-wall-v16lvref48-cap150-visco6-conduitvisco025-pathmem90-relief45-phaselock04-lvrecv8-rpathslow-rcapslow-traj20-mvimplicit02-pr180-fixed10-pv52-mvlite",
  "v35-wall-v16lvref56-cap150-visco6-conduitvisco025-pathmem90-relief45-phaselock04-lvrecv12-rpathslow-rcapslow-traj20-mvimplicit02-pr180-fixed10-pv52-mvlite",
  "v35-wall-v16lvref48-cap150-visco8-conduitvisco020-pathmem90-relief45-phaselock04-lvrecv8-rpathslow-rcapslow-traj20-mvimplicit02-pr180-fixed10-pv52-mvlite",
  "v35-wall-v16lvref56-cap150-visco8-conduitvisco020-pathmem90-relief45-phaselock04-lvrecv12-rpathslow-rcapslow-traj20-mvimplicit02-pr180-fixed10-pv52-mvlite",
  "v28-wall-v16visco3-phaselock02-lvrecv3-rcap-traj20-mvimplicit02-pr160-fixed8-pv36-mvlite",
] as const;

const visualAnchorRows = visualAnchorIds
  .map((variantId) => rows.find((row) =>
    row.variantId === variantId
    && row.sourceSurfacePass
    && row.mvfClean
    && row.phaseOrientedPvPass
    && row.hiddenVolumeClean
    && row.phasePv.aLoopArea >= MIN_VISUAL_A_LOOP_AREA
    && row.phasePv.vLoopArea >= MIN_VISUAL_V_LOOP_AREA
    && row.phasePv.meanReservoirConduitSeparationMmHg >= MIN_VISUAL_RESERVOIR_CONDUIT_SEPARATION_MMHG
    && row.phasePv.conduitBellyDepthMmHg >= MIN_VISUAL_CONDUIT_BELLY_DEPTH_MMHG
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

const topShapeSignalRows = rows
  .filter((row) =>
    isCurrentNormalFirstFamily(row.family)
    && row.sourceSurfacePass
    && row.mvfClean
    && row.phaseOrientedPvPass
    && row.hiddenVolumeClean
    && row.phasePv.aLoopArea >= MIN_VISUAL_A_LOOP_AREA
    && row.phasePv.vLoopArea >= MIN_VISUAL_V_LOOP_AREA
    && row.phasePv.meanReservoirConduitSeparationMmHg >= MIN_VISUAL_RESERVOIR_CONDUIT_SEPARATION_MMHG
    && row.phasePv.conduitBellyDepthMmHg >= MIN_VISUAL_CONDUIT_BELLY_DEPTH_MMHG
    && row.failureReasons.length === 0
    && row.phasePv.postOpeningInitialPressureRiseMmHg <= 0.1
  )
  .sort((a, b) =>
    Math.min(b.phasePv.aLoopArea, 60) - Math.min(a.phasePv.aLoopArea, 60)
    || b.phasePv.vLoopArea - a.phasePv.vLoopArea
    || b.phasePv.conduitBellyDepthMmHg - a.phasePv.conduitBellyDepthMmHg
    || a.maxTransactionResidualNormMl - b.maxTransactionResidualNormMl
  )
  .slice(0, 6);

const candidateRows = uniqueRowsByVariantId([
  ...topCleanRows,
  ...topShapeSignalRows,
  ...visualAnchorRows,
]).slice(0, 24);

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
svg.push(`<text x="34" y="60" fill="#9ca3af" font-family="Inter,Arial,sans-serif" font-size="13">Only normal-hr75 is evaluated here. The overlay prioritizes source/MVF/phase/hidden-volume clean rows with visible blood V-loop area for readability; V-loop area is not an adoption gate here.</text>`);
svg.push(`<text x="34" y="84" fill="#cbd5e1" font-family="Inter,Arial,sans-serif" font-size="13">Shown rows: ${candidateRows.length}; fast report rows: ${rows.length}. Missing/flattened A-loop rows are excluded from this owner-facing SVG.</text>`);

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
renderCandidateCards(traces);

type Trace = {
  readonly row: (typeof report.rows)[number];
  readonly color: string;
  readonly samples: readonly LeftHeartSubsystemSampleV2[];
};

function renderCandidateCards(traces: readonly Trace[]): void {
  const cardWidth = 330;
  const cardHeight = 295;
  const cols = 3;
  const rowsCount = Math.max(1, Math.ceil(traces.length / cols));
  const width = 34 + cols * cardWidth + (cols - 1) * 18 + 34;
  const height = 92 + rowsCount * cardHeight + (rowsCount - 1) * 18 + 34;
  const allSamples = traces.flatMap((trace) => trace.samples);
  const xScale = scaleFor(allSamples.map((sample) => sample.acceptedLaVolumeMl), 0, 1);
  const yScale = scaleFor(allSamples.map((sample) => sample.lapMmHg), 1, -1);
  const svg: string[] = [];
  svg.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`);
  svg.push(`<rect width="${width}" height="${height}" fill="#070b13"/>`);
  svg.push(`<text x="34" y="34" fill="#e5e7eb" font-family="Inter,Arial,sans-serif" font-size="22" font-weight="700">Normal HR75 LA blood PV candidate cards</text>`);
  svg.push(`<text x="34" y="58" fill="#9ca3af" font-family="Inter,Arial,sans-serif" font-size="13">Blood-volume axis only. Effective/capacity and prime traces are intentionally omitted. X-descent depth, crossing location, and V-loop area are readbacks, not hard adoption by themselves.</text>`);
  svg.push(`<text x="34" y="80" fill="#cbd5e1" font-family="Inter,Arial,sans-serif" font-size="12">Only clean source/MVF/phase/hidden-volume rows with a preserved A loop are shown. Compare shape by eye against the Nature-style reservoir/conduit/pumping references.</text>`);
  traces.forEach((trace, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const x = 34 + col * (cardWidth + 18);
    const y = 108 + row * (cardHeight + 18);
    renderPvCard(svg, trace, x, y, cardWidth, cardHeight, xScale, yScale);
  });
  svg.push(`</svg>`);
  mkdirSync(dirname(cardsOutPath), { recursive: true });
  writeFileSync(cardsOutPath, `${svg.join("\n")}\n`);
  console.log(cardsOutPath.replace(`${repoRoot}/`, ""));
}

function renderPvCard(
  out: string[],
  trace: Trace,
  x: number,
  y: number,
  w: number,
  h: number,
  xScale01: (value: number) => number,
  yScale01: (value: number) => number,
): void {
  const plotX = x + 18;
  const plotY = y + 58;
  const plotW = w - 36;
  const plotH = h - 86;
  const sx = (value: number) => plotX + xScale01(value) * plotW;
  const sy = (value: number) => plotY + yScale01(value) * plotH;
  const status = isCleanVisualRow(trace.row) ? "clean" : "dirty anchor";
  out.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="#111827" stroke="#253044"/>`);
  out.push(`<text x="${x + 14}" y="${y + 23}" fill="#e5e7eb" font-family="Inter,Arial,sans-serif" font-size="12" font-weight="700">${shortVariantLabel(trace.row.variantId)}</text>`);
  out.push(`<text x="${x + 14}" y="${y + 42}" fill="${status === "clean" ? "#86efac" : "#fca5a5"}" font-family="Inter,Arial,sans-serif" font-size="11">${status} | A ${trace.row.phasePv.aLoopArea.toFixed(1)} | V ${trace.row.phasePv.vLoopArea.toFixed(1)} | sep ${trace.row.phasePv.meanReservoirConduitSeparationMmHg.toFixed(2)} | belly ${trace.row.phasePv.conduitBellyDepthMmHg.toFixed(2)}</text>`);
  out.push(`<rect x="${plotX}" y="${plotY}" width="${plotW}" height="${plotH}" fill="#0b1220" stroke="#263244"/>`);
  out.push(`<path d="M${plotX + plotW / 2},${plotY + 8} L${plotX + plotW / 2},${plotY + plotH - 8} M${plotX + 8},${plotY + plotH / 2} L${plotX + plotW - 8},${plotY + plotH / 2}" stroke="#263244" stroke-width="1"/>`);
  const openingIndex = findMvOpeningIndex(trace.samples);
  const closureIndex = openingIndex == null ? null : findMvClosureIndexAfter(trace.samples, openingIndex);
  if (openingIndex != null && closureIndex != null) {
    const opening = trace.samples[openingIndex]!;
    const closure = trace.samples[closureIndex]!;
    out.push(`<line x1="${sx(closure.acceptedLaVolumeMl).toFixed(1)}" y1="${sy(closure.lapMmHg).toFixed(1)}" x2="${sx(opening.acceptedLaVolumeMl).toFixed(1)}" y2="${sy(opening.lapMmHg).toFixed(1)}" stroke="#94a3b8" stroke-width="1" stroke-dasharray="4 4" opacity="0.7"/>`);
    renderPhaseSegments(
      out,
      trace.samples,
      openingIndex,
      closureIndex,
      (sample) => sx(sample.acceptedLaVolumeMl),
      (sample) => sy(sample.lapMmHg),
    );
    out.push(`<circle cx="${sx(opening.acceptedLaVolumeMl).toFixed(1)}" cy="${sy(opening.lapMmHg).toFixed(1)}" r="4" fill="#f8fafc" stroke="#020617" stroke-width="1.3"/>`);
    out.push(`<circle cx="${sx(closure.acceptedLaVolumeMl).toFixed(1)}" cy="${sy(closure.lapMmHg).toFixed(1)}" r="4" fill="#020617" stroke="#f8fafc" stroke-width="1.6"/>`);
    out.push(`<text x="${(sx(opening.acceptedLaVolumeMl) + 6).toFixed(1)}" y="${(sy(opening.lapMmHg) - 6).toFixed(1)}" fill="#e5e7eb" font-family="Inter,Arial,sans-serif" font-size="10">MVO</text>`);
    out.push(`<text x="${(sx(closure.acceptedLaVolumeMl) + 6).toFixed(1)}" y="${(sy(closure.lapMmHg) + 13).toFixed(1)}" fill="#e5e7eb" font-family="Inter,Arial,sans-serif" font-size="10">MVC</text>`);
  } else {
    out.push(`<path d="${pathFor(trace.samples, (sample) => sx(sample.acceptedLaVolumeMl), (sample) => sy(sample.lapMmHg))}" fill="none" stroke="#38bdf8" stroke-width="2.6"/>`);
  }
  out.push(`<text x="${x + 14}" y="${y + h - 15}" fill="#94a3b8" font-family="Inter,Arial,sans-serif" font-size="10">postMVO ${trace.row.phasePv.postOpeningEarlyPressureDropMmHg.toFixed(2)} mmHg / ${trace.row.phasePv.postOpeningEarlyVolumeDropMl.toFixed(2)} mL | initRise ${trace.row.phasePv.postOpeningInitialPressureRiseMmHg.toFixed(2)} | tx ${trace.row.maxTransactionResidualNormMl.toFixed(3)}</text>`);
}

function renderLegend(out: string[], traces: readonly Trace[], x: number, y: number): void {
  traces.forEach((trace, index) => {
    const yy = y + index * 17;
    out.push(`<line x1="${x}" y1="${yy}" x2="${x + 24}" y2="${yy}" stroke="${trace.color}" stroke-width="3"/>`);
    const status = isCleanVisualRow(trace.row) ? "clean" : "dirty-shape-anchor";
    out.push(`<text x="${x + 32}" y="${yy + 4}" fill="#cbd5e1" font-family="Inter,Arial,sans-serif" font-size="12">${escapeXml(trace.row.variantId)} | ${status} | A ${trace.row.phasePv.aLoopArea.toFixed(1)} | V ${trace.row.phasePv.vLoopArea.toFixed(1)} | sep ${trace.row.phasePv.meanReservoirConduitSeparationMmHg.toFixed(2)} | belly ${trace.row.phasePv.conduitBellyDepthMmHg.toFixed(2)} | postMVO ${trace.row.phasePv.postOpeningEarlyPressureDropMmHg.toFixed(2)}mmHg/${trace.row.phasePv.postOpeningEarlyVolumeDropMl.toFixed(2)}mL</text>`);
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

function shortVariantLabel(variantId: string): string {
  const prefix = variantId.match(/^(v\d+)/)?.[1] ?? "variant";
  if (variantId.includes("lvref")) {
    const lvref = variantId.match(/lvref\d+/)?.[0] ?? "lvref";
    const cap = variantId.match(/cap\d+/)?.[0] ?? "cap";
    const relief = variantId.match(/relief\d+/)?.[0] ?? "relief";
    const recv = variantId.match(/lvrecv\d+/)?.[0] ?? "lvrecv";
    const path = variantId.includes("rpathbelly")
      ? "rpathbelly"
      : variantId.includes("rpathslow")
        ? "rpathslow"
        : "";
    return `${prefix} ${lvref} ${cap} ${relief} ${recv} ${path}`.trim();
  }
  if (variantId.includes("cup")) return `${prefix} cup anchor`;
  if (variantId.includes("pathmem")) return `${prefix} pathmem anchor`;
  if (variantId.includes("visco")) return `${prefix} wall visco anchor`;
  return variantId.slice(0, 52);
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isCleanVisualRow(row: (typeof rows)[number]): boolean {
  return row.sourceSurfacePass
    && row.mvfClean
    && row.phaseOrientedPvPass
    && row.hiddenVolumeClean
    && row.failureReasons.length === 0;
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
