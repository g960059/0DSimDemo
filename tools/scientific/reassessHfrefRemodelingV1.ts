import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve, join } from "node:path";
import { parseArgs } from "node:util";
import { fileURLToPath } from "node:url";
import { canonicalJsonStringify, sha256CanonicalJsonHex } from "@/engine/integrity";
import { resolveMainWireFittingReferenceV1 } from "@/analysis/registry/MainWireFittingReferenceRegistryV1";
import { assessMainWireHfrefDilatedRestV1 as assess } from "@/analysis/policies/mainWire/MainWireHfrefDilatedReferenceV1";
import { observeMainWireHfrefCaseV2 as observe } from "@/analysis/methods/mainWire/MainWireHfrefCaseObservationV2";
import { beginFittingSourceSnapshotV1 } from "./FittingSourceSnapshotV1";

type Saved = {
  protocol: string; status: string; dt: number; constructionSha256: string;
  point: { active: number; referenceArea: number; wallVolume: number };
  candidate: unknown; resultSha256: string;
  classification: { status: string }; auditClassification: { status: string };
  completedBeat: Parameters<typeof observe>[0]; terminalTrace: Parameters<typeof observe>[1];
  timingAndInletTrace?: Parameters<typeof observe>[1];
};
const hash = (bytes: Uint8Array | string) => createHash("sha256").update(bytes).digest("hex");
const protocol = "hfref-static-lv-septal-remodeling-fixed-coronary-bed-v2";
const points = [1, .35].flatMap(active => [1, 1.15].flatMap(referenceArea =>
  [1, 1.25].map(wallVolume => ({ active, referenceArea, wallVolume }))));

/** Re-observation, not reintegration. Reject unrepaired constructions and retain
 * the exact source/result hashes rather than relabeling old outputs as new runs. */
export async function readHfrefRemodelingAssessmentBatchV1(inputDirectory: string) {
  const directory = resolve(inputDirectory);
  const sidecarBytes = await readFile(join(directory, "execution.source.json"));
  const sidecar = JSON.parse(sidecarBytes.toString()) as {
    sourceSha256: string; files: unknown[]; archive: { filename: string; sha256: string };
    results: { filename: string; sha256: string }[];
  };
  if (sidecar.archive.filename !== "execution.source.tar.gz"
    || hash(JSON.stringify(sidecar.files)) !== sidecar.sourceSha256
    || hash(await readFile(join(directory, sidecar.archive.filename))) !== sidecar.archive.sha256) {
    throw new Error("Remodeling execution source archive mismatch");
  }
  const verifiedRead = async (filename: string) => {
    const bytes = await readFile(join(directory, filename));
    if (hash(bytes) !== sidecar.results.find(r => r.filename === filename)?.sha256) throw new Error(`Unbound remodeling output: ${filename}`);
    return JSON.parse(bytes.toString());
  };
  const plan = await verifiedRead("plan.json") as { protocol: string; dt: number; points: typeof points; sourceSha256: string };
  if (plan.protocol !== protocol || ![.001, .002].includes(plan.dt) || plan.sourceSha256 !== sidecar.sourceSha256
    || canonicalJsonStringify(plan.points) !== canonicalJsonStringify(points)) throw new Error("Not the repaired, sealed remodeling factorial");
  const cases = [];
  for (let i = 0; i < points.length; i++) {
    const saved = await verifiedRead(`case-${i}.json`) as Saved;
    const { resultSha256, ...body } = saved;
    if (saved.protocol !== protocol || saved.dt !== plan.dt || saved.status !== "observed"
      || saved.classification.status !== "period1-converged" || saved.auditClassification.status !== "period1-converged"
      || canonicalJsonStringify(saved.point) !== canonicalJsonStringify(points[i])
      || resultSha256 !== await sha256CanonicalJsonHex(body)
      || saved.constructionSha256 !== await sha256CanonicalJsonHex({ protocol, point: saved.point, candidate: saved.candidate })) {
      throw new Error(`Remodeling case ${i} is not a source-bound observed construction`);
    }
    cases.push({ caseIndex: i, point: saved.point, originalResultSha256: resultSha256,
      constructionSha256: saved.constructionSha256,
      observation: observe(saved.completedBeat, saved.timingAndInletTrace ?? saved.terminalTrace) });
  }
  return { origin: { directory, sourceSha256: sidecar.sourceSha256,
    sidecarSha256: hash(sidecarBytes), archive: sidecar.archive }, dt: plan.dt,
    cases: cases.map(c => ({ ...c, assessment: assess(c.observation, cases[0]!.observation) })) };
}

