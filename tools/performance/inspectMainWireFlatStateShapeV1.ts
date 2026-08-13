import {
  MainWireIntegratedModelSessionV3,
  mainWireIntegratedModelPresentationTargetTimeSecV3,
} from "@/engine/myocardium/MainWireIntegratedModelSessionV3";
import {
  createMainWireAcceptedTypedStateManifestV1,
} from "@/engine/vnext/MainWireAcceptedTypedStateV1";

const session = await MainWireIntegratedModelSessionV3.create();
const manifest = createMainWireAcceptedTypedStateManifestV1(
  session.currentAcceptedState(),
);
const layout = manifest.numericalLayout;
const observed = new Map<string, {
  pointer: string;
  kinds: Set<string>;
  lengths: Set<number>;
  samples: unknown[];
}>();
const observedStrings = new Map<string, {
  pointer: string;
  values: Set<string>;
}>();

for (let tick = 0; tick <= 1_024; tick += 1) {
  if (tick > 0) {
    const advance = session.advanceToPresentationTime(
      mainWireIntegratedModelPresentationTargetTimeSecV3(tick),
    );
    if (advance.status !== "advanced") {
      throw new Error(`shape inspection failed at tick ${tick}`);
    }
  }
  const state = session.currentAcceptedState();
  for (const root of layout.excludedDynamicRoots) {
    const value = root.path.reduce<unknown>((current, segment) => {
      if (current === null || typeof current !== "object") {
        throw new Error(`${root.pointer} is unavailable`);
      }
      return (current as Record<string | number, unknown>)[segment];
    }, state);
    const entry = observed.get(root.pointer) ?? {
      pointer: root.pointer,
      kinds: new Set<string>(),
      lengths: new Set<number>(),
      samples: [],
    };
    entry.kinds.add(value === null ? "null" : Array.isArray(value) ? "array" : typeof value);
    if (Array.isArray(value)) entry.lengths.add(value.length);
    const informativeArray = Array.isArray(value) && value.length > 0;
    if (
      entry.samples.length < 3
      || (
        informativeArray
        && !entry.samples.some((sample) =>
          Array.isArray(sample) && sample.length > 0)
      )
    ) {
      if (entry.samples.length === 3) entry.samples.pop();
      entry.samples.push(value);
    }
    observed.set(root.pointer, entry);
  }
  for (const slot of layout.stringSlots) {
    const value = slot.path.reduce<unknown>((current, segment) => {
      if (current === null || typeof current !== "object") {
        throw new Error(`${slot.pointer} is unavailable`);
      }
      return (current as Record<string | number, unknown>)[segment];
    }, state);
    if (typeof value !== "string") {
      throw new Error(`${slot.pointer} is not a string`);
    }
    const entry = observedStrings.get(slot.pointer) ?? {
      pointer: slot.pointer,
      values: new Set<string>(),
    };
    entry.values.add(value);
    observedStrings.set(slot.pointer, entry);
  }
}

process.stdout.write(`${JSON.stringify({
  schemaId: "circleheart-flat-state-shape-inspection-v1",
  inspectedTicks: 1_025,
  layout: {
    layoutId: manifest.layoutId,
    fingerprint: manifest.fingerprint,
    continuousSlotCount: layout.continuousSlots.length,
    nullableContinuousSlotCount: layout.nullableContinuousSlots.length,
    nullableStringSlotCount: layout.nullableStringSlots.length,
    booleanSlotCount: layout.booleanSlots.length,
    stringSlotCount: layout.stringSlots.length,
    dynamicRootCount: layout.excludedDynamicRoots.length,
    externalImmutableRoots: manifest.externalImmutableRoots.map(
      ({ pointer, canonicalByteLength }) => ({
        pointer,
        canonicalByteLength,
      }),
    ),
    containerCount: layout.containers.length,
  },
  slotBindings: {
    continuous: Object.fromEntries(layout.continuousSlots.map(
      ({ pointer }, index) => [pointer, index],
    )),
    nullableContinuous: Object.fromEntries(
      layout.nullableContinuousSlots.map(
        ({ pointer }, index) => [pointer, index],
      ),
    ),
    nullableString: Object.fromEntries(layout.nullableStringSlots.map(
      ({ pointer }, index) => [pointer, index],
    )),
    boolean: Object.fromEntries(layout.booleanSlots.map(
      ({ pointer }, index) => [pointer, index],
    )),
    string: Object.fromEntries(layout.stringSlots.map(
      ({ pointer }, index) => [pointer, index],
    )),
    dynamic: Object.fromEntries(layout.excludedDynamicRoots.map(
      ({ pointer }, index) => [pointer, index],
    )),
    externalImmutable: Object.fromEntries(layout.externalImmutableRoots.map(
      ({ pointer }, index) => [pointer, index],
    )),
  },
  roots: [...observed.values()].map((entry) => ({
    pointer: entry.pointer,
    kinds: [...entry.kinds].sort(),
    lengths: [...entry.lengths].sort((left, right) => left - right),
    samples: entry.samples,
  })),
  strings: [...observedStrings.values()].map((entry) => ({
    pointer: entry.pointer,
    distinctValueCount: entry.values.size,
    samples: [...entry.values].slice(0, 8),
  })).sort((left, right) =>
    right.distinctValueCount - left.distinctValueCount
      || left.pointer.localeCompare(right.pointer)
  ),
  recordPrototypeTags: [...new Set(
    layout.containers.map(({ prototypeTag }) => prototypeTag),
  )],
}, null, 2)}\n`);
