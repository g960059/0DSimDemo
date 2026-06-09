export type GuytonPaneChromeStateInput = {
  pending: boolean;
  workerBusy: boolean;
  warnings: string[];
  workerError?: string | null;
};

export type GuytonPaneChromeState = {
  showSpinner: boolean;
  warnings: string[];
  hasWarnings: boolean;
};

export function guytonPaneChromeState(input: GuytonPaneChromeStateInput): GuytonPaneChromeState {
  const warnings = uniqueStrings([
    ...input.warnings,
    ...(input.workerError ? [input.workerError] : []),
  ]);
  return {
    showSpinner: input.pending || input.workerBusy,
    warnings,
    hasWarnings: warnings.length > 0,
  };
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}
