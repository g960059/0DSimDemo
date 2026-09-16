import { deepStrictEqual } from "node:assert";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { loadControlAdmissionCandidateModuleV1 } from "@/analysis/methods/mainWire/MainWireControlAdmissionCandidateModuleV1";
import { importExactExecutableArtifactModuleV2 } from "@/runtime/ExactExecutableArtifactModuleLoaderV2";
import launches from "@/data/model-candidates/control-admission-v1/launches.json";
import metadata from "@/data/model-candidates/control-admission-v1/candidate.json";

// Keep the comparison artifact outside the source tree. This gate compares a
// performance revision, not a different numerical policy or an admitted model.
const { values } = parseArgs({ options: { reference: { type: "string" }, output: { type: "string" } } });
if (!values.reference) throw new Error("Require --reference PREVIOUS_CANDIDATE_ARTIFACT");
const bytes = await readFile(values.reference);
const current = await loadControlAdmissionCandidateModuleV1();
const reference = await importExactExecutableArtifactModuleV2(bytes) as unknown as typeof current;
deepStrictEqual(reference.createCircleHeartExactModelReleaseV1().manifest,
  current.createCircleHeartExactModelReleaseV1().manifest, "Performance comparison requires identical model contracts");
const ids = ["hemodynamics.pressure.absolute.LV", "hemodynamics.pressure.absolute.Ao",
  "hemodynamics.pressure.absolute.RA", "hemodynamics.volume.LV", "hemodynamics.flow.valve.AoV"] as const;
let ticksChecked = 0, checkpointsChecked = 0;
for (const [index, preset] of launches.presets.entries()) {
  const f = preset.capture.fixture;
  const owners = [reference.ControlCandidateSessionV1, current.ControlCandidateSessionV1];
  let sessions = await Promise.all(owners.map(Owner => Owner.restoreWithStepRecovery(preset.capture.checkpoint.payload,
    f.anatomyId as never, f.hemodynamicResearchInputs as never, 1, f.mechanismResearchInputs as never)));
  // Baseline includes the previously reproduced nonlinear failure/recovery
  // sequence; all cases also cross heartbeat events and a changed-HR boundary.
  const stages: { ticks: number; tbv?: number; hr?: number }[] = index === 0
    ? [{ ticks: 500 }, { ticks: 1500, tbv: 6000 }, { ticks: 2500, tbv: 4200 }, { ticks: 500, tbv: 7000 }]
    : [{ ticks: 500 }, { ticks: 500, tbv: f.hemodynamicResearchInputs.totalBloodVolumeMl + 100 }];
  stages.push({ ticks: 500, hr: f.hemodynamicResearchInputs.heartRateBpm + 10 });
  for (const stage of stages) {
    const inputs = { ...f.hemodynamicResearchInputs,
      ...(stage.tbv === undefined ? {} : { totalBloodVolumeMl: stage.tbv }),
      ...(stage.hr === undefined ? {} : { heartRateBpm: stage.hr }) };
    if (stage.tbv !== undefined || stage.hr !== undefined) sessions = sessions.map(session => session.warmStart(inputs as never));
    const start = sessions[0]!.currentAcceptedState().acceptedTimeSec;
    for (let tick = 1; tick <= stage.ticks; tick++) {
      const target = (Math.round(start / .002) + tick) * .002;
      const results = sessions.map(session => session.advanceToPresentationTimeWithSelectedOutputProjectionV1(target, ids));
      deepStrictEqual(results[1]!.advance, results[0]!.advance, `advance: preset ${index}, tick ${tick}`);
      deepStrictEqual(results[1]!.projectedValues, results[0]!.projectedValues, `outputs: preset ${index}, tick ${tick}`);
      if (results[0]!.advance.status !== "advanced") throw new Error("Comparison trajectory did not advance");
      ticksChecked++;
      if (tick % 100 === 0) deepStrictEqual(sessions[1]!.snapshotAcceptedStateBytes(), sessions[0]!.snapshotAcceptedStateBytes());
      if (tick === Math.floor(stage.ticks / 2) || tick === stage.ticks) {
        const checkpoints = await Promise.all(sessions.map(session => session.checkpoint()));
        deepStrictEqual(checkpoints[1], checkpoints[0]); checkpointsChecked++;
        // Compare uninterrupted reference with a resumed current owner, not
        // merely two restored twins with the same possible restore defect.
        if (tick !== stage.ticks) sessions[1] = await owners[1]!.restoreWithStepRecovery(checkpoints[1],
          f.anatomyId as never, inputs as never, 1, f.mechanismResearchInputs as never);
      }
    }
  }
  console.log(JSON.stringify({ preset: index, ticksChecked, checkpointsChecked, status: "bit-identical" }));
}
const report = { schemaId: "main-wire-candidate-performance-equivalence-v1",
  artifactSha256: metadata.artifactSha256, referenceArtifactSha256: createHash("sha256").update(bytes).digest("hex"),
  ticksChecked, checkpointsChecked, status: "bit-identical" };
if (values.output) await writeFile(values.output, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report));
