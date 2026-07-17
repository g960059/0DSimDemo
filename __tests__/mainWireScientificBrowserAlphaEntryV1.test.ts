import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const readSource = (relativePath: string): string =>
  readFileSync(path.resolve(relativePath), 'utf8');

describe('scientific browser alpha entry V1', () => {
  it('is an explicit lazy route that is absent from legacy navigation', () => {
    const entry = readSource('index.tsx');
    const layout = readSource('components/Layout.tsx');

    expect(entry).toContain("import('./components/scientificAlpha/ScientificRuntimeAlphaPage')");
    expect(entry).toMatch(/path=["']scientific-alpha["']/);
    expect(layout).not.toContain('scientific-alpha');
  });

  it('owns the real scientific Worker client with no legacy runtime fallback', () => {
    const page = readSource(
      'components/scientificAlpha/ScientificRuntimeAlphaPage.tsx',
    );
    const client = readSource(
      'engine/scientificBrowser/MainWireScientificWorkerClientV1.ts',
    );

    expect(page).toContain('new MainWireScientificWorkerClientV1()');
    expect(page).toContain("kind: 'createCanonicalSession'");
    expect(page).toContain("kind: 'runTransient'");
    expect(page).toContain('Run one beat');
    expect(page).toContain('Reset cold start');
    expect(page).toContain('SCIENTIFIC_ALPHA_HISTORY_CAPACITY');
    expect(page).toContain('<ScientificAlphaPvTrajectories');
    expect(page).toContain('<ScientificAlphaWaveforms');
    expect(client).toContain(
      'new URL("./mainWireScientificWorkerV1.ts", import.meta.url)',
    );
    expect(`${page}\n${client}`).not.toMatch(
      /(?:from\s+|import\s*\()["'][^"']*(?:ModelCore|previewController|previewWorker|backendSelector)[^"']*["']/,
    );
  });
});
