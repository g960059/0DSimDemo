import type {
  StudioArticleAccordionBlockV2, StudioArticleAccordionContentBlockV2,
  StudioArticleBlockV2, StudioArticleImageBlockV2, StudioArticleLinkBlockV2,
} from "@/studio/contracts/v2/article";

export type ArticleReadingTokenV1 = Readonly<
  { kind: "text"; text: string } |
  { kind: "reference" | "note" | "figure"; targetId: string; raw: string; offset: number }
>;
export type ArticleReadingEntryV1<T> = Readonly<{ block: T; number: number; backlinks: readonly string[] }>;
export type ArticleReadingIndexV1 = Readonly<{
  body: readonly StudioArticleBlockV2[];
  references: readonly ArticleReadingEntryV1<StudioArticleLinkBlockV2>[];
  notes: readonly ArticleReadingEntryV1<StudioArticleAccordionBlockV2>[];
  figures: ReadonlyMap<string, ArticleReadingEntryV1<StudioArticleImageBlockV2>>;
  errors: readonly string[];
}>;

/** Portable, deliberately small inline grammar; authored text is never HTML. */
export function parseArticleReadingTextV1(text: string): readonly ArticleReadingTokenV1[] {
  const tokens: ArticleReadingTokenV1[] = [];
  const pattern = /(\\*)\[(@|\^|fig:)([A-Za-z0-9][A-Za-z0-9._:/@+-]{0,255})\]/g;
  let end = 0;
  for (const match of text.matchAll(pattern)) {
    const slashes = match[1].length;
    const offset = match.index! + slashes;
    const prefix = text.slice(end, match.index!) + "\\".repeat(Math.floor(slashes / 2));
    if (prefix) tokens.push({ kind: "text", text: prefix });
    const raw = match[0].slice(slashes);
    if (slashes % 2) tokens.push({ kind: "text", text: raw });
    else tokens.push({ kind: match[2] === "@" ? "reference" : match[2] === "^" ? "note" : "figure", targetId: match[3], raw, offset });
    end = match.index! + match[0].length;
  }
  if (end < text.length) tokens.push({ kind: "text", text: text.slice(end) });
  return tokens;
}
export function articleReadingAnchorV1(kind: "reference" | "note" | "figure" | "mention" | "section", id: string): string {
  return `article-${kind}-${id}`;
}
export function articleReadingMentionV1(fieldId: string, offset: number): string {
  return articleReadingAnchorV1("mention", `${fieldId}-${offset}`);
}
export function articleReadingHrefV1(anchor: string): string { return `#${encodeURIComponent(anchor)}`; }
export function articleReadingFieldV1(blockId: string, field = "text"): string { return `${blockId}/${field}`; }