async function main() {
  const { values } = parseArgs({ options: { input: { type: "string", multiple: true }, output: { type: "string" } } });
  if (!values.input?.length || !values.output) throw new Error("Require --input SEALED_FACTORIAL_DIRECTORY (repeatable) --output NEW_DIRECTORY");
  const output = resolve(values.output); await mkdir(output);
  const source = await beginFittingSourceSnapshotV1(join(output, "analysis"));
  const reference = resolveMainWireFittingReferenceV1("hfref-chronic-dilated-v1");
  const batches = [];
  for (const directory of values.input) batches.push(await readHfrefRemodelingAssessmentBatchV1(directory));
  const body = { schemaId: "hfref-chronic-dilated-reassessment-v1", reference,
    referenceSha256: await sha256CanonicalJsonHex(reference), analysisSourceSha256: source.sourceSha256,
    originalExecutionProtocol: protocol, newNumericalExecutions: 0, retrospectiveAssessment: true,
    originalObservationsOverwritten: false, batches,
    qualificationHolds: ["pressure-matched passive mechanics not assessed",
      "static geometry/pericardium/coronary compatibility not qualified", "raw waveform and energetic claims require their own evidence"],
    publicPromotionAuthorized: false, finalQualificationPerformed: false };
  const jsonPath = join(output, "report.json"), markdownPath = join(output, "SUMMARY.md");
  await writeFile(jsonPath, JSON.stringify({ ...body, reportSha256: await sha256CanonicalJsonHex(body) }, null, 2) + "\n", { flag: "wx" });
  const fmt = (value: number | null | undefined) => value === null || value === undefined ? "未測定" : value.toFixed(2);
  const lines = ["# 慢性左室拡大型referenceによる再評価", "", "原データを再観測した後向き評価。数値計算の再実行・presetの採用ではない。", "",
    `Reference: ${body.referenceSha256}`, ""];
  for (const batch of batches) {
    lines.push(`## dt = ${batch.dt * 1000} ms`, "", "| 条件 A/G/M | EF % | EDVI | CI | mean Ao | mean LA | Weiss τ ms | screen | 目標 |", "|---|---:|---:|---:|---:|---:|---:|---|---|");
    for (const c of batch.cases) {
      const v = c.observation.values, a = c.assessment;
      lines.push(`| ${c.point.active}/${c.point.referenceArea}/${c.point.wallVolume} | ${fmt(v.lvef * 100)} | ${fmt(v.lvedvi)} | ${fmt(v.ci)} | ${fmt(v.meanAo)} | ${fmt(v.meanLa)} | ${fmt(v.weissTauMs)} | ${a.status} | ${a.preferenceStatus} |`);
    }
    lines.push("", "数値が得られたことと、症例の説明が成立したことは別。目標範囲外は疾患としての不成立を意味しない。", "");
  }
  lines.push("## この症例で説明する内容", "");
  for (const f of reference.target.evidence.features) lines.push(`- ${f.label}：${f.expectedFinding} ${f.limitation}`);
  lines.push("", "各条件の実測値、baselineとの差、未測定項目、測定品質と出典はreport.jsonに保存。設計意図を実証済みの説明として転記しない。", "");
  await writeFile(markdownPath, lines.join("\n"), { flag: "wx" });
  await source.finish([jsonPath, markdownPath]);
  process.stdout.write(JSON.stringify({ output, newNumericalExecutions: 0,
    batches: batches.map(b => ({ dt: b.dt, screenPassed: b.cases.filter(c => c.assessment.screenPassed).length,
      targetsMet: b.cases.filter(c => c.assessment.screenPassed && c.assessment.preferredTargetsMet).length,
      unresolvedPreferences: b.cases.filter(c => c.assessment.preferenceStatus === "unresolved").length })),
    publicPromotionAuthorized: false }) + "\n");
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { process.stderr.write(String(error) + "\n"); process.exitCode = 1; });
}
