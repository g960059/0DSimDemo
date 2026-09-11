import { readFile, readdir, unlink, writeFile } from "node:fs/promises";
import { writeFileSync, renameSync } from "node:fs";
import { join } from "node:path";
import { hostname } from "node:os";
import { canonicalJsonStringify as canonical } from "@/engine/integrity";
import { fittingFileSha256V1 as hash } from "./SealedFittingRunV1";
import { writeFittingRunJsonV1 as writeJson, writeFittingRunTextV1 as writeText } from "./FittingRunFilesV1";
import { runFittingJsonWorkersV1 as workers } from "./runFittingJsonWorkersV1";

const RECEIPT = "fittingRunReceiptV1";
const HEARTBEAT_MS = 1000;
const missing = (error: unknown) => (error as NodeJS.ErrnoException).code === "ENOENT";
type Identity = { sourceSha256: string; planSha256: string };
type Receipt = Identity & { requestSha256: string; valueSha256: string; spentMs: number };
type Budget = Identity & { maximumWallTimeMs: number; spentMs: number; active: boolean; attempt: number };

/** Same-run replay only. Atomic result+receipt files survive a killed parent;
 * named clock observations reproduce completed search decisions, while the
 * active-time ledger still charges replay, interrupted work and new workers.
 * No cross-run cache, job graph, or transfer of numerical checkpoints. */
export async function openFittingRunJournalV1(request: {
  directory: string; identity: Identity; maximumWallTimeMs: number; resume: boolean;
  now?: () => number;
}) {
  const { directory, identity, maximumWallTimeMs } = request;
  if (!Number.isFinite(maximumWallTimeMs) || maximumWallTimeMs <= 0
    || Object.values(identity).some(x => !/^[a-f0-9]{64}$/.test(x))) throw new Error("Invalid fitting run identity/budget");
  const lockPath = join(directory, "run.lock.json"), budgetPath = join(directory, "run-budget.json");
  const owner = JSON.stringify({ pid: process.pid, host: hostname() });
  try { await writeFile(lockPath, owner, { flag: "wx" }); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST" || !request.resume) throw error;
    const bytes = await readFile(lockPath, "utf8"), old = JSON.parse(bytes) as { pid: number; host: string };
    if (old.host !== hostname() || !Number.isSafeInteger(old.pid) || old.pid <= 0) throw new Error("Fitting run lock needs inspection");
    let alive = true;
    try { process.kill(old.pid, 0); } catch (e) { if ((e as NodeJS.ErrnoException).code === "ESRCH") alive = false; else throw e; }
    if (alive || await readFile(lockPath, "utf8") !== bytes) throw new Error("Fitting run is already active");
    await unlink(lockPath); await writeFile(lockPath, owner, { flag: "wx" });
  }
  const now = request.now ?? (() => performance.now()), members = new Set<string>();
  let budget: Budget, timer: NodeJS.Timeout | undefined;
  try {
    if (request.resume) {
      budget = JSON.parse(await readFile(budgetPath, "utf8")) as Budget;
      if (budget.sourceSha256 !== identity.sourceSha256 || budget.planSha256 !== identity.planSha256
        || budget.maximumWallTimeMs !== maximumWallTimeMs || !Number.isFinite(budget.spentMs) || budget.spentMs < 0
        || !Number.isSafeInteger(budget.attempt) || budget.attempt < 1 || typeof budget.active !== "boolean")
        throw new Error("Fitting resume specification/budget differs");
      // Account for an unrecorded hard-kill tail with one heartbeat second.
      // This is approximate (a stalled event loop can delay a heartbeat), not
      // an exact death-time measurement. Do not charge time spent offline.
      if (budget.active) budget.spentMs += HEARTBEAT_MS;
      budget.attempt++;
      for (const entry of await readdir(directory, { withFileTypes: true })) {
        if (!entry.isFile() || !/\.(json|md)$/.test(entry.name) || /^(execution\.|run-budget\.|run\.lock)/.test(entry.name)) continue;
        members.add(join(directory, entry.name));
        if (!entry.name.endsWith(".json")) continue;
        const data = JSON.parse(await readFile(join(directory, entry.name), "utf8"));
        const receipt = data[RECEIPT] as Receipt | undefined;
        if (receipt) {
          const { [RECEIPT]: _, ...value } = data;
          if (!sameIdentity(receipt) || receipt.valueSha256 !== hash(canonical(value))
            || !Number.isFinite(receipt.spentMs) || receipt.spentMs < 0 || receipt.spentMs > budget.spentMs)
            throw new Error("Saved work exceeds or differs from the retained run budget");
        }
      }
    } else budget = { ...identity, maximumWallTimeMs, spentMs: 0, active: false, attempt: 1 };
    const carriedMs = budget.spentMs, started = now();
    let closed = false;
    const spentMs = () => carriedMs + Math.max(0, now() - started);
    const checkpointBudget = (active = true) => {
      budget = { ...budget, spentMs: spentMs(), active };
      const temporary = `${budgetPath}.${process.pid}.tmp`;
      writeFileSync(temporary, JSON.stringify(budget) + "\n"); renameSync(temporary, budgetPath);
    };
    checkpointBudget();
    timer = setInterval(checkpointBudget, HEARTBEAT_MS); timer.unref();
    const filename = (name: string) => {
      if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(name)) throw new Error("Invalid journal filename");
      return join(directory, name);
    };
    const requestHash = (name: string, input: unknown) => hash(canonical({ ...identity, name, input }));
    const read = async <T extends object>(name: string, input: unknown): Promise<T | undefined> => {
      let data: Record<string, unknown>;
      try { data = JSON.parse(await readFile(filename(name), "utf8")); }
      catch (error) { if (missing(error)) return undefined; throw error; }
      const { [RECEIPT]: receipt, ...value } = data, r = receipt as Receipt | undefined;
      if (!r || !sameIdentity(r) || r.requestSha256 !== requestHash(name, input)
        || r.valueSha256 !== hash(canonical(value)) || !Number.isFinite(r.spentMs) || r.spentMs < 0 || r.spentMs > spentMs())
        throw new Error(`Fitting journal result/request differs: ${name}`);
      members.add(filename(name)); return value as T;
    };
    const save = async <T extends object>(name: string, input: unknown, value: T): Promise<T> => {
      if (!value || Array.isArray(value) || RECEIPT in value) throw new Error("Journal values must be plain result objects");
      const existing = await read<T>(name, input);
      if (existing !== undefined) {
        if (canonical(existing) !== canonical(value)) throw new Error(`Fitting journal replay changed a saved result: ${name}`);
        return existing;
      }
      checkpointBudget();
      const receipt: Receipt = { ...identity, requestSha256: requestHash(name, input), valueSha256: hash(canonical(value)), spentMs: budget.spentMs };
      members.add(await writeJson(directory, name, { ...value, [RECEIPT]: receipt }));
      return value;
    };
    const event = async <T>(key: string, input: unknown, create: () => Promise<T> | T): Promise<T> => {
      const name = `journal-${key}.json`, old = await read<{ value: T }>(name, input);
      return old ? old.value : (await save(name, input, { value: await create() })).value;
    };
    const plainText = async (name: string, text: string) => {
      try {
        if (await readFile(filename(name), "utf8") !== text) throw new Error(`Fitting replay changed a saved file: ${name}`);
        members.add(filename(name));
      } catch (error) { if (!missing(error)) throw error; members.add(await writeText(directory, name, text)); }
    };
    return { attempt: budget.attempt, spentMs, remainingMs: () => Math.max(0, maximumWallTimeMs - spentMs()),
      event, read, save, checkpointBudget,
      stamp: (key: string) => event(`clock-${key}`, { clock: "active-run-ms" }, spentMs),
      saveJson: (name: string, value: unknown) => plainText(name, JSON.stringify(value, null, 2) + "\n"),
      saveText: plainText, files: () => [...members].sort(),
      close: async () => {
        if (closed) return; closed = true; clearInterval(timer); checkpointBudget(false);
        if (await readFile(lockPath, "utf8") !== owner) throw new Error("Fitting run lock changed");
        await unlink(lockPath);
      },
    };
  } catch (error) { clearInterval(timer); await unlink(lockPath); throw error; }
  function sameIdentity(value: Identity) { return value.sourceSha256 === identity.sourceSha256 && value.planSha256 === identity.planSha256; }
}

