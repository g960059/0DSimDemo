import * as React from "react";
import {
  FlaskConical,
  GripVertical,
  Heading2,
  Heading3,
  PanelsTopLeft,
  Pilcrow,
  Plus,
  Trash2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";

import { workbenchHref } from "@/homeLinks";
import { localeFromPathname } from "@/localeRouting";

import type {
  ReaderPlacementInlineModeV1,
  ResolvedReaderDocumentV1,
  StudioDocumentBlockV1,
} from "@/studio/contracts/v1";
import type {
  ScientificProductReaderExperimentControllerV1,
} from "@/components/scientificProduct/ScientificProductReaderExperimentControllerV1";
import type {
  ScientificProductRuntimeRegistryPortV1,
} from "@/components/scientificProduct/ScientificProductRuntimeRegistryPortV1";
import { useStudioBlockDragV1 } from "./StudioBlockDragV1";
import { StudioExperimentCellV1 } from "./StudioExperimentCellV1";

export type StudioDocumentCapabilityV1 = "read" | "compose";

export type StudioDocumentEditV1 = Readonly<{
  /**
   * Commits title and blocks as one structural content change against the
   * revision the editor buffer was synchronized from. Returns the document
   * revision the commit produced, or null when it was rejected, so a rejected
   * edit stays pending instead of being silently discarded and an accepted
   * one can be chained without waiting for a render to carry the new
   * revision back.
   */
  onCommit(
    title: string,
    blocks: readonly StudioDocumentBlockV1[],
    expectedRevision: number,
  ): number | null;
  /**
   * Adds an experiment to the draft and returns what a block needs to place
   * it, or null when it could not be created. Inserting an experiment makes a
   * new one rather than pointing at an existing one: an article's experiments
   * each own their brief, so two placements are two experiments to compose,
   * not one composition shown twice.
   */
  createExperiment(): Readonly<{
    experimentId: string;
    readerBriefId: string;
  }> | null;
}>;

/**
 * One placement's numerical session, as the surface needs to see it.
 *
 * A placement is bound when the reader is close enough to it to be worth a
 * Worker, and live only while it is the one being read. `observe` receives the
 * block element so the policy that decides both can watch it.
 */
export type StudioDocumentPlacementRuntimeV1 = Readonly<{
  phase: "unbound" | "loading" | "ready" | "failed" | "expired";
  message: string | null;
  controller: ScientificProductReaderExperimentControllerV1 | null;
  registry: ScientificProductRuntimeRegistryPortV1 | null;
  live: boolean;
  observe(element: HTMLElement | null): void;
  /** Take the live lane by hand, rather than by being looked at. */
  requestLive(): void;
}>;

export type StudioDocumentSurfaceV1Props = Readonly<{
  document: ResolvedReaderDocumentV1;
  capability: StudioDocumentCapabilityV1;
  edit?: StudioDocumentEditV1;
  runtimeForPlacement(
    placementBlockId: string,
  ): StudioDocumentPlacementRuntimeV1;
}>;

/**
 * The single document surface.
 *
 * Reading and composing are the same rendering with different capability, not
 * two screens: an author writes on the output a reader will see. Blocks own
 * their own presentation, so this file never special-cases an experiment's
 * internals.
 */
export function StudioDocumentSurfaceV1({
  document,
  capability,
  edit,
  runtimeForPlacement,
}: StudioDocumentSurfaceV1Props) {
  const { t } = useTranslation();
  const composing = capability === "compose" && edit !== undefined;
  const placements = React.useMemo(
    () => new Map(document.placements.map((placement) => [
      placement.placementBlockId,
      placement,
    ])),
    [document],
  );

  const [buffer, setBuffer] = React.useState(() => ({
    title: document.document.title,
    blocks: document.document.blocks,
  }));
  const dirtyRef = React.useRef(false);
  /** The document revision this buffer was last synchronized from. */
  const baseRevisionRef = React.useRef(document.document.revision);
  React.useEffect(() => {
    if (dirtyRef.current) return;
    baseRevisionRef.current = document.document.revision;
    setBuffer({
      title: document.document.title,
      blocks: document.document.blocks,
    });
  }, [document]);

  const [menuBlockId, setMenuBlockId] = React.useState<string | null>(null);
  const focusBlockIdRef = React.useRef<string | null>(null);
  const bufferRef = React.useRef(buffer);
  bufferRef.current = buffer;
  React.useEffect(() => () => {
    // Blur is not guaranteed: history navigation and route changes can unmount
    // a focused block. A pending edit is committed rather than dropped.
    if (dirtyRef.current) commitRef.current(bufferRef.current);
  }, []);

  const commit = React.useCallback((next: typeof buffer) => {
    // Clearing dirty before the commit is accepted would let the resync
    // effect overwrite an edit the application rejected.
    if (edit === undefined) return;
    const committedRevision = edit.onCommit(
      next.title,
      next.blocks,
      baseRevisionRef.current,
    );
    if (committedRevision === null) return;
    // Two commits can land in one event — Enter commits the text it splits,
    // then inserts a block. Adopting the produced revision now is what keeps
    // the second one from conflicting with the first; waiting for the resync
    // effect would drop it.
    baseRevisionRef.current = committedRevision;
    dirtyRef.current = false;
  }, [edit]);

  const commitRef = React.useRef(commit);
  commitRef.current = commit;

  const updateBuffer = React.useCallback((
    next: typeof buffer,
    commitNow: boolean,
  ) => {
    dirtyRef.current = !commitNow;
    setBuffer(next);
    if (commitNow) commit(next);
  }, [commit]);

  const setBlockText = React.useCallback((blockId: string, text: string) => {
    dirtyRef.current = true;
    setBuffer((current) => ({
      ...current,
      blocks: current.blocks.map((block) =>
        block.blockId === blockId && block.kind !== "experiment-placement"
          ? { ...block, text }
          : block),
    }));
  }, []);

  const insertBlock = React.useCallback((
    index: number,
    block: StudioDocumentBlockV1,
  ) => {
    setBuffer((current) => {
      const blocks = [...current.blocks];
      blocks.splice(index, 0, block);
      const next = { ...current, blocks };
      focusBlockIdRef.current = block.kind === "experiment-placement"
        ? null
        : block.blockId;
      commitRef.current(next);
      return next;
    });
  }, [edit]);

  const removeBlock = React.useCallback((blockId: string) => {
    setBuffer((current) => {
      if (current.blocks.length <= 1) return current;
      const index = current.blocks.findIndex((block) =>
        block.blockId === blockId);
      const blocks = current.blocks.filter((block) =>
        block.blockId !== blockId);
      const previous = blocks[Math.max(0, index - 1)];
      focusBlockIdRef.current =
        previous !== undefined && previous.kind !== "experiment-placement"
          ? previous.blockId
          : null;
      const next = { ...current, blocks };
      commitRef.current(next);
      return next;
    });
  }, []);

  const moveBlockTo = React.useCallback((blockId: string, to: number) => {
    setBuffer((current) => {
      const from = current.blocks.findIndex((block) =>
        block.blockId === blockId);
      if (from < 0 || to < 0 || to >= current.blocks.length || to === from) {
        return current;
      }
      const blocks = [...current.blocks];
      const [moved] = blocks.splice(from, 1);
      if (moved === undefined) return current;
      blocks.splice(to, 0, moved);
      const next = { ...current, blocks };
      commitRef.current(next);
      return next;
    });
  }, []);

  const moveBlock = React.useCallback((blockId: string, direction: -1 | 1) => {
    const from = bufferRef.current.blocks.findIndex((block) =>
      block.blockId === blockId);
    if (from < 0) return;
    moveBlockTo(blockId, from + direction);
  }, [moveBlockTo]);

  const blockIds = React.useMemo(
    () => buffer.blocks.map((block) => block.blockId),
    [buffer.blocks],
  );
  const drag = useStudioBlockDragV1({
    blockIds,
    onDrop: moveBlockTo,
    onClick: (blockId) => setMenuBlockId((current) =>
      current === blockId ? null : blockId),
  });

  const changeBlockKind = React.useCallback((
    blockId: string,
    kind: "paragraph" | "heading",
    level?: 2 | 3,
  ) => {
    setBuffer((current) => {
      const blocks = current.blocks.map((block) => {
        if (block.blockId !== blockId) return block;
        if (block.kind === "experiment-placement") return block;
        return kind === "paragraph"
          ? { blockId: block.blockId, kind, text: block.text }
          : { blockId: block.blockId, kind, level: level ?? 2, text: block.text };
      });
      const next = { ...current, blocks };
      commitRef.current(next);
      return next;
    });
  }, []);

  React.useEffect(() => {
    const blockId = focusBlockIdRef.current;
    if (blockId === null) return;
    focusBlockIdRef.current = null;
    const element = window.document.querySelector<HTMLElement>(
      `[data-studio-block-input="${blockId}"]`,
    );
    if (element === null) return;
    element.focus();
    const range = window.document.createRange();
    range.selectNodeContents(element);
    range.collapse(false);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  }, [buffer.blocks]);

  return (
    <article
      className="mx-auto w-full max-w-[46rem] px-5 pb-24 pt-10 sm:px-8"
      lang={document.document.locale}
      data-testid="studio-document-reader-v1"
      data-studio-capability={capability}
    >
      <StudioEditableLineV1
        as="h1"
        blockId="studio-document-title"
        text={buffer.title}
        editable={composing}
        placeholder={t("studioAuthorPreview.surface.titlePlaceholder")}
        className="text-3xl font-bold leading-tight tracking-tight text-wb-text sm:text-4xl"
        onChange={(text) => {
          dirtyRef.current = true;
          setBuffer((current) => ({ ...current, title: text }));
        }}
        onCommit={() => commit(buffer)}
      />

      <div className="mt-8">
        {buffer.blocks.map((block, index) => {
          const placement = placements.get(block.blockId);
          const runtime = block.kind === "experiment-placement"
            ? runtimeForPlacement(block.blockId)
            : null;
          const carried = drag.state.active
            && drag.state.blockId === block.blockId;
          return (
            <div
              key={block.blockId}
              // The observed node is the block, not the cell: a placement
              // swaps its rendering when a session opens, and the playback
              // policy must not read that as leaving and coming back.
              ref={(element) => {
                runtime?.observe(element);
                drag.registerBlock(block.blockId)(element);
              }}
              className={`group relative ${
                carried ? "opacity-40" : ""
              }`}
              data-testid="studio-document-block-v1"
              data-document-block-id={block.blockId}
              data-document-block-kind={block.kind}
              data-document-block-carried={String(carried)}
            >
              {drag.state.dropIndex === index && (
                <StudioBlockDropLineV1 />
              )}
              {composing && (
                <StudioBlockGutterV1
                  blockId={block.blockId}
                  index={index}
                  total={buffer.blocks.length}
                  menuOpen={menuBlockId === block.blockId}
                  isExperiment={block.kind === "experiment-placement"}
                  canInsertExperiment={edit !== undefined}
                  removable={buffer.blocks.length > 1}
                  dragging={drag.state.active}
                  onHandlePointerDown={(event) =>
                    drag.startDrag(block.blockId, index, event)}
                  onHandleMove={(direction) =>
                    drag.moveByKeyboard(block.blockId, index, direction)}
                  onCloseMenu={() => setMenuBlockId(null)}
                  onInsertParagraph={() => insertBlock(index + 1, {
                    blockId: newBlockIdV1(),
                    kind: "paragraph",
                    text: "",
                  })}
                  onChangeKind={changeBlockKind}
                  onInsertExperiment={() => {
                    const reference = edit?.createExperiment() ?? null;
                    if (reference === null) return;
                    insertBlock(index + 1, {
                      blockId: newBlockIdV1(),
                      kind: "experiment-placement",
                      experimentId: reference.experimentId,
                      readerBriefId: reference.readerBriefId,
                      inlineMode: "live",
                      localCaption: null,
                    });
                  }}
                  onMove={moveBlock}
                  onRemove={() => removeBlock(block.blockId)}
                />
              )}

              {block.kind === "experiment-placement"
                ? (
                  placement === undefined || runtime === null
                    ? (
                      <p role="alert" className="my-8 text-sm text-wb-danger">
                        {t("studioAuthorPreview.surface.unresolvedExperiment")}
                      </p>
                    )
                    : (
                      <>
                        <StudioExperimentCellV1
                          placement={placement}
                          runtime={runtime}
                        />
                        {composing && (
                          <StudioPlacementOptionsV1
                            experimentId={placement.experiment.experimentId}
                            inlineMode={placement.inlineMode}
                            caption={placement.localCaption}
                            onChange={(inlineMode, localCaption) => {
                              updateBuffer({
                                ...buffer,
                                blocks: buffer.blocks.map((candidate) =>
                                  candidate.blockId === block.blockId
                                    && candidate.kind === "experiment-placement"
                                    ? { ...candidate, inlineMode, localCaption }
                                    : candidate),
                              }, true);
                            }}
                          />
                        )}
                      </>
                    )
                )
                : (
                  <StudioEditableLineV1
                    as={block.kind === "heading"
                      ? (block.level === 2 ? "h2" : "h3")
                      : "p"}
                    blockId={block.blockId}
                    text={block.text}
                    editable={composing}
                    placeholder={block.kind === "heading"
                      ? t("studioAuthorPreview.surface.headingPlaceholder")
                      : t("studioAuthorPreview.surface.paragraphPlaceholder")}
                    className={blockClassNameV1(block)}
                    onChange={(text) => setBlockText(block.blockId, text)}
                    onCommit={() => commit(buffer)}
                    onEnter={() => insertBlock(index + 1, {
                      blockId: newBlockIdV1(),
                      kind: "paragraph",
                      text: "",
                    })}
                    onBackspaceAtStart={() => removeBlock(block.blockId)}
                    onSlash={() => setMenuBlockId(block.blockId)}
                    onMove={(direction) => moveBlock(block.blockId, direction)}
                  />
                )}
            </div>
          );
        })}
        {drag.state.dropIndex === buffer.blocks.length && (
          <StudioBlockDropLineV1 />
        )}
      </div>

      {composing && buffer.blocks.length === 1
        && buffer.blocks[0]?.kind !== "experiment-placement"
        && (buffer.blocks[0]?.text ?? "").length === 0 && (
        <div
          className="mt-8 rounded-lg border border-dashed border-wb-line p-5"
          data-testid="studio-document-empty-v1"
        >
          <p className="text-sm font-bold text-wb-text">
            {t("studioAuthorPreview.surface.emptyTitle")}
          </p>
          <p className="mt-2 text-xs leading-6 text-wb-muted">
            {t("studioAuthorPreview.surface.emptyDescription")}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              data-testid="studio-document-template-explainer-v1"
              onClick={() => {
                const heading = newBlockIdV1();
                const lead = newBlockIdV1();
                const reading = newBlockIdV1();
                const experiment = edit?.createExperiment() ?? null;
                updateBuffer({
                  title: buffer.title.length === 0
                    ? t("studioAuthorPreview.surface.templateTitle")
                    : buffer.title,
                  blocks: [
                    {
                      blockId: lead,
                      kind: "paragraph",
                      text: t("studioAuthorPreview.surface.templateLead"),
                    },
                    ...(experiment === null ? [] : [{
                      blockId: newBlockIdV1(),
                      kind: "experiment-placement" as const,
                      experimentId: experiment.experimentId,
                      readerBriefId: experiment.readerBriefId,
                      inlineMode: "live" as const,
                      localCaption: null,
                    }]),
                    {
                      blockId: heading,
                      kind: "heading",
                      level: 2,
                      text: t("studioAuthorPreview.surface.templateHeading"),
                    },
                    {
                      blockId: reading,
                      kind: "paragraph",
                      text: t("studioAuthorPreview.surface.templateReading"),
                    },
                  ],
                }, true);
              }}
              className="inline-flex min-h-9 items-center rounded-md bg-wb-primary px-3 text-xs font-bold text-white hover:bg-wb-primary-hover active:scale-[0.98]"
            >
              {t("studioAuthorPreview.surface.templateExplainer")}
            </button>
          </div>
        </div>
      )}

      {composing && (
        <button
          type="button"
          data-testid="studio-document-append-v1"
          onClick={() => insertBlock(buffer.blocks.length, {
            blockId: newBlockIdV1(),
            kind: "paragraph",
            text: "",
          })}
          className="mt-2 w-full rounded-md px-1 py-3 text-left text-sm text-wb-subtle transition-colors hover:bg-wb-hover hover:text-wb-muted"
        >
          {t("studioAuthorPreview.surface.appendParagraph")}
        </button>
      )}
    </article>
  );
}

function StudioEditableLineV1({
  as,
  blockId,
  text,
  editable,
  placeholder,
  className,
  onChange,
  onCommit,
  onEnter,
  onBackspaceAtStart,
  onSlash,
  onMove,
}: Readonly<{
  as: "h1" | "h2" | "h3" | "p";
  blockId: string;
  text: string;
  editable: boolean;
  placeholder: string;
  className: string;
  onChange(text: string): void;
  onCommit(): void;
  onEnter?(): void;
  onBackspaceAtStart?(): void;
  onSlash?(): void;
  onMove?(direction: -1 | 1): void;
}>) {
  const ref = React.useRef<HTMLElement | null>(null);
  const composingRef = React.useRef(false);
  React.useEffect(() => {
    const element = ref.current;
    if (element === null) return;
    // Rewriting the DOM mid-composition destroys the IME candidate window.
    if (composingRef.current) return;
    if (element.textContent !== text) element.textContent = text;
  }, [text]);

  const Tag = as as unknown as React.ElementType;
  return (
    <Tag
      ref={ref}
      data-studio-block-input={editable ? blockId : undefined}
      contentEditable={editable}
      suppressContentEditableWarning
      role={editable ? "textbox" : undefined}
      aria-label={editable ? placeholder : undefined}
      data-placeholder={placeholder}
      spellCheck={false}
      className={`${className} outline-none ${
        editable
          ? "rounded-sm empty:before:text-wb-subtle empty:before:content-[attr(data-placeholder)] focus:bg-wb-hover/40"
          : ""
      }`}
      onCompositionStart={() => {
        composingRef.current = true;
      }}
      onCompositionEnd={(event: React.CompositionEvent<HTMLElement>) => {
        composingRef.current = false;
        onChange(event.currentTarget.textContent ?? "");
      }}
      onPaste={(event: React.ClipboardEvent<HTMLElement>) => {
        // The model stores plain text; accepting markup here would show
        // formatting that silently disappears on the next render.
        event.preventDefault();
        const plain = event.clipboardData.getData("text/plain")
          .replace(/\s+/g, " ");
        event.currentTarget.ownerDocument.execCommand(
          "insertText",
          false,
          plain,
        );
      }}
      onInput={(event: React.FormEvent<HTMLElement>) => {
        if (composingRef.current) return;
        onChange(event.currentTarget.textContent ?? "");
      }}
      onBlur={onCommit}
      onKeyDown={(event: React.KeyboardEvent<HTMLElement>) => {
        if (!editable) return;
        // A composition confirm arrives as Enter; splitting the block there
        // would discard or halve the text being composed.
        if (composingRef.current || event.nativeEvent.isComposing) return;
        if (event.key === "Enter" && !event.shiftKey && onEnter !== undefined) {
          event.preventDefault();
          onCommit();
          onEnter();
          return;
        }
        if (
          event.key === "Backspace"
          && onBackspaceAtStart !== undefined
          && (event.currentTarget.textContent ?? "").length === 0
        ) {
          event.preventDefault();
          onBackspaceAtStart();
          return;
        }
        if (
          event.key === "/"
          && onSlash !== undefined
          && (event.currentTarget.textContent ?? "").length === 0
        ) {
          event.preventDefault();
          onSlash();
          return;
        }
        if (event.metaKey && onMove !== undefined) {
          if (event.key === "ArrowUp") {
            event.preventDefault();
            onMove(-1);
          } else if (event.key === "ArrowDown") {
            event.preventDefault();
            onMove(1);
          }
        }
      }}
    />
  );
}

/**
 * Where a carried block would land.
 *
 * A two-pixel accent rule rather than a gap that opens: the article's rhythm
 * is what an author is judging while they move a block, and reflowing the
 * column under the pointer changes the thing being judged.
 */
function StudioBlockDropLineV1() {
  return (
    <div
      aria-hidden="true"
      data-testid="studio-document-drop-line-v1"
      className="pointer-events-none absolute inset-x-0 -top-px z-10 h-0.5 rounded-full bg-[var(--wb-pick)]"
    />
  );
}

function StudioBlockGutterV1({
  blockId,
  index,
  total,
  menuOpen,
  isExperiment,
  canInsertExperiment,
  removable,
  dragging,
  onHandlePointerDown,
  onHandleMove,
  onCloseMenu,
  onInsertParagraph,
  onChangeKind,
  onInsertExperiment,
  onMove,
  onRemove,
}: Readonly<{
  blockId: string;
  index: number;
  total: number;
  menuOpen: boolean;
  isExperiment: boolean;
  canInsertExperiment: boolean;
  removable: boolean;
  dragging: boolean;
  onHandlePointerDown(event: React.PointerEvent<HTMLElement>): void;
  onHandleMove(direction: -1 | 1): void;
  onCloseMenu(): void;
  onInsertParagraph(): void;
  onChangeKind(
    blockId: string,
    kind: "paragraph" | "heading",
    level?: 2 | 3,
  ): void;
  onInsertExperiment(): void;
  onMove(blockId: string, direction: -1 | 1): void;
  onRemove(): void;
}>) {
  const { t } = useTranslation();
  return (
    <div className="absolute -left-16 top-1 flex items-center gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
      <GutterButtonV1
        label={t("studioAuthorPreview.surface.insertBelow")}
        onClick={onInsertParagraph}
      >
        <Plus className="h-4 w-4" />
      </GutterButtonV1>
      <button
        type="button"
        aria-label={t("studioAuthorPreview.surface.dragBlock")}
        title={t("studioAuthorPreview.surface.dragBlock")}
        aria-expanded={menuOpen}
        data-testid="studio-document-block-handle-v1"
        // A press that never travels opens the menu; one that does carries
        // the block. The two live on one control because they answer the
        // same question — what happens to this block.
        onPointerDown={onHandlePointerDown}
        onKeyDown={(event) => {
          if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
          event.preventDefault();
          onHandleMove(event.key === "ArrowUp" ? -1 : 1);
        }}
        className={`inline-flex h-7 w-7 items-center justify-center rounded text-wb-subtle transition-colors hover:bg-wb-hover hover:text-wb-text ${
          dragging ? "cursor-grabbing" : "cursor-grab"
        }`}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {menuOpen && (
        <>
          <button
            type="button"
            aria-label={t("studioAuthorPreview.surface.closeMenu")}
            className="fixed inset-0 z-[60] cursor-default"
            onClick={onCloseMenu}
          />
          <div
            role="menu"
            data-testid="studio-document-block-menu-v1"
            ref={(element) => {
              element?.querySelector<HTMLElement>(
                "[role='menuitem']:not([disabled])",
              )?.focus();
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.stopPropagation();
                onCloseMenu();
                return;
              }
              if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
              event.preventDefault();
              const items = [...event.currentTarget.querySelectorAll<
                HTMLButtonElement
              >("[role='menuitem']:not([disabled])")];
              const index = items.indexOf(
                event.target as HTMLButtonElement,
              );
              const next = event.key === "ArrowDown" ? index + 1 : index - 1;
              items[(next + items.length) % items.length]?.focus();
            }}
            className="absolute left-0 top-9 z-[61] w-52 rounded-lg bg-wb-panel p-1 shadow-xl"
          >
            {!isExperiment && (
              <>
                <MenuItemV1
                  label={t("studioAuthorPreview.surface.turnIntoParagraph")}
                  onClick={() => {
                    onChangeKind(blockId, "paragraph");
                    onCloseMenu();
                  }}
                >
                  <Pilcrow className="h-3.5 w-3.5" />
                </MenuItemV1>
                <MenuItemV1
                  label={t("studioAuthorPreview.surface.turnIntoHeading2")}
                  onClick={() => {
                    onChangeKind(blockId, "heading", 2);
                    onCloseMenu();
                  }}
                >
                  <Heading2 className="h-3.5 w-3.5" />
                </MenuItemV1>
                <MenuItemV1
                  label={t("studioAuthorPreview.surface.turnIntoHeading3")}
                  onClick={() => {
                    onChangeKind(blockId, "heading", 3);
                    onCloseMenu();
                  }}
                >
                  <Heading3 className="h-3.5 w-3.5" />
                </MenuItemV1>
              </>
            )}
            {canInsertExperiment && (
              <MenuItemV1
                label={t("studioAuthorPreview.surface.insertExperiment")}
                testId="studio-document-insert-experiment-v1"
                onClick={() => {
                  onInsertExperiment();
                  onCloseMenu();
                }}
              >
                <FlaskConical className="h-3.5 w-3.5" />
              </MenuItemV1>
            )}
            <MenuItemV1
              label={t("studioAuthorPreview.surface.moveUp")}
              disabled={index === 0}
              onClick={() => {
                onMove(blockId, -1);
                onCloseMenu();
              }}
            >
              <span aria-hidden="true" className="text-[11px]">↑</span>
            </MenuItemV1>
            <MenuItemV1
              label={t("studioAuthorPreview.surface.moveDown")}
              disabled={index === total - 1}
              onClick={() => {
                onMove(blockId, 1);
                onCloseMenu();
              }}
            >
              <span aria-hidden="true" className="text-[11px]">↓</span>
            </MenuItemV1>
            <MenuItemV1
              label={t("studioAuthorPreview.surface.removeBlock")}
              disabled={!removable}
              danger
              onClick={() => {
                onRemove();
                onCloseMenu();
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </MenuItemV1>
          </div>
        </>
      )}
    </div>
  );
}

function GutterButtonV1({
  label,
  expanded,
  onClick,
  children,
}: Readonly<{
  label: string;
  expanded?: boolean;
  onClick(): void;
  children: React.ReactNode;
}>) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-expanded={expanded}
      onClick={onClick}
      className="inline-flex h-7 w-7 items-center justify-center rounded text-wb-subtle transition-colors hover:bg-wb-hover hover:text-wb-text"
    >
      {children}
    </button>
  );
}

