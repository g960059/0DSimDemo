import * as React from "react";
import {
  ArrowDown,
  ArrowUp,
  BetweenHorizontalEnd,
  BetweenHorizontalStart,
  FlaskConical,
  Heading2,
  Heading3,
  Pilcrow,
  Trash2,
} from "lucide-react";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";

import type {
  StudioDocumentBlockV1,
} from "@/studio/contracts/v1";

export type StudioDocumentEditorValueV1 = Readonly<{
  title: string;
  blocks: readonly StudioDocumentBlockV1[];
}>;

export type StudioDocumentBlockEditorV1Props = Readonly<{
  value: StudioDocumentEditorValueV1;
  onChange(value: StudioDocumentEditorValueV1): void;
  onCommitRequest(value: StudioDocumentEditorValueV1): void;
}>;

/**
 * Canonical Studio Document editor.
 *
 * This component edits `StudioDocumentBlockV1` directly. It deliberately does
 * not expose BlockNote JSON or legacy Note/Case types as an intermediate
 * persistence format. Experiment placements remain atomic references: their
 * Reader brief is composed in the Workbench and only ordered here.
 */
export function StudioDocumentBlockEditorV1({
  value,
  onChange,
  onCommitRequest,
}: StudioDocumentBlockEditorV1Props) {
  const { t } = useTranslation();
  const labels = labelsFromTranslationsV1(t);

  const publishStructuralChange = React.useCallback((
    next: StudioDocumentEditorValueV1,
  ) => {
    onChange(next);
    onCommitRequest(next);
  }, [onChange, onCommitRequest]);

  const updateBlock = React.useCallback((
    index: number,
    block: StudioDocumentBlockV1,
  ) => {
    onChange({
      ...value,
      blocks: value.blocks.map((candidate, candidateIndex) =>
        candidateIndex === index ? block : candidate),
    });
  }, [onChange, value]);

  const moveBlock = React.useCallback((from: number, to: number) => {
    if (to < 0 || to >= value.blocks.length || from === to) return;
    const blocks = [...value.blocks];
    const [block] = blocks.splice(from, 1);
    if (block === undefined) return;
    blocks.splice(to, 0, block);
    publishStructuralChange({ ...value, blocks });
  }, [publishStructuralChange, value]);

  const removeBlock = React.useCallback((index: number) => {
    const block = value.blocks[index];
    if (
      block === undefined
      || block.kind === "experiment-placement"
      || value.blocks.length <= 1
    ) {
      return;
    }
    publishStructuralChange({
      ...value,
      blocks: value.blocks.filter((_, candidateIndex) =>
        candidateIndex !== index),
    });
  }, [publishStructuralChange, value]);

  const insertTextBlock = React.useCallback((
    at: number,
    kind: "paragraph" | "heading",
    level?: 2 | 3,
  ) => {
    const blockId = `document-block-${globalThis.crypto.randomUUID()}`;
    const block: StudioDocumentBlockV1 = kind === "paragraph"
      ? {
          blockId,
          kind,
          text: labels.newParagraph,
        }
      : {
          blockId,
          kind,
          level: level ?? 2,
          text: labels.newHeading,
        };
    const blocks = [...value.blocks];
    blocks.splice(Math.max(0, Math.min(at, blocks.length)), 0, block);
    publishStructuralChange({ ...value, blocks });
  }, [
    labels.newHeading,
    labels.newParagraph,
    publishStructuralChange,
    value,
  ]);

  return (
    <div
      className="space-y-6"
      data-testid="studio-document-block-editor-v1"
      data-document-block-count={value.blocks.length}
    >
      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-slate-300">
          {labels.title}
        </span>
        <input
          data-testid="studio-document-title-input-v1"
          value={value.title}
          onChange={(event) => onChange({
            ...value,
            title: event.target.value,
          })}
          onBlur={() => onCommitRequest(value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-3 text-base font-semibold text-slate-100 outline-none transition-colors focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
        />
      </label>

      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-slate-300">
            {labels.blocks}
          </h3>
          <span className="text-xs text-slate-500">
            {labels.blockCount(value.blocks.length)}
          </span>
        </div>

        <div className="space-y-3">
          {value.blocks.map((block, index) => (
            <article
              key={block.blockId}
              data-testid="studio-document-editor-block-v1"
              data-document-block-id={block.blockId}
              data-document-block-kind={block.kind}
              className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/70"
            >
              <header className="flex min-h-10 items-center gap-2 border-b border-slate-800 bg-slate-900/60 px-2.5">
                <span className="min-w-0 flex-1 truncate text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">
                  {blockKindLabelV1(block, labels)}
                </span>
                <BlockActionV1
                  label={labels.insertParagraphBefore}
                  disabled={false}
                  onClick={() => insertTextBlock(index, "paragraph")}
                >
                  <BetweenHorizontalStart className="h-3.5 w-3.5" />
                </BlockActionV1>
                <BlockActionV1
                  label={labels.insertParagraphAfter}
                  disabled={false}
                  onClick={() => insertTextBlock(index + 1, "paragraph")}
                >
                  <BetweenHorizontalEnd className="h-3.5 w-3.5" />
                </BlockActionV1>
                <BlockActionV1
                  label={labels.moveUp}
                  disabled={index === 0}
                  onClick={() => moveBlock(index, index - 1)}
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </BlockActionV1>
                <BlockActionV1
                  label={labels.moveDown}
                  disabled={index === value.blocks.length - 1}
                  onClick={() => moveBlock(index, index + 1)}
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </BlockActionV1>
                {block.kind !== "experiment-placement" && (
                  <BlockActionV1
                    label={labels.remove}
                    disabled={value.blocks.length <= 1}
                    danger
                    onClick={() => removeBlock(index)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </BlockActionV1>
                )}
              </header>

              {block.kind === "paragraph" && (
                <label className="block p-3">
                  <span className="sr-only">
                    {labels.paragraphAt(index + 1)}
                  </span>
                  <textarea
                    aria-label={labels.paragraphAt(index + 1)}
                    value={block.text}
                    rows={5}
                    onChange={(event) => updateBlock(index, {
                      ...block,
                      text: event.target.value,
                    })}
                    onBlur={() => onCommitRequest(value)}
                    className="w-full resize-y rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-3 text-sm leading-7 text-slate-200 outline-none transition-colors focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
                  />
                </label>
              )}

              {block.kind === "heading" && (
                <div className="grid gap-2 p-3 sm:grid-cols-[88px_minmax(0,1fr)]">
                  <label>
                    <span className="sr-only">{labels.headingLevel}</span>
                    <select
                      aria-label={labels.headingLevel}
                      value={block.level}
                      onChange={(event) => updateBlock(index, {
                        ...block,
                        level: Number(event.target.value) as 2 | 3,
                      })}
                      onBlur={() => onCommitRequest(value)}
                      className="h-11 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 text-sm font-bold text-slate-300 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
                    >
                      <option value={2}>H2</option>
                      <option value={3}>H3</option>
                    </select>
                  </label>
                  <label>
                    <span className="sr-only">
                      {labels.headingAt(index + 1)}
                    </span>
                    <input
                      aria-label={labels.headingAt(index + 1)}
                      value={block.text}
                      onChange={(event) => updateBlock(index, {
                        ...block,
                        text: event.target.value,
                      })}
                      onBlur={() => onCommitRequest(value)}
                      className="h-11 w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 text-sm font-bold text-slate-100 outline-none transition-colors focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
                    />
                  </label>
                </div>
              )}

              {block.kind === "experiment-placement" && (
                <div className="flex items-start gap-3 p-4">
                  <span className="rounded-lg bg-violet-400/10 p-2 text-violet-300">
                    <FlaskConical className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-200">
                      {labels.experimentPlacement}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {labels.experimentPlacementDescription}
                    </p>
                    <dl className="mt-3 grid gap-1 font-mono text-[11px] text-slate-400">
                      <div className="grid grid-cols-[76px_minmax(0,1fr)] gap-2">
                        <dt>experiment</dt>
                        <dd className="truncate">{block.experimentId}</dd>
                      </div>
                      <div className="grid grid-cols-[76px_minmax(0,1fr)] gap-2">
                        <dt>brief</dt>
                        <dd className="truncate">{block.readerBriefId}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      </div>

      <div
        className="flex flex-wrap gap-2 rounded-xl border border-dashed border-slate-700 bg-slate-950/50 p-3"
        aria-label={labels.addBlock}
      >
        <AddBlockButtonV1
          label={labels.addParagraph}
          onClick={() => insertTextBlock(value.blocks.length, "paragraph")}
        >
          <Pilcrow className="h-4 w-4" />
        </AddBlockButtonV1>
        <AddBlockButtonV1
          label={labels.addHeading2}
          onClick={() => insertTextBlock(value.blocks.length, "heading", 2)}
        >
          <Heading2 className="h-4 w-4" />
        </AddBlockButtonV1>
        <AddBlockButtonV1
          label={labels.addHeading3}
          onClick={() => insertTextBlock(value.blocks.length, "heading", 3)}
        >
          <Heading3 className="h-4 w-4" />
        </AddBlockButtonV1>
      </div>
    </div>
  );
}

function BlockActionV1({
  label,
  disabled,
  danger = false,
  onClick,
  children,
}: Readonly<{
  label: string;
  disabled: boolean;
  danger?: boolean;
  onClick(): void;
  children: React.ReactNode;
}>) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
        danger
          ? "text-slate-500 hover:bg-red-400/10 hover:text-red-300"
          : "text-slate-500 hover:bg-slate-800 hover:text-slate-200"
      }`}
    >
      {children}
    </button>
  );
}

function AddBlockButtonV1({
  label,
  onClick,
  children,
}: Readonly<{
  label: string;
  onClick(): void;
  children: React.ReactNode;
}>) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 text-xs font-bold text-slate-300 transition-colors hover:border-slate-600 hover:bg-slate-800 hover:text-white"
    >
      {children}
      {label}
    </button>
  );
}

type StudioDocumentEditorLabelsV1 = Readonly<{
  title: string;
  blocks: string;
  addBlock: string;
  addParagraph: string;
  addHeading2: string;
  addHeading3: string;
  newParagraph: string;
  newHeading: string;
  paragraph: string;
  heading2: string;
  heading3: string;
  experimentPlacement: string;
  experimentPlacementDescription: string;
  headingLevel: string;
  moveUp: string;
  moveDown: string;
  insertParagraphBefore: string;
  insertParagraphAfter: string;
  remove: string;
  blockCount(count: number): string;
  paragraphAt(position: number): string;
  headingAt(position: number): string;
}>;

function labelsFromTranslationsV1(
  t: TFunction,
): StudioDocumentEditorLabelsV1 {
  return {
    title: t("studioAuthorPreview.documentEditor.title"),
    blocks: t("studioAuthorPreview.documentEditor.blocks"),
    addBlock: t("studioAuthorPreview.documentEditor.addBlock"),
    addParagraph: t("studioAuthorPreview.documentEditor.addParagraph"),
    addHeading2: t("studioAuthorPreview.documentEditor.addHeading2"),
    addHeading3: t("studioAuthorPreview.documentEditor.addHeading3"),
    newParagraph: t("studioAuthorPreview.documentEditor.newParagraph"),
    newHeading: t("studioAuthorPreview.documentEditor.newHeading"),
    paragraph: t("studioAuthorPreview.documentEditor.paragraph"),
    heading2: t("studioAuthorPreview.documentEditor.heading2"),
    heading3: t("studioAuthorPreview.documentEditor.heading3"),
    experimentPlacement: t(
      "studioAuthorPreview.documentEditor.experimentPlacement",
    ),
    experimentPlacementDescription: t(
      "studioAuthorPreview.documentEditor.experimentPlacementDescription",
    ),
    headingLevel: t("studioAuthorPreview.documentEditor.headingLevel"),
    moveUp: t("studioAuthorPreview.documentEditor.moveUp"),
    moveDown: t("studioAuthorPreview.documentEditor.moveDown"),
    insertParagraphBefore: t(
      "studioAuthorPreview.documentEditor.insertParagraphBefore",
    ),
    insertParagraphAfter: t(
      "studioAuthorPreview.documentEditor.insertParagraphAfter",
    ),
    remove: t("studioAuthorPreview.documentEditor.remove"),
    blockCount: (count) => t(
      "studioAuthorPreview.documentEditor.blockCount",
      { count },
    ),
    paragraphAt: (position) => t(
      "studioAuthorPreview.documentEditor.paragraphAt",
      { position },
    ),
    headingAt: (position) => t(
      "studioAuthorPreview.documentEditor.headingAt",
      { position },
    ),
  };
}

function blockKindLabelV1(
  block: StudioDocumentBlockV1,
  labels: StudioDocumentEditorLabelsV1,
): string {
  if (block.kind === "paragraph") return labels.paragraph;
  if (block.kind === "experiment-placement") {
    return labels.experimentPlacement;
  }
  return block.level === 2 ? labels.heading2 : labels.heading3;
}