export function buildArticleReadingIndexV1(blocks: readonly StudioArticleBlockV2[]): ArticleReadingIndexV1 {
  const references = new Map<string, StudioArticleLinkBlockV2>();
  const notes = new Map<string, StudioArticleAccordionBlockV2>();
  const figures = new Map<string, { block: StudioArticleImageBlockV2; number: number; backlinks: string[] }>();
  const errors: string[] = [];
  const collect = (items: readonly (StudioArticleBlockV2 | StudioArticleAccordionContentBlockV2)[]) => {
    for (const block of items) {
      if (block.kind === "link" && block.role === "reference") references.set(block.blockId, block);
      if (block.kind === "accordion") {
        if (block.role === "note") notes.set(block.blockId, block);
        collect(block.blocks);
      }
      if (block.kind === "image" && block.url) figures.set(block.blockId, { block, number: figures.size + 1, backlinks: [] });
    }
  };
  collect(blocks);
  const referenceOrder = new Map<string, { block: StudioArticleLinkBlockV2; number: number; backlinks: string[] }>();
  const noteOrder = new Map<string, { block: StudioArticleAccordionBlockV2; number: number; backlinks: string[] }>();
  const scan = (text: string, fieldId: string, inNote = false) => {
    for (const token of parseArticleReadingTextV1(text)) {
      if (token.kind === "text") continue;
      const mention = articleReadingMentionV1(fieldId, token.offset);
      if (token.kind === "figure") {
        const figure = figures.get(token.targetId);
        if (figure) figure.backlinks.push(mention);
        else errors.push(`${fieldId}: missing figure ${token.targetId}`);
      } else if (token.kind === "reference") {
        const ref = references.get(token.targetId);
        if (!ref) { errors.push(`${fieldId}: missing reference ${token.targetId}`); continue; }
        if (!referenceOrder.has(ref.blockId)) referenceOrder.set(ref.blockId, { block: ref, number: referenceOrder.size + 1, backlinks: [] });
        referenceOrder.get(ref.blockId)!.backlinks.push(mention);
      } else {
        const note = notes.get(token.targetId);
        if (!note || inNote) { errors.push(`${fieldId}: ${inNote ? "nested note" : "missing note"} ${token.targetId}`); continue; }
        if (!noteOrder.has(note.blockId)) noteOrder.set(note.blockId, { block: note, number: noteOrder.size + 1, backlinks: [] });
        noteOrder.get(note.blockId)!.backlinks.push(mention);
      }
    }
  };
  const scanBlock = (block: StudioArticleBlockV2 | StudioArticleAccordionContentBlockV2, inNote = false) => {
    if (block.kind === "paragraph") scan(block.text, articleReadingFieldV1(block.blockId), inNote);
    if (block.kind === "image") {
      scan(block.caption, articleReadingFieldV1(block.blockId, "caption"), inNote);
      if (block.credit) scan(block.credit.text, articleReadingFieldV1(block.blockId, "credit"), inNote);
    }
    if (block.kind === "accordion" && block.role !== "note") block.blocks.forEach(b => scanBlock(b, inNote));
  };
  const body = blocks.filter(block => !(block.kind === "link" && block.role === "reference") && !(block.kind === "accordion" && block.role === "note"));
  body.forEach(b => scanBlock(b));
  // Uncited definitions remain visible to an author instead of disappearing.
  for (const note of notes.values()) if (!noteOrder.has(note.blockId)) {
    noteOrder.set(note.blockId, { block: note, number: noteOrder.size + 1, backlinks: [] });
  }
  for (const entry of noteOrder.values()) entry.block.blocks.forEach(b => scanBlock(b, true));
  for (const ref of references.values()) if (!referenceOrder.has(ref.blockId)) {
    referenceOrder.set(ref.blockId, { block: ref, number: referenceOrder.size + 1, backlinks: [] });
  }
  // Definitions can be authored anywhere; number figures in their actual reading order.
  const orderedFigures = new Map<string, ArticleReadingEntryV1<StudioArticleImageBlockV2>>();
  const orderFigures = (items: readonly (StudioArticleBlockV2 | StudioArticleAccordionContentBlockV2)[]) => {
    for (const block of items) {
      if (block.kind === "image" && figures.has(block.blockId)) {
        orderedFigures.set(block.blockId, { ...figures.get(block.blockId)!, number: orderedFigures.size + 1 });
      }
      if (block.kind === "accordion" && block.role !== "note") orderFigures(block.blocks);
    }
  };
  orderFigures(body);
  for (const note of noteOrder.values()) orderFigures(note.block.blocks);
  return { body, references: [...referenceOrder.values()], notes: [...noteOrder.values()], figures: orderedFigures, errors };
}

export function articleReadingTargetV1(index: ArticleReadingIndexV1, token: Exclude<ArticleReadingTokenV1, {kind:"text"}>) {
  return token.kind === "figure" ? index.figures.get(token.targetId)
    : token.kind === "reference" ? index.references.find(e => e.block.blockId === token.targetId)
    : index.notes.find(e => e.block.blockId === token.targetId);
}

/** Public surfaces reject unresolved references; mutable drafts preserve in-progress text. */
export function assertArticleReadingReadyV1(blocks: readonly StudioArticleBlockV2[]): void {
  const index = buildArticleReadingIndexV1(blocks);
  if (index.errors.length) throw new Error(`Article references: ${index.errors.join("; ")}`);
}
export function stripArticleReadingMarkupV1(text: string): string {
  return parseArticleReadingTextV1(text).map(token => token.kind === "text" ? token.text : "").join("");
}
