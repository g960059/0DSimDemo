export type GuytonPaneChromeStateInput = {
  pending: boolean;
  workerBusy: boolean;
  warnings: string[];
  notes?: string[];
  workerError?: string | null;
};

export type GuytonPaneChromeState = {
  showSpinner: boolean;
  warnings: string[];
  notes: string[];
  hasWarnings: boolean;
};

export function guytonPaneChromeState(input: GuytonPaneChromeStateInput): GuytonPaneChromeState {
  const warnings = uniqueStrings([
    ...input.warnings,
    ...(input.workerError ? [input.workerError] : []),
  ]);
  const notes = uniqueStrings(input.notes ?? []);
  return {
    showSpinner: input.pending || input.workerBusy,
    warnings,
    notes,
    hasWarnings: warnings.length > 0,
  };
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}
