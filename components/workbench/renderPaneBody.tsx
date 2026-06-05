import React from 'react';
import { Controls } from '../Controls';
import { PVLoopPanel, WaveformPanel, MetricsPanel, GuytonPanel } from '../Charts';
import { NotePanel } from '../NotePanel';
import { ErrorBoundary } from '../ErrorBoundary';
import { ScenarioPane } from './ScenarioPane';
import type { ClinicalKnobs } from '../../engine/knobs';
import type { SimulationHealth } from '../../engine/protocol';
import type { NoteContent } from '../../noteTypes';
import type { PanelDef, PhysicsRefState, SimInstance, SimulationParams } from '../../types';

export interface PaneBodyContext {
  instances: SimInstance[];
  physicsRefs: React.MutableRefObject<Map<string, PhysicsRefState>>;
  instanceHealth?: Record<string, SimulationHealth>;
  activeInstanceId?: string;
  updateInstanceParams?: (id: string, params: Partial<SimulationParams>) => void;
  updateInstanceKnobs?: (id: string, knobs: ClinicalKnobs) => void;
  updateInstanceVolume?: (id: string, vol: number) => void;
  noteMode?: 'read' | 'edit';
  notes?: Record<string, NoteContent>;
  noteCaseKey?: string;
  onNoteChange?: (panelId: string, blocks: NoteContent) => void;
  noteHeader?: React.ReactNode;
  addInstance?: (sourceId?: string, presetId?: string) => void;
  removeInstance?: (id: string) => void;
  updateInstanceName?: (id: string, name: string) => void;
  updateInstanceColor?: (id: string, color: string) => void;
  presentationMode?: 'studio' | 'reading';
}

export function renderPaneBody(panel: PanelDef, ctx: PaneBodyContext): React.ReactNode {
  if (panel.type === 'PVLOOP') {
    return <PVLoopPanel physicsRefs={ctx.physicsRefs} instances={ctx.instances} config={panel.config} showGuides={panel.showGuides} showLegend={panel.showLegend} />;
  }
  if (panel.type === 'WAVEFORM') {
    return <WaveformPanel physicsRefs={ctx.physicsRefs} instances={ctx.instances} timeWindow={panel.timeWindow || 10000} config={panel.config} showLegend={panel.showLegend} />;
  }
  if (panel.type === 'METRICS') {
    return <MetricsPanel physicsRefs={ctx.physicsRefs} instances={ctx.instances} config={panel.config} />;
  }
  if (panel.type === 'SCENARIOS' && ctx.addInstance && ctx.removeInstance && ctx.updateInstanceName && ctx.updateInstanceColor) {
    return (
      <ScenarioPane
        instances={ctx.instances}
        addInstance={ctx.addInstance}
        removeInstance={ctx.removeInstance}
        updateInstanceName={ctx.updateInstanceName}
        updateInstanceColor={ctx.updateInstanceColor}
      />
    );
  }
  if (panel.type === 'CONTROLS' && ctx.updateInstanceParams && ctx.updateInstanceKnobs && ctx.updateInstanceVolume) {
    return (
      <Controls
        isPaneMode
        paneConfig={panel.config}
        instances={ctx.instances}
        instanceHealth={ctx.instanceHealth}
        activeInstanceId={ctx.activeInstanceId ?? ''}
        updateInstanceParams={ctx.updateInstanceParams}
        updateInstanceKnobs={ctx.updateInstanceKnobs}
        updateInstanceVolume={ctx.updateInstanceVolume}
        presentationMode={ctx.presentationMode}
        controllerItems={panel.view?.kind === 'control' ? panel.view.controllerItems : undefined}
      />
    );
  }
  if (panel.type === 'GUYTON_RIGHT' || panel.type === 'GUYTON_LEFT') {
    return <GuytonPanel physicsRefs={ctx.physicsRefs} instances={ctx.instances} config={panel.config} type={panel.type} />;
  }
  if (panel.type === 'NOTE') {
    return (
      <ErrorBoundary>
        <div className="flex h-full min-h-0 flex-col">
          {ctx.noteHeader}
          <div className="min-h-0 flex-1">
            <NotePanel
              key={`${ctx.noteCaseKey ?? 'case'}:${panel.id}`}
              mode={ctx.noteMode ?? 'read'}
              content={ctx.notes?.[panel.id]}
              onChange={(blocks) => ctx.onNoteChange?.(panel.id, blocks)}
            />
          </div>
        </div>
      </ErrorBoundary>
    );
  }
  return null;
}
