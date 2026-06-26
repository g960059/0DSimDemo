import { simpleStableHash } from "@/engine/stateContract";
import { compareCanonicalStringTuples } from "@/engine/myocardium/canonicalOrder";
import type { DynamicStateLayout, StateBlockDescriptor, StateBlockSlice } from "@/engine/myocardium/contracts";
import { serializeModelInstancePath, validateModelInstancePath } from "@/engine/myocardium/state/ModelInstancePath";

const STATE_BLOCK_OWNERS = new Set(["activation", "calcium", "myofilament", "mechanics"]);

export const MYOCARDIUM_STATE_LAYOUT_SCOPE = {
  purpose: "standalone myocardium dynamic state layout construction",
  wiredToLegacyStateLayout: false,
  legacyStateLayoutPath: "engine/core/stateLayout.ts",
  modelCoreIntegration: false,
} as const;

export type StateLayoutHashBlockInput = {
  blockId: string;
  owner: StateBlockDescriptor["owner"];
  equationsVersion: string;
  serializedInstancePath: string;
  labels: readonly string[];
  offset: number;
  size: number;
};

export class StateLayoutBuilder {
  private readonly descriptors: StateBlockDescriptor[] = [];

  addBlock(descriptor: StateBlockDescriptor): this {
    this.descriptors.push(descriptor);
    return this;
  }

  build(): DynamicStateLayout {
    return buildDynamicStateLayout(this.descriptors);
  }
}

export function buildDynamicStateLayout(descriptors: readonly StateBlockDescriptor[]): DynamicStateLayout {
  const blockIds = new Set<string>();
  for (const descriptor of descriptors) {
    validateStateBlockDescriptor(descriptor);
    if (blockIds.has(descriptor.blockId)) {
      throw new Error(`State block ${descriptor.blockId} is duplicated`);
    }
    blockIds.add(descriptor.blockId);
  }

  const sortedDescriptors = [...descriptors].sort(compareStateBlockDescriptor);
  const blocks: StateBlockSlice[] = [];
  let offset = 0;

  for (const descriptor of sortedDescriptors) {
    blocks.push({
      descriptor,
      offset,
      size: descriptor.size,
    });
    offset += descriptor.size;
  }

  const hashBlocks = blocks.map(stateBlockHashInput);
  return {
    blocks,
    size: offset,
    layoutHash: simpleStableHash({
      blocks: hashBlocks,
      size: offset,
    }),
  };
}

export function validateStateBlockDescriptor(descriptor: StateBlockDescriptor): StateBlockDescriptor {
  requireNonEmptyString(descriptor.blockId, "StateBlockDescriptor.blockId");
  requireNonEmptyString(descriptor.equationsVersion, `StateBlockDescriptor(${descriptor.blockId}).equationsVersion`);
  if (!STATE_BLOCK_OWNERS.has(descriptor.owner)) {
    throw new Error(`StateBlockDescriptor(${descriptor.blockId}).owner is invalid: ${String(descriptor.owner)}`);
  }
  validateModelInstancePath(descriptor.instance);

  if (!Number.isInteger(descriptor.size) || descriptor.size <= 0) {
    throw new Error(`StateBlockDescriptor(${descriptor.blockId}).size must be a positive integer`);
  }
  if (!Array.isArray(descriptor.labels) || descriptor.labels.length !== descriptor.size) {
    throw new Error(
      `StateBlockDescriptor(${descriptor.blockId}).labels length must match size ${descriptor.size}`,
    );
  }
  descriptor.labels.forEach((label, index) => {
    requireNonEmptyString(label, `StateBlockDescriptor(${descriptor.blockId}).labels[${index}]`);
  });

  return descriptor;
}

export function stateBlockHashInput(block: StateBlockSlice): StateLayoutHashBlockInput {
  return {
    blockId: block.descriptor.blockId,
    owner: block.descriptor.owner,
    equationsVersion: block.descriptor.equationsVersion,
    serializedInstancePath: serializeModelInstancePath(block.descriptor.instance),
    labels: [...block.descriptor.labels],
    offset: block.offset,
    size: block.size,
  };
}

export function compareStateBlockDescriptor(left: StateBlockDescriptor, right: StateBlockDescriptor): number {
  return compareCanonicalStringTuples(
    [left.blockId, left.owner, left.equationsVersion, serializeModelInstancePath(left.instance)],
    [right.blockId, right.owner, right.equationsVersion, serializeModelInstancePath(right.instance)],
  );
}

function requireNonEmptyString(value: unknown, label: string): void {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
}
