import { EventEmitter } from "node:events";
import { spawn } from "node:child_process";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { runFittingJsonWorkersV1 as run } from "@/tools/scientific/runFittingJsonWorkersV1";

vi.mock("node:child_process", () => ({ spawn: vi.fn() }));
class Child extends EventEmitter {
  stdout = new EventEmitter(); stderr = new EventEmitter();
  stdin = Object.assign(new EventEmitter(), { end: vi.fn() });
  kill = vi.fn((signal: string) => { queueMicrotask(() => this.emit("close", null, signal)); return true; });
  finish(value: string, code = 0) { this.stdout.emit("data", Buffer.from(value)); this.emit("close", code, null); }
}
const children: Child[] = [];
const jobs = () => [0, 1, 2].map(n => ({ input: JSON.stringify(n), args: [`--job-${n}`] }));
beforeEach(() => {
  children.length = 0; vi.mocked(spawn).mockReset();
  vi.mocked(spawn).mockImplementation(() => { const c = new Child(); children.push(c); return c as never; });
});

describe("bounded fitting JSON process transport", () => {
  it("bounds active jobs, preserves submission order, and owns queued input before waiting", async () => {
    const request = { scriptPath: "/original.ts", jobs: jobs(), concurrency: 2 };
    const pending = run<number>(request);
    expect(children).toHaveLength(2);
    request.scriptPath = "/changed.ts"; request.jobs[2]!.input = "999"; request.jobs[2]!.args[0] = "--changed";
    children[1]!.finish("1");
    await Promise.resolve();
    expect(children).toHaveLength(3);
    expect(vi.mocked(spawn).mock.calls[2]![1]).toContain("/original.ts");
    expect(vi.mocked(spawn).mock.calls[2]![1]).toContain("--job-2");
    expect(children[2]!.stdin.end).toHaveBeenCalledWith("2");
    children[2]!.finish("2"); children[0]!.finish("0");
    expect(await pending).toEqual([0, 1, 2]);
  });
  it("launches nothing for invalid bounds or a pre-aborted request", async () => {
    for (const concurrency of [0, 9, 1.2]) await expect(run({ scriptPath: "x", jobs: jobs(), concurrency })).rejects.toThrow(/concurrency/);
    await expect(run({ scriptPath: "x", jobs: [{ args: [], input: "x".repeat(8 * 1_048_576 + 1) }], concurrency: 1 })).rejects.toThrow(/8 MiB/);
    const controller = new AbortController(); controller.abort();
    await expect(run({ scriptPath: "x", jobs: jobs(), concurrency: 2, signal: controller.signal })).rejects.toThrow(/interrupted/);
    expect(children).toHaveLength(0);
  });
  it.each(["invalid-json", "nonzero-exit"])("stops siblings and queued work on %s", async kind => {
    const listeners = process.listenerCount("SIGINT");
    const pending = run({ scriptPath: "x", jobs: jobs(), concurrency: 2 });
    const rejected = expect(pending).rejects.toThrow(kind === "invalid-json" ? /invalid JSON/ : /exit 1/);
    children[0]!.finish(kind === "invalid-json" ? "not-json" : "{}", kind === "invalid-json" ? 0 : 1);
    await rejected;
    expect(children).toHaveLength(2);
    expect(children[1]!.kill).toHaveBeenCalledWith("SIGTERM");
    expect(process.listenerCount("SIGINT")).toBe(listeners);
  });
  it("waits for terminated children and removes signal listeners on cancellation", async () => {
    const controller = new AbortController(), listeners = process.listenerCount("SIGTERM");
    const pending = run({ scriptPath: "x", jobs: jobs(), concurrency: 2, signal: controller.signal });
    const rejected = expect(pending).rejects.toThrow(/interrupted/); controller.abort(); await rejected;
    expect(children).toHaveLength(2);
    expect(children.every(c => c.kill.mock.calls.length === 1)).toBe(true);
    expect(process.listenerCount("SIGTERM")).toBe(listeners);
  });
  it("saves each completion before reusing its slot, without waiting for siblings", async () => {
    let saved!: () => void;
    const storage = new Promise<void>(resolve => { saved = resolve; });
    const onResult = vi.fn(async (_value: number, index: number) => { if (index === 1) await storage; });
    const pending = run<number>({ scriptPath: "x", jobs: jobs(), concurrency: 2, onResult });
    children[1]!.finish("1"); await Promise.resolve();
    expect(onResult).toHaveBeenCalledWith(1, 1);
    expect(children).toHaveLength(2);
    saved(); await storage; await Promise.resolve();
    expect(children).toHaveLength(3);
    children[2]!.finish("2"); children[0]!.finish("0");
    expect(await pending).toEqual([0, 1, 2]);
  });
  it("optionally isolates a failed job while preserving its failure and all other outcomes", async () => {
    const onResult = vi.fn(async () => {});
    const pending = run<number | string>({ scriptPath: "x", jobs: jobs(), concurrency: 2,
      onFailure: async error => error.message, onResult });
    children[0]!.finish("bad-json");
    for (let i = 0; i < 5; i++) await Promise.resolve();
    expect(children).toHaveLength(3); expect(children[1]!.kill).not.toHaveBeenCalled();
    children[2]!.finish("2"); children[1]!.finish("1");
    expect(await pending).toEqual([expect.stringContaining("invalid JSON"), 1, 2]);
    expect(onResult).toHaveBeenCalledTimes(3);
  });
  it("does not isolate a persistence failure as a physiological or process result", async () => {
    const pending = run({ scriptPath: "x", jobs: jobs(), concurrency: 2,
      onFailure: async () => ({ ignored: true }), onResult: async () => { throw new Error("disk full"); } });
    const rejected = expect(pending).rejects.toThrow("disk full");
    children[0]!.finish("{}"); await rejected;
    expect(children).toHaveLength(2); expect(children[1]!.kill).toHaveBeenCalled();
  });
});
