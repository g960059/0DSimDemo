import React, { useMemo } from 'react';
import GridLayout, { noCompactor, useContainerWidth, type Layout, type LayoutItem } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import type { PanelDef } from '../../types';
import { flowPack, GRID_COLUMNS } from '../../layoutPresets';
import { movePane, resizePane } from '../../layoutOps';

interface PanelGridEditorProps {
  panels: PanelDef[];
  rowHeight: number;
  onPanelsChange: (panels: PanelDef[]) => void;
  renderPanel: (panel: PanelDef) => React.ReactNode;
}

function toLayout(panels: PanelDef[]): LayoutItem[] {
  return panels.map((panel) => ({
    i: panel.id,
    x: panel.x ?? 0,
    y: panel.y ?? 0,
    w: panel.w,
    h: panel.h,
    minW: 2,
    minH: panel.type === 'METRICS' ? 3 : 4,
  }));
}

function applyLayout(panels: PanelDef[], layout: Layout): PanelDef[] {
  let next = panels;
  for (const item of layout) {
    const panel = next.find((entry) => entry.id === item.i);
    if (!panel) continue;
    if ((panel.x ?? 0) !== item.x || (panel.y ?? 0) !== item.y) {
      next = movePane(next, item.i, item.x, item.y);
    }
    if (panel.w !== item.w || panel.h !== item.h) {
      next = resizePane(next, item.i, item.w, item.h);
    }
  }
  return next;
}

export default function PanelGridEditor({
  panels,
  rowHeight,
  onPanelsChange,
  renderPanel,
}: PanelGridEditorProps) {
  const { containerRef, mounted, width } = useContainerWidth({ initialWidth: 1200 });
  const packedPanels = useMemo(() => flowPack(panels), [panels]);
  const layout = useMemo(() => toLayout(packedPanels), [packedPanels]);

  const commitLayout = (nextLayout: Layout) => {
    onPanelsChange(applyLayout(packedPanels, nextLayout));
  };

  return (
    <div ref={containerRef} data-panel-grid-editor="mounted">
      {mounted && (
        <GridLayout
          className="panel-grid-editor pb-20 mt-2"
          width={width}
          layout={layout}
          gridConfig={{
            cols: GRID_COLUMNS,
            rowHeight,
            margin: [8, 8],
            containerPadding: [0, 0],
            maxRows: Number.MAX_SAFE_INTEGER,
          }}
          dragConfig={{
            enabled: true,
            bounded: true,
            handle: '.panel-grid-drag-handle',
            cancel: 'input,button,select,textarea',
            threshold: 3,
          }}
          resizeConfig={{
            enabled: true,
            handles: ['se'],
          }}
          compactor={noCompactor}
          onDragStop={commitLayout}
          onResizeStop={commitLayout}
        >
          {packedPanels.map((panel) => (
            <div key={panel.id} className="overflow-visible">
              {renderPanel(panel)}
            </div>
          ))}
        </GridLayout>
      )}
    </div>
  );
}
