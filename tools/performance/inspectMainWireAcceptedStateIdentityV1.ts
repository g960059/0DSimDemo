import {
  MainWireIntegratedModelSessionV3,
  mainWireIntegratedModelPresentationTargetTimeSecV3,
} from "@/engine/myocardium/MainWireIntegratedModelSessionV3";
import {
  measureCanonicalFlatDataV1,
} from "@/engine/vnext/CanonicalFlatDataV1";

const INSPECTED_TICKS = 1_024;
const session = await MainWireIntegratedModelSessionV3.create();
const initial = session.currentAcceptedState();
const entries = collectObjectEntries(initial);

for (let tick = 1; tick <= INSPECTED_TICKS; tick += 1) {
  const advance = session.advanceToPresentationTime(
    mainWireIntegratedModelPresentationTargetTimeSecV3(tick),
  );
  if (advance.status !== "advanced") {
    throw new Error(`identity inspection failed at tick ${tick}`);
  }
  const current = session.currentAcceptedState();
  for (const entry of entries) {
    const value = valueAtPath(current, entry.path);
    if (value !== entry.previous) entry.identityChangeCount += 1;
    entry.previous = value;
  }
}

const stable = entries.filter(({ identityChangeCount }) =>
  identityChangeCount === 0
);
const maximalStable = stable.filter((entry) =>
  !stable.some((candidate) =>
    candidate.path.length < entry.path.length
      && isPrefix(candidate.path, entry.path)
  )
);
const churning = entries.filter(({ identityChangeCount }) =>
  identityChangeCount > 0
);

process.stdout.write(`${JSON.stringify({
  schemaId: "circleheart-accepted-state-identity-inspection-v1",
  inspectedTicks: INSPECTED_TICKS,
  objectNodeCount: entries.length,
  maximalStableRoots: maximalStable
    .map(reportEntry)
    .sort(byCanonicalBytesThenPointer),
  largestChurningRoots: churning
    .map(reportEntry)
    .sort(byCanonicalBytesThenPointer)
    .slice(0, 32),
}, null, 2)}\n`);

type PathSegment = string | number;
type MutableEntry = {
  path: readonly PathSegment[];
  pointer: string;
  kind: string;
  canonicalBytes: number;
  previous: unknown;
  identityChangeCount: number;
};

function collectObjectEntries(root: unknown): MutableEntry[] {
  const entries: MutableEntry[] = [];
  const visit = (value: unknown, path: readonly PathSegment[]): void => {
    if (value === null || typeof value !== "object") return;
    entries.push({
      path: Object.freeze([...path]),
      pointer: pointer(path),
      kind: Array.isArray(value)
        ? "array"
        : ArrayBuffer.isView(value)
          ? value.constructor.name
          : "record",
      canonicalBytes: measureCanonicalFlatDataV1(value),
      previous: value,
      identityChangeCount: 0,
    });
    if (ArrayBuffer.isView(value)) return;
    for (const key of Object.keys(value)) {
      visit(
        requiredOwnValue(value, key),
        [...path, Array.isArray(value) ? Number(key) : key],
      );
    }
  };
  visit(root, []);
  return entries;
}

function valueAtPath(root: unknown, path: readonly PathSegment[]): unknown {
  let current = root;
  for (const segment of path) {
    if (current === null || typeof current !== "object") return undefined;
    current = requiredOwnValue(current, String(segment));
  }
  return current;
}

function requiredOwnValue(record: object, key: string): unknown {
  const descriptor = Object.getOwnPropertyDescriptor(record, key);
  if (descriptor === undefined || !("value" in descriptor)) {
    throw new Error(`identity inspection property ${key} is unavailable`);
  }
  return descriptor.value;
}

function isPrefix(
  prefix: readonly PathSegment[],
  candidate: readonly PathSegment[],
): boolean {
  return prefix.every((segment, index) => candidate[index] === segment);
}

function reportEntry(entry: MutableEntry) {
  return {
    pointer: entry.pointer,
    kind: entry.kind,
    canonicalBytes: entry.canonicalBytes,
    identityChangeCount: entry.identityChangeCount,
  };
}

function byCanonicalBytesThenPointer(
  left: ReturnType<typeof reportEntry>,
  right: ReturnType<typeof reportEntry>,
): number {
  return right.canonicalBytes - left.canonicalBytes
    || left.pointer.localeCompare(right.pointer);
}

function pointer(path: readonly PathSegment[]): string {
  if (path.length === 0) return "";
  return `/${path.map((segment) => String(segment)
    .replaceAll("~", "~0")
    .replaceAll("/", "~1")).join("/")}`;
}
