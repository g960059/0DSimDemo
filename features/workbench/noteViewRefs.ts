import type { CaseReadingManifest } from "@/caseDoc";
import type { NoteContent } from "@/noteTypes";

type NoteBlock = Record<string, unknown>;

export type ViewRefUsage = {
  notes: string[];
  reading: boolean;
};

function blockProps(block: NoteBlock): Record<string, unknown> {
  return (block.props && typeof block.props === "object" ? block.props : {}) as Record<string, unknown>;
}

function blockChildren(block: NoteBlock): NoteBlock[] {
  return Array.isArray(block.children)
    ? block.children.filter((child): child is NoteBlock => !!child && typeof child === "object")
    : [];
}

function collectViewRefsFromBlocks(blocks: NoteContent | undefined, refs: Set<string>): void {
  for (const block of blocks ?? []) {
    if (!block || typeof block !== "object") continue;
    if (block.type === "view_ref") {
      const viewId = blockProps(block).viewId;
      if (typeof viewId === "string" && viewId.length > 0) refs.add(viewId);
    }
    collectViewRefsFromBlocks(blockChildren(block), refs);
  }
}

function remapBlocks(blocks: NoteContent, viewIdMap: Map<string, string>): NoteContent {
  return blocks.map((block) => {
    if (!block || typeof block !== "object") return block;
    const next: NoteBlock = { ...block };
    if (block.type === "view_ref") {
      const props = blockProps(block);
      const viewId = props.viewId;
      if (typeof viewId === "string" && viewIdMap.has(viewId)) {
        next.props = { ...props, viewId: viewIdMap.get(viewId) };
      }
    }
    const children = blockChildren(block);
    if (children.length > 0) next.children = remapBlocks(children, viewIdMap);
    return next;
  });
}

export function collectNoteViewRefIds(notes: Record<string, NoteContent> | undefined): Set<string> {
  const refs = new Set<string>();
  Object.values(notes ?? {}).forEach((blocks) => collectViewRefsFromBlocks(blocks, refs));
  return refs;
}

export function viewRefUsageForDeletion(
  viewId: string,
  notes: Record<string, NoteContent> | undefined,
  reading: CaseReadingManifest | undefined,
): ViewRefUsage {
  const noteIds = Object.entries(notes ?? {})
    .filter(([, blocks]) => {
      const refs = new Set<string>();
      collectViewRefsFromBlocks(blocks, refs);
      return refs.has(viewId);
    })
    .map(([noteId]) => noteId);

  return {
    notes: noteIds,
    reading: Boolean(reading?.column.some((entry) => entry.kind === "viewRef" && entry.viewId === viewId)),
  };
}

export function hasViewRefUsage(usage: ViewRefUsage): boolean {
  return usage.notes.length > 0 || usage.reading;
}

export function remapNoteViewRefIds(
  notes: Record<string, NoteContent> | undefined,
  viewIdMap: Map<string, string>,
): Record<string, NoteContent> | undefined {
  if (!notes || viewIdMap.size === 0) return notes;
  return Object.fromEntries(
    Object.entries(notes).map(([noteId, blocks]) => [noteId, remapBlocks(blocks, viewIdMap)]),
  );
}
