import {
  readFlatNumericalStatePathV1,
  type FlatNumericalPathSegmentV1,
} from "@/engine/vnext/FlatNumericalStateV1";
import {
  createMainWireAcceptedTypedBoundaryBindingV1,
} from "@/engine/vnext/MainWireAcceptedTypedBoundaryV1";
import {
  createMainWireAcceptedTypedHemodynamicBindingV1,
} from "@/engine/vnext/MainWireAcceptedTypedHemodynamicV1";
import {
  createMainWireAcceptedTypedStateManifestV1,
} from "@/engine/vnext/MainWireAcceptedTypedStateV1";
import {
  MainWireFlatAuthoritativeReferenceSessionV1,
} from "@/engine/vnext/MainWireFlatAuthoritativeReferenceSessionV1";

const INSPECTED_SUBSTEPS = 1_024;
const SUBSTEP_SEC = 0.002;
const HOT_CHANGE_THRESHOLD = Math.floor(INSPECTED_SUBSTEPS * 0.9);
const ABSENT = Symbol("absent");

const session = await MainWireFlatAuthoritativeReferenceSessionV1.create();
const initial = session.currentAcceptedState();
const manifest = createMainWireAcceptedTypedStateManifestV1(initial);
const boundary = createMainWireAcceptedTypedBoundaryBindingV1(manifest);
const hemodynamic = createMainWireAcceptedTypedHemodynamicBindingV1(manifest);
const retainedContinuous = new Set([
  ...boundary.directContinuousSlots,
  ...boundary.regularAtrialSourceContinuousSlots,
  ...boundary.postSolverContinuousSlots,
  ...hemodynamic.solverRetainedContinuousSlots,
]);
const retainedBooleans = new Set(hemodynamic.solverRetainedBooleanSlots);
const retainedStrings = new Set([
  hemodynamic.mechanicsMaterialFingerprintStringSlot,
]);
const counters = {
  continuous: manifest.numericalLayout.continuousSlots.map((slot, index) =>
    mutableCounter(slot.path, slot.pointer, retainedContinuous.has(index))),
  nullableContinuous:
    manifest.numericalLayout.nullableContinuousSlots.map((slot) =>
      mutableCounter(slot.path, slot.pointer, false)),
  nullableString: manifest.numericalLayout.nullableStringSlots.map((slot) =>
    mutableCounter(slot.path, slot.pointer, false)),
  boolean: manifest.numericalLayout.booleanSlots.map((slot, index) =>
    mutableCounter(slot.path, slot.pointer, retainedBooleans.has(index))),
  string: manifest.numericalLayout.stringSlots.map((slot, index) =>
    mutableCounter(slot.path, slot.pointer, retainedStrings.has(index))),
  optionalRecord: manifest.numericalLayout.optionalRecordRoots.map((root) =>
    mutableCounter(root.path, root.pointer, false, "presence")),
  boundedArray: manifest.numericalLayout.boundedArrayRoots.map((root) =>
    mutableCounter(root.path, root.pointer, false, "canonical")),
};
let previous = initial;

for (let index = 1; index <= INSPECTED_SUBSTEPS; index += 1) {
  const target = index * SUBSTEP_SEC;
  const result = session.advanceToPresentationTime(target);
  if (result.status !== "advanced") {
    throw new Error(`owner coverage inspection failed at ${target}`);
  }
  const current = session.currentAcceptedState();
  for (const group of Object.values(counters)) {
    for (const counter of group) counter.observe(previous, current, index);
  }
  previous = current;
}

const unclassifiedHot = Object.entries(counters).flatMap(([kind, group]) =>
  group
    .filter(({ retained, changeCount }) =>
      !retained && changeCount >= HOT_CHANGE_THRESHOLD)
    .map(({ pointer, changeCount }) => Object.freeze({
      kind,
      pointer,
      changeCount,
    })));
if (unclassifiedHot.length > 0) {
  throw new Error(
    "Main Wire typed owner coverage found unclassified hot state: "
      + JSON.stringify(unclassifiedHot),
  );
}

const reportGroup = (group: readonly MutableCounter[]) => group
  .filter(({ changeCount }) => changeCount > 0)
  .map(({ path: _path, ...counter }) => counter)
  .sort((left, right) =>
    right.changeCount - left.changeCount || left.pointer.localeCompare(right.pointer));

process.stdout.write(`${JSON.stringify({
  schemaId: "circleheart-main-wire-typed-owner-coverage-v1",
  inspectedSubsteps: INSPECTED_SUBSTEPS,
  substepSec: SUBSTEP_SEC,
  hotChangeThreshold: HOT_CHANGE_THRESHOLD,
  unclassifiedHot,
  changed: Object.fromEntries(Object.entries(counters).map(([name, group]) =>
    [name, reportGroup(group)])),
}, null, 2)}\n`);

type Comparison = "identity" | "presence" | "canonical";
type MutableCounter = {
  path: readonly FlatNumericalPathSegmentV1[];
  pointer: string;
  retained: boolean;
  changeCount: number;
  firstChangeSubstep: number | null;
  lastChangeSubstep: number | null;
  comparison: Comparison;
  observe(previous: unknown, current: unknown, substep: number): void;
};

function mutableCounter(
  path: readonly FlatNumericalPathSegmentV1[],
  pointer: string,
  retained: boolean,
  comparison: Comparison = "identity",
): MutableCounter {
  const counter: MutableCounter = {
    path,
    pointer,
    retained,
    comparison,
    changeCount: 0,
    firstChangeSubstep: null,
    lastChangeSubstep: null,
    observe(previous, current, substep) {
      const left = comparableValue(previous, path, comparison);
      const right = comparableValue(current, path, comparison);
      if (Object.is(left, right)) return;
      counter.changeCount += 1;
      counter.firstChangeSubstep ??= substep;
      counter.lastChangeSubstep = substep;
    },
  };
  return counter;
}

function comparableValue(
  root: unknown,
  path: readonly FlatNumericalPathSegmentV1[],
  comparison: Comparison,
): unknown {
  let value: unknown;
  try {
    value = readFlatNumericalStatePathV1(root, path);
  } catch (error) {
    if (
      error instanceof Error
      && error.message.startsWith("Flat numerical state ")
      && error.message.endsWith(" is unavailable")
    ) {
      return ABSENT;
    }
    throw error;
  }
  if (comparison === "presence") return value !== null;
  if (comparison === "canonical") return JSON.stringify(value);
  return value;
}