function MenuItemV1({
  label,
  disabled = false,
  danger = false,
  testId,
  onClick,
  children,
}: Readonly<{
  label: string;
  disabled?: boolean;
  danger?: boolean;
  testId?: string;
  onClick(): void;
  children: React.ReactNode;
}>) {
  return (
    <button
      type="button"
      role="menuitem"
      data-testid={testId}
      disabled={disabled}
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded px-2.5 py-1.5 text-left text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
        danger
          ? "text-wb-muted hover:bg-red-500/10 hover:text-red-400"
          : "text-wb-muted hover:bg-wb-hover hover:text-wb-text"
      }`}
    >
      {children}
      {label}
    </button>
  );
}

function StudioPlacementOptionsV1({
  experimentId,
  inlineMode,
  caption,
  onChange,
}: Readonly<{
  experimentId: string;
  inlineMode: ReaderPlacementInlineModeV1;
  caption: string | null;
  onChange(
    inlineMode: ReaderPlacementInlineModeV1,
    caption: string | null,
  ): void;
}>) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const locale = localeFromPathname(location.pathname);
  return (
    <div
      className="-mt-4 mb-9 flex flex-wrap items-center gap-2"
      data-testid="studio-placement-options-v1"
      data-placement-inline-mode={inlineMode}
    >
      <div className="inline-flex rounded-md bg-wb-soft p-0.5">
        {(["live", "compact", "launch"] as const).map((candidate) => (
          <button
            key={candidate}
            type="button"
            aria-pressed={inlineMode === candidate}
            data-testid={`studio-placement-mode-${candidate}-v1`}
            onClick={() => onChange(candidate, caption)}
            className={`min-h-7 rounded px-2.5 text-[11px] font-bold transition-colors ${
              inlineMode === candidate
                ? "bg-wb-active text-wb-text"
                : "text-wb-subtle hover:text-wb-text"
            }`}
          >
            {t(`studioAuthorPreview.surface.inlineMode.${candidate}`)}
          </button>
        ))}
      </div>
      <button
        type="button"
        data-testid="studio-placement-compose-v1"
        // Each placement owns its own experiment, so composing one names it.
        // A single Workbench entry point would silently compose the first.
        onClick={() => navigate(
          `${workbenchHref(locale)}?experiment=${
            encodeURIComponent(experimentId)
          }`,
        )}
        className="inline-flex min-h-7 shrink-0 items-center gap-1.5 rounded-md px-2 text-[11px] font-bold text-wb-accent transition-colors hover:bg-wb-hover"
      >
        <PanelsTopLeft className="h-3.5 w-3.5" />
        {t("studioAuthorPreview.surface.composeInWorkbench")}
      </button>
      <input
        value={caption ?? ""}
        placeholder={t("studioAuthorPreview.surface.captionPlaceholder")}
        aria-label={t("studioAuthorPreview.surface.captionPlaceholder")}
        data-testid="studio-placement-caption-v1"
        onChange={(event) => {
          const next = event.target.value;
          onChange(inlineMode, next.trim().length === 0 ? null : next);
        }}
        className="min-w-0 flex-1 rounded-md bg-transparent px-1 py-1 text-xs text-wb-muted outline-none placeholder:text-wb-subtle focus:bg-wb-hover"
      />
    </div>
  );
}

function blockClassNameV1(block: StudioDocumentBlockV1): string {
  if (block.kind === "heading") {
    return block.level === 2
      ? "mb-3 mt-10 text-2xl font-bold tracking-tight text-wb-text"
      : "mb-2 mt-8 text-xl font-bold text-wb-text";
  }
  return "mb-5 text-[17px] leading-8 text-wb-text/90";
}

function newBlockIdV1(): string {
  return `document-block-${globalThis.crypto.randomUUID()}`;
}
