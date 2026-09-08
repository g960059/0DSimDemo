import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { resolve } from "node:path";

/** Shared local process transport for fitting and final qualification only.
 * Job order is preserved; completion order cannot choose a search incumbent. */
export async function runFittingJsonWorkersV1<T>(request: Readonly<{
  scriptPath: string; jobs: readonly Readonly<{ args: readonly string[]; input: string }>[];
  concurrency: number; signal?: AbortSignal;
}>): Promise<T[]> {
  if (!Number.isInteger(request.concurrency) || request.concurrency < 1 || request.concurrency > 8) throw new Error("Fitting concurrency must be 1–8");
  const scriptPath = request.scriptPath, signal = request.signal;
  const jobs = request.jobs.map(j => ({ args: [...j.args], input: j.input }));
  if (jobs.some(j => Buffer.byteLength(j.input) > 8 * 1_048_576)) throw new Error("Worker input exceeds 8 MiB");
  const active = new Set<ChildProcessWithoutNullStreams>(), timers = new Map<ChildProcessWithoutNullStreams, NodeJS.Timeout>();
  const values: T[] = new Array(jobs.length);
  let next = 0, interrupted = signal?.aborted ?? false;
  const terminate = (child: ChildProcessWithoutNullStreams) => {
    if (!active.has(child) || timers.has(child)) return;
    child.kill("SIGTERM");
    const timer = setTimeout(() => child.kill("SIGKILL"), 1_000); timer.unref(); timers.set(child, timer);
  };
  const stop = () => { for (const child of active) terminate(child); };
  const abort = () => { interrupted = true; stop(); };
  const onInt = () => { process.exitCode = 130; abort(); }, onTerm = () => { process.exitCode = 143; abort(); };
  process.once("SIGINT", onInt); process.once("SIGTERM", onTerm); signal?.addEventListener("abort", abort, { once: true });
  const pending = Array.from({ length: Math.min(request.concurrency, jobs.length) }, async () => {
    while (next < jobs.length) {
      if (interrupted) throw new DOMException("Fitting workers interrupted", "AbortError");
      const i = next++;
      values[i] = await execute(jobs[i]!);
    }
  });
  try {
    await Promise.all(pending);
    if (interrupted) throw new DOMException("Fitting workers interrupted", "AbortError");
    return values;
  } catch (error) {
    // Stop launching queued jobs as well as terminating active siblings.
    next = jobs.length; stop(); await Promise.allSettled(pending);
    if (interrupted) throw new DOMException("Fitting workers interrupted", "AbortError");
    throw error;
  } finally {
    process.off("SIGINT", onInt); process.off("SIGTERM", onTerm); signal?.removeEventListener("abort", abort);
  }
  function execute(job: typeof jobs[number]): Promise<T> {
    const child = spawn(process.execPath, [resolve("node_modules/vite-node/vite-node.mjs"), "--script", scriptPath, ...job.args],
      // Vite otherwise interprets stdin EOF as shutdown before async output.
      { cwd: process.cwd(), env: { ...process.env, CI: "true" }, stdio: ["pipe", "pipe", "pipe"] });
    active.add(child);
    return new Promise((resolveValue, reject) => {
      const stdout: Buffer[] = []; let outBytes = 0, errBytes = 0, failure: Error | null = null;
      const fail = (error: Error) => { failure ??= error; terminate(child); };
      child.stdout.on("data", (b: Buffer) => {
        outBytes += b.length;
        if (outBytes > 64 * 1_048_576) fail(new Error("Worker stdout exceeds 64 MiB")); else stdout.push(b);
      });
      child.stderr.on("data", (b: Buffer) => {
        errBytes += b.length;
        if (errBytes > 1_048_576) fail(new Error("Worker stderr exceeds 1 MiB")); else process.stderr.write(b);
      });
      child.once("error", error => { failure ??= error; }); child.stdin.once("error", fail);
      child.once("close", (code, signal) => {
        active.delete(child); clearTimeout(timers.get(child)); timers.delete(child);
        if (failure !== null || code !== 0) { reject(new Error(`Fitting worker failed: ${failure?.message ?? `exit ${code ?? signal}`}`)); return; }
        try { resolveValue(JSON.parse(Buffer.concat(stdout).toString("utf8")) as T); }
        catch (error) { reject(new Error(`Fitting worker returned invalid JSON: ${error instanceof Error ? error.message : String(error)}`)); }
      });
      child.stdin.end(job.input);
    });
  }
}

export async function readFittingWorkerStdinV1(maximumBytes = 8 * 1_048_576): Promise<unknown> {
  const chunks: Buffer[] = []; let bytes = 0;
  for await (const chunk of process.stdin) {
    const b = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk); bytes += b.length;
    if (bytes > maximumBytes) throw new Error("Fitting worker stdin exceeds its bound"); chunks.push(b);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
