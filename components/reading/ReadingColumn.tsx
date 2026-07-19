import React from "react";
import { NotePanel } from "../NotePanel";
import { renderPaneBody, type PaneBodyContext } from "../workbench/renderPaneBody";
import { AuthoredViewEmbed } from "../workbench/AuthoredViewEmbed";
import type { ReadingColumnEntry } from "../../caseDoc";
import type { NoteContent } from "../../noteTypes";
import type { PanelDef } from "../../types";
import { ReadingControllerSection } from "./ReadingControllerSection";
import { ReadingPaneCard } from "./ReadingPaneCard";

function countHeadingBlocks(blocks: NoteContent): number {
  return blocks.reduce((count, block) => {
    const children = Array.isArray(block.children)
      ? block.children.filter((child): child is Record<string, unknown> => !!child && typeof child === "object")
      : [];
    return count + (block.type === "heading" ? 1 : 0) + countHeadingBlocks(children);
  }, 0);
}

export const ReadingColumn: React.FC<{
  column: ReadingColumnEntry[];
  panels: PanelDef[];
  notes: Record<string, NoteContent>;
  paneCtx: PaneBodyContext;
  headingAnchorIds?: string[];
}> = ({ column, panels, notes, paneCtx, headingAnchorIds = [] }) => {
  const panelsById = new Map(panels.map((panel) => [panel.id, panel]));
  let controllerIndex = 0;
  let headingCursor = 0;

  return (
    <div className="space-y-8 sm:space-y-10">
      {column.map((entry, index) => {
        if (entry.kind === "noteRef") {
          const content = notes[entry.noteId] ?? [];
          const headingCount = countHeadingBlocks(content);
          const noteHeadingIds = headingAnchorIds.slice(headingCursor, headingCursor + headingCount);
          headingCursor += headingCount;
          return (
            <div key={`note:${entry.noteId}:${index}`} className="mx-auto w-full max-w-[68ch]">
              <NotePanel
                mode="read"
                content={content}
                bare
                headingAnchorIds={noteHeadingIds}
                authoredViews={paneCtx.authoredViews}
                viewRuntime={{
                  instances: paneCtx.instances,
                  physicsRefs: paneCtx.physicsRefs,
                  instanceHealth: paneCtx.instanceHealth,
                  activeInstanceId: paneCtx.activeInstanceId,
                  updateInstanceParams: paneCtx.updateInstanceParams,
                  updateInstanceKnobs: paneCtx.updateInstanceKnobs,
                  updateInstanceVolume: paneCtx.updateInstanceVolume,
                  presentationMode: "reading",
                  runtimeRenderer: paneCtx.runtimeRenderer,
                }}
              />
            </div>
          );
        }

        if (entry.kind === "viewRef") {
          return (
            <div key={`view:${entry.viewId}:${index}`} className="mx-auto w-full max-w-[68ch]">
              <AuthoredViewEmbed
                viewId={entry.viewId}
                authoredViews={paneCtx.authoredViews ?? []}
                runtime={{
                  instances: paneCtx.instances,
                  physicsRefs: paneCtx.physicsRefs,
                  instanceHealth: paneCtx.instanceHealth,
                  activeInstanceId: paneCtx.activeInstanceId,
                  updateInstanceParams: paneCtx.updateInstanceParams,
                  updateInstanceKnobs: paneCtx.updateInstanceKnobs,
                  updateInstanceVolume: paneCtx.updateInstanceVolume,
                  presentationMode: "reading",
                  runtimeRenderer: paneCtx.runtimeRenderer,
                }}
                className="sm:-mx-8"
              />
            </div>
          );
        }

        const panel = panelsById.get(entry.panelId);
        if (!panel) return null;
        const body = renderPaneBody(panel, paneCtx);

        if (panel.type === "CONTROLS") {
          const isFirstController = controllerIndex === 0;
          controllerIndex += 1;
          return (
            <ReadingControllerSection key={`pane:${panel.id}:${index}`} panel={panel} defaultOpen={isFirstController}>
              {body}
            </ReadingControllerSection>
          );
        }

        return (
          <ReadingPaneCard key={`pane:${panel.id}:${index}`} panel={panel} title={panel.title}>
            {body}
          </ReadingPaneCard>
        );
      })}
    </div>
  );
};
