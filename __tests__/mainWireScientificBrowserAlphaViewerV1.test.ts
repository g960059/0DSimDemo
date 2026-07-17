import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import {
  ScientificAlphaPvTrajectories,
  ScientificAlphaWaveforms,
} from '@/components/scientificAlpha/ScientificRuntimeAlphaPlots';
import {
  appendBoundedScientificAlphaHistoryV1,
  scientificAlphaPlotDomainV1,
  scientificAlphaPvPointsV1,
  scientificAlphaTimeSeriesPointsV1,
  selectTerminalScientificAlphaHistoryV1,
} from '@/components/scientificAlpha/scientificRuntimeAlphaHistoryV1';
import type {
  MainWireScientificObservableFrameV1,
  MainWireScientificObservableIdV1,
} from '@/engine/scientific/observables';

describe('scientific browser alpha viewer V1', () => {
  it('retains a bounded monotone frame history without using the fixed observation id as a key', () => {
    const frames = [1, 2, 3, 4, 5].map((revision) =>
      frame(revision, revision * 0.002));

    const retained = appendBoundedScientificAlphaHistoryV1([], frames, 3);

    expect(retained.map(({ revision }) => revision)).toEqual([3, 4, 5]);
    expect(new Set(
      retained.map(({ sourceObservationId }) => sourceObservationId),
    ).size).toBe(1);

    const terminalReplacement = frame(5, 0.01, {
      'hemodynamics.volume.LA': 99,
    });
    const replaced = appendBoundedScientificAlphaHistoryV1(
      retained,
      [terminalReplacement],
      3,
    );
    expect(replaced).toHaveLength(3);
    expect(replaced.at(-1)?.values['hemodynamics.volume.LA'].value).toBe(99);
    expect(() => appendBoundedScientificAlphaHistoryV1(
      replaced,
      [frame(4, 0.012)],
      3,
    )).toThrow(/not strictly monotone/);
  });

  it('projects only the latest terminal window and keeps waveform time relative', () => {
    const history = [
      frame(1, 10),
      frame(2, 10.5),
      frame(3, 11),
      frame(4, 11.002),
    ];

    const terminal = selectTerminalScientificAlphaHistoryV1(history, 1);
    expect(terminal.map(({ acceptedTimeSec }) => acceptedTimeSec))
      .toEqual([10.5, 11, 11.002]);
    expect(scientificAlphaTimeSeriesPointsV1(
      terminal,
      'valve.MV.flow',
    ).map(({ x }) => x)).toEqual([0, 0.5, 0.5020000000000007]);
    expect(terminal.at(-1)?.acceptedTimeSec).toBe(11.002);
  });

  it('drops unavailable paired PV samples instead of plotting invented zeros', () => {
    const history = [
      frame(1, 0, {
        'hemodynamics.volume.LA': 42,
        'hemodynamics.pressure.absolute.LA': 8,
      }),
      frame(2, 0.002, {
        'hemodynamics.volume.LA': null,
        'hemodynamics.pressure.absolute.LA': 9,
      }),
      frame(3, 0.004, {
        'hemodynamics.volume.LA': 44,
        'hemodynamics.pressure.absolute.LA': 10,
      }),
    ];

    expect(scientificAlphaPvPointsV1(history, 'LA')).toEqual([
      { x: 42, y: 8 },
      { x: 44, y: 10 },
    ]);
    expect(scientificAlphaPlotDomainV1([4, 8], true)[0]).toBeLessThan(0);
  });

  it('renders four PV trajectories plus valve, atrial, ventricular, and vascular waveforms', () => {
    const frames = [frame(1, 0), frame(2, 0.002, {
      'hemodynamics.volume.LA': 43,
      'hemodynamics.pressure.absolute.LA': 9,
    })];
    const markup = [
      renderToStaticMarkup(React.createElement(
        ScientificAlphaPvTrajectories,
        { frames },
      )),
      renderToStaticMarkup(React.createElement(
        ScientificAlphaWaveforms,
        { frames },
      )),
    ].join('\n');

    for (const chamber of ['LA', 'RA', 'LV', 'RV']) {
      expect(markup).toContain(`data-testid="scientific-alpha-pv-${chamber}"`);
    }
    expect(markup).toContain('Valve flow');
    expect(markup).toContain('Atrial absolute pressure');
    expect(markup).toContain('Ventricular absolute pressure');
    expect(markup).toContain('Vascular absolute pressure');
    expect(markup).toContain('latest terminal window');
  });
});

const RELEASE = Object.freeze({
  id: 'test-release',
  version: '0.0.0',
  sha256: 'a'.repeat(64),
});

const DEFAULT_VALUES: Readonly<Record<string, number>> = Object.freeze({
  'hemodynamics.volume.LA': 42,
  'hemodynamics.volume.RA': 48,
  'hemodynamics.volume.LV': 120,
  'hemodynamics.volume.RV': 130,
  'hemodynamics.pressure.absolute.LA': 8,
  'hemodynamics.pressure.absolute.RA': 5,
  'hemodynamics.pressure.absolute.LV': 12,
  'hemodynamics.pressure.absolute.RV': 8,
  'hemodynamics.pressure.absolute.Ao': 82,
  'hemodynamics.pressure.absolute.PA': 18,
  'hemodynamics.pressure.absolute.PVein': 9,
  'valve.MV.flow': 40,
  'valve.AoV.flow': 0,
  'valve.TV.flow': 35,
  'valve.PV.flow': 0,
});

function frame(
  revision: number,
  acceptedTimeSec: number,
  overrides: Readonly<Record<string, number | null>> = {},
): MainWireScientificObservableFrameV1 {
  const values = Object.fromEntries(
    Object.entries({ ...DEFAULT_VALUES, ...overrides }).map(([observableId, value]) => [
      observableId,
      {
        observableId,
        value,
        availability: value === null ? 'not-evaluated-at-accepted-state' : 'available',
        quality: value === null ? 'not-assessed' : 'accepted-derived',
      },
    ]),
  ) as Record<MainWireScientificObservableIdV1, unknown>;
  return {
    frameId: 'main-wire-scientific-observable-frame-v1',
    registryId: 'main-wire-scientific-observable-registry-v1',
    schemaVersion: 1,
    releaseRef: RELEASE,
    // This is a schema/source identifier and intentionally identical in every
    // frame. It must never be used as the history sample identity.
    sourceObservationId: 'main-wire-scientific-session-observation-v1',
    source: 'accepted-step',
    revision,
    acceptedTimeSec,
    values,
  } as unknown as MainWireScientificObservableFrameV1;
}
