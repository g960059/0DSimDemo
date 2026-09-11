import { afterEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, readFile, writeFile, rm, mkdir } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { build } from "esbuild";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { openFittingRunJournalV1 as open, runJournaledFittingBatchV1 as batch } from "@/tools/scientific/FittingRunJournalV1";
import { runFittingJsonWorkersV1 as workers } from "@/tools/scientific/runFittingJsonWorkersV1";
import { beginFittingSourceSnapshotV1 as beginSource, resumeFittingSourceSnapshotV1 as resumeSource } from "@/tools/scientific/FittingSourceSnapshotV1";
import { fittingFileSha256V1 as fileHash } from "@/tools/scientific/SealedFittingRunV1";
import { searchMainWireCaseFittingV1 as search, readMainWireCaseSearchCoordinateV1 as coordinate } from "@/analysis/methods/mainWire/MainWireCaseFittingSearchV1";
import { mainWireStaticCaseFittingSeedV1 as seed } from "@/tools/scientific/MainWireStaticCaseFittingSeedV1";
import type { MainWireStaticCaseCandidateV1 as Candidate, runMainWireStaticCaseFittingV1 as fit } from "@/analysis/methods/mainWire/MainWireStaticCaseFittingWorkflowV1";

vi.mock("@/tools/scientific/runFittingJsonWorkersV1", () => ({ runFittingJsonWorkersV1: vi.fn() }));
type Journal = Awaited<ReturnType<typeof open>>;
const dirs: string[] = [], journals: Journal[] = [];
const identity = { sourceSha256: "a".repeat(64), planSha256: "b".repeat(64) };
const make = async () => { const directory = await mkdtemp(join(tmpdir(), "fitting-journal-test-")); dirs.push(directory); return directory; };
const start = async (directory: string, resume = false, now = () => 0) => {
  const journal = await open({ directory, identity, maximumWallTimeMs: 60000, resume, now }); journals.push(journal); return journal;
};
afterEach(async () => {
  for (const journal of journals.splice(0)) await journal.close();
  for (const directory of dirs.splice(0)) await rm(directory, { recursive: true, force: true });
  vi.resetAllMocks();
});