/** Only unfinished jobs of this named batch execute. An overall deadline is a
 * recorded operational hold; an external interruption leaves the batch open. */
export async function runJournaledFittingBatchV1<T extends object>(request: {
  journal: Awaited<ReturnType<typeof openFittingRunJournalV1>>;
  scriptPath: string; concurrency: number; remainingMs: () => number;
  jobs: readonly { filename: string; input: unknown; identity: unknown }[];
  onFailure: (error: Error, index: number) => T;
  onBudget: (index: number) => T;
  onResult?: (value: T, index: number, reused: boolean) => Promise<void>;
}) {
  const { journal, jobs } = request, values: (T | undefined)[] = new Array(jobs.length), pending: number[] = [];
  for (const [i, job] of jobs.entries()) {
    await journal.event(`request-${job.filename}`, job.identity, () => job.identity);
    values[i] = await journal.read<T>(job.filename, job.identity);
    if (values[i] === undefined) pending.push(i);
    else await request.onResult?.(values[i]!, i, true);
  }
  const complete = async (value: T, i: number) => {
    const job = jobs[i]!;
    values[i] = await journal.save(job.filename, job.identity, value);
    await request.onResult?.(value, i, false);
  };
  const remaining = request.remainingMs();
  if (pending.length && remaining > 0) {
    const signal = AbortSignal.timeout(Math.max(1, Math.ceil(remaining)));
    try {
      await workers<T>({ scriptPath: request.scriptPath, concurrency: request.concurrency, signal,
        jobs: pending.map(i => ({ args: ["--worker"], input: JSON.stringify(jobs[i]!.input) })),
        onResult: (value, i) => complete(value, pending[i]!),
        onFailure: async (error, i) => request.onFailure(error, pending[i]!),
      });
    } catch (error) {
      if (!signal.aborted || (error as Error).name !== "AbortError") throw error;
    }
  }
  for (const i of pending) if (values[i] === undefined) await complete(request.onBudget(i), i);
  return values as T[];
}
