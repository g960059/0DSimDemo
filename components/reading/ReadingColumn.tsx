import React from "react";
import { NotePanel } from "../NotePanel";
import { renderPaneBody, type PaneBodyContext } from "../workbench/renderPaneBody";
import type { ReadingColumnEntry } from "../../caseDoc";
import type { NoteContent } from "../../noteTypes";
import type { PanelDef } from "../../types";
import { ReadingControllerSection } from "./ReadingControllerSection";
import { ReadingPaneCard } from "./ReadingPaneCard";

export const ReadingColumn: React.FC<{
  column: ReadingColumnEntry[];
  panels: PanelDef[];
  notes: Record<string, NoteContent>;
  paneCtx: PaneBodyContext;
}> = ({ column, panels, notes, paneCtx }) => {
  const panelsById = new Map(panels.map((panel) => [panel.id, panel]));
  let controllerIndex = 0;

  return (
    <div className="space-y-8 sm:space-y-10">
      {column.map((entry, index) => {
        if (entry.kind === "noteRef") {
          return <NotePanel key={`note:${entry.noteId}:${index}`} mode="read" content={notes[entry.noteId]} bare />;
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