describe("same-run fitting journal", () => {
  it("checks the actual source inventory/environment/archive and refuses to append to a seal", async () => {
    const dir = await make(), prefix = join(dir, "execution"), snapshot = await beginSource(prefix);
    expect((await resumeSource(prefix)).sourceSha256).toBe(snapshot.sourceSha256);
    const path = `${prefix}.started.json`, original = await readFile(path, "utf8"), manifest = JSON.parse(original);
    expect(manifest.files.some((f: { path: string }) => f.path === "appTheme.ts")).toBe(true);
    // Resolve the complete preparation graph from the archive itself. Bundling
    // does not run the ODE or borrow omitted source files from the live checkout.
    const extracted = join(dir, "extracted");
    await mkdir(extracted);
    await promisify(execFile)("tar", ["-xzf", `${prefix}.source.tar.gz`, "-C", extracted]);
    await expect(build({ absWorkingDir: extracted, entryPoints: ["tools/scientific/prepareMainWireRegistryReviewV1.ts"],
      bundle: true, write: false, format: "esm", platform: "node", packages: "external", logLevel: "silent" }))
      .resolves.toHaveProperty("errors", []);
    const changed = structuredClone(manifest);
    changed.files[0].sha256 = "c".repeat(64); changed.sourceSha256 = fileHash(JSON.stringify(changed.files));
    await writeFile(path, JSON.stringify(changed));
    await expect(resumeSource(prefix)).rejects.toThrow(/source\/archive\/environment differs/);
    await writeFile(path, JSON.stringify({ ...manifest, environment: { ...manifest.environment, node: "other-node" } }));
    await expect(resumeSource(prefix)).rejects.toThrow(/source\/archive\/environment differs/);
    await writeFile(path, original);
    const archive = await readFile(`${prefix}.source.tar.gz`);
    await writeFile(`${prefix}.source.tar.gz`, Buffer.concat([archive, Buffer.from("edited")]));
    await expect(resumeSource(prefix)).rejects.toThrow(/source\/archive\/environment differs/);
    await writeFile(`${prefix}.source.tar.gz`, archive);
    await expect(snapshot.finish(undefined as never)).rejects.toThrow(/explicit output-file list/);
    await snapshot.finish([]);
    await expect(resumeSource(prefix)).rejects.toThrow(/already sealed/);
  });

  it("retains active time and decision timestamps without charging time spent offline", async () => {
    const dir = await make(); let time = 0;
    const first = await start(dir, false, () => time);
    time = 15; expect(await first.stamp("poll-1")).toBe(15);
    time = 30; await first.close();
    time = 10000; const next = await start(dir, true, () => time);
    expect(next.spentMs()).toBe(30); expect(await next.stamp("poll-1")).toBe(15);
    time += 20; expect(await next.stamp("poll-2")).toBe(50);
    expect(next.remainingMs()).toBe(59950); expect(next.attempt).toBe(2);
  });

  it("rejects changed source, plan, budgets, and a concurrent writer", async () => {
    const dir = await make(), first = await start(dir);
    await expect(start(dir, true)).rejects.toThrow(/already active/);
    await first.close();
    for (const changed of [{ identity: { ...identity, sourceSha256: "c".repeat(64) } },
      { identity: { ...identity, planSha256: "c".repeat(64) } }, { maximumWallTimeMs: 60001 }])
      await expect(open({ directory: dir, identity, maximumWallTimeMs: 60000, resume: true, ...changed })).rejects.toThrow(/specification\/budget/);
    const next = await start(dir, true); expect(next.attempt).toBe(2);
  });

  it("charges one lost heartbeat after a hard kill, not the entire offline interval", async () => {
    const dir = await make(); let time = 0;
    const first = await start(dir, false, () => time); time = 12; await first.close();
    const path = join(dir, "run-budget.json"), data = JSON.parse(await readFile(path, "utf8"));
    // Fault fixture: the last heartbeat was active when the process disappeared.
    await writeFile(path, JSON.stringify({ ...data, active: true }));
    time = 100000; const next = await start(dir, true, () => time);
    expect(next.spentMs()).toBe(1012); expect(next.remainingMs()).toBe(58988);
  });

  it("atomically binds saved results to the full request and rejects edits", async () => {
    const dir = await make(), journal = await start(dir);
    const request = { dt: .002, inputs: { tbv: 5000 }, initialization: { anchor: "checkpoint-a" } };
    await journal.save("probe.json", request, { status: "ready", metric: 1 });
    expect(await journal.read("probe.json", request)).toEqual({ status: "ready", metric: 1 });
    await expect(journal.read("probe.json", { ...request, dt: .001 })).rejects.toThrow(/request differs/);
    await expect(journal.read("probe.json", { ...request, initialization: { anchor: "checkpoint-b" } })).rejects.toThrow(/request differs/);
    await expect(journal.save("probe.json", request, { status: "ready", metric: 2 })).rejects.toThrow(/changed/);
    const path = join(dir, "probe.json"), value = JSON.parse(await readFile(path, "utf8"));
    await writeFile(path, JSON.stringify({ ...value, metric: 3 }));
    await expect(journal.read("probe.json", request)).rejects.toThrow(/request differs/);
    await journal.close(); await expect(start(dir, true)).rejects.toThrow(/Saved work/);
  });

  it("executes only unfinished jobs of a partial batch; fine/cold/repeat jobs stay distinct", async () => {
    const dir = await make(), first = await start(dir);
    const jobs = ["cold-2ms", "cold-1ms", "independent-repeat-2ms"].map((id, i) => ({
      filename: `${id}.json`, input: { id, i }, identity: { inputs: 5000, dt: i === 1 ? .001 : .002, initialization: "cold" },
    }));
    const options = { scriptPath: "synthetic-only", concurrency: 2, jobs, remainingMs: () => 60000,
      onFailure: (e: Error) => ({ value: -1, message: e.message }), onBudget: () => ({ value: -2 }) };
    vi.mocked(workers).mockImplementationOnce(async r => {
      await r.onResult?.({ value: 0 }, 0); throw new DOMException("Injected interruption after saving", "AbortError");
    });
    await expect(batch({ ...options, journal: first })).rejects.toThrow(/Injected/); await first.close();
    const next = await start(dir, true), reused: boolean[] = [];
    vi.mocked(workers).mockImplementationOnce(async r => {
      expect(r.jobs.map(j => JSON.parse(j.input).id)).toEqual(["cold-1ms", "independent-repeat-2ms"]);
      // Completion order must not change result/selection order.
      await r.onResult?.({ value: 2 }, 1); await r.onResult?.({ value: 1 }, 0); return [];
    });
    expect(await batch({ ...options, journal: next, onResult: async (_v, i, old) => { reused[i] = old; } }))
      .toEqual([{ value: 0 }, { value: 1 }, { value: 2 }]);
    expect(reused).toEqual([true, false, false]); expect(workers).toHaveBeenCalledTimes(2);
    await expect(batch({ ...options, journal: next, jobs: [{ ...jobs[0]!, identity: { differentAnchor: true } }] })).rejects.toThrow(/request differs/);
    expect(workers).toHaveBeenCalledTimes(2);
  });

  it("records budget exhaustion as an operational hold without dispatching new workers", async () => {
    const journal = await start(await make());
    const values = await batch({ journal, scriptPath: "unused", concurrency: 1, remainingMs: () => 0,
      jobs: [{ filename: "final.json", input: {}, identity: {} }],
      onFailure: () => ({ status: "failure" }), onBudget: () => ({ status: "operational-held" }) });
    expect(values).toEqual([{ status: "operational-held" }]); expect(workers).not.toHaveBeenCalled();
  });

  it("retains a completed sibling when the deadline interrupts its batch", async () => {
    const journal = await start(await make());
    vi.mocked(workers).mockImplementationOnce(async r => {
      await r.onResult?.({ status: "ready" }, 0);
      if (!r.signal?.aborted) await new Promise<void>(resolve => r.signal!.addEventListener("abort", () => resolve(), { once: true }));
      throw new DOMException("deadline", "AbortError");
    });
    const result = await batch({ journal, scriptPath: "synthetic-only", concurrency: 2, remainingMs: () => 5,
      jobs: [0, 1].map(i => ({ filename: `job-${i}.json`, input: { i }, identity: { i } })),
      onFailure: () => ({ status: "failure" }), onBudget: () => ({ status: "operational-held" }) });
    expect(result).toEqual([{ status: "ready" }, { status: "operational-held" }]);
  });

  it("replays interrupted search polls and final pairs with the same proposals, anchors and budgets", async () => {
    const dir = await make(), c = seed("baseline"), target = coordinate(c, "tbv") + 100;
    // Synthetic transport/score fixture only; no claim of physiological evidence.
    const outcome = (candidateInputs: Candidate): Awaited<ReturnType<typeof fit>> => {
      const actual = coordinate(candidateInputs, "tbv"), passed = actual === target;
      return { status: "saved-result-ready", result: { candidateInputs, rest: { referenceId: "baseline",
        status: passed ? "passed" : "failed", assessment: {
          operating: [{ metricId: "test-volume", lower: target, upper: target, actual, status: passed ? "passed" : "failed" }],
          invalidOrFailedRetained: [], unavailable: [], anatomyReviewRequired: false,
        } } } } as unknown as Awaited<ReturnType<typeof fit>>;
    };
    let time = 0, attempt = 0;
    const executed: string[] = [], proposed: string[][] = [];
    const drive = (journal: Journal) => search({ referenceId: "baseline", candidateInputs: c, initialOutcome: outcome(c),
      coordinateIds: ["tbv"], maximumEvaluations: 3, maximumWallTimeMs: 60000, maximumFinalChecks: 1, reservedFinalWallTimeMs: 10000,
      timeSnapshot: key => journal.stamp(`search-${key}`),
      evaluateBatch: async jobs => {
        proposed.push(jobs.map(j => j.id));
        const values = [];
        for (const job of jobs) {
          const input = { candidateInputs: job.candidateInputs, anchorInputs: job.reuse?.candidateInputs };
          let saved = await journal.read<Awaited<ReturnType<typeof fit>>>(`${job.id}.json`, input);
          if (!saved) { time += 5; executed.push(job.id); saved = await journal.save(`${job.id}.json`, input, outcome(job.candidateInputs)); }
          values.push(saved);
          if (attempt === 0) throw new Error("interrupt-poll");
        }
        return values;
      },
      assessFinalCandidate: async e => {
        for (const dt of [.002, .001]) {
          const name = `${e.id}-final-${dt}.json`, input = { candidateInputs: e.candidateInputs, dt, initialization: "cold" };
          if (!await journal.read(name, input)) { time += 5; executed.push(name); await journal.save(name, input, { status: "synthetic-pass" }); }
          if (attempt === 1) throw new Error("interrupt-final");
        }
        return { status: "accepted", issues: [] };
      },
    });
    const first = await start(dir, false, () => time);
    await expect(drive(first)).rejects.toThrow("interrupt-poll"); await first.close();
    attempt = 1; time += 10000; const second = await start(dir, true, () => time);
    await expect(drive(second)).rejects.toThrow("interrupt-final"); await second.close();
    attempt = 2; time += 10000; const third = await start(dir, true, () => time), result = await drive(third);
    expect(proposed).toEqual(Array(3).fill(["evaluation-002", "evaluation-003"]));
    expect(executed).toEqual(["evaluation-002", "evaluation-003", "evaluation-003-final-0.002.json", "evaluation-003-final-0.001.json"]);
    expect(result.selectedFinalId).toBe("evaluation-003"); expect(result.evaluationCount).toBe(3);
    expect(result.finalChecks).toHaveLength(1); expect(result.maximumFinalChecks).toBe(1);
    expect(result.wallTimeMs).toBe(20); expect(third.spentMs()).toBe(20);
    expect(result.maximumEvaluations).toBe(3); expect(result.reservedFinalWallTimeMs).toBe(10000);
  });
});
