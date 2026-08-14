export type FlatDenseLuWorkspaceV1 = Readonly<{
  dimension: number;
  factors: Float64Array;
  pivotRowByColumn: Int32Array;
  transformedRightHandSide: Float64Array;
}>;

export type FlatDenseLuWorkspaceViewsV1 = Readonly<{
  dimension: number;
  factors: Float64Array;
  pivotRowByColumn: Int32Array;
  transformedRightHandSide: Float64Array;
}>;

export function createFlatDenseLuWorkspaceV1(
  dimension: number,
): FlatDenseLuWorkspaceV1 {
  requireDimension(dimension);
  return bindFlatDenseLuWorkspaceV1({
    dimension,
    factors: new Float64Array(dimension * dimension),
    pivotRowByColumn: new Int32Array(dimension),
    transformedRightHandSide: new Float64Array(dimension),
  });
}

/**
 * Admits caller-owned, nonoverlapping typed views as persistent LU scratch.
 * Views may share one backing buffer when their byte ranges are disjoint.
 */
export function bindFlatDenseLuWorkspaceV1(
  views: FlatDenseLuWorkspaceViewsV1,
): FlatDenseLuWorkspaceV1 {
  requireDimension(views.dimension);
  requireFloat64Length(
    views.factors,
    views.dimension * views.dimension,
    "LU factors",
  );
  requireInt32Length(
    views.pivotRowByColumn,
    views.dimension,
    "LU pivot rows",
  );
  requireFloat64Length(
    views.transformedRightHandSide,
    views.dimension,
    "LU transformed right-hand side",
  );
  requireDisjointViews([
    views.factors,
    views.pivotRowByColumn,
    views.transformedRightHandSide,
  ]);
  return Object.freeze({
    dimension: views.dimension,
    factors: views.factors,
    pivotRowByColumn: views.pivotRowByColumn,
    transformedRightHandSide: views.transformedRightHandSide,
  });
}

/**
 * Deterministic row-major LU with partial pivoting. The source matrix is never
 * mutated. False means that no finite pivot above `minimumAbsolutePivot`
 * exists; the workspace must not be used for a solve in that case.
 */
export function factorFlatDenseMatrixV1(
  source: Float64Array,
  workspace: FlatDenseLuWorkspaceV1,
  minimumAbsolutePivot = 1e-14,
): boolean {
  const { dimension, factors } = workspace;
  requireMatrixLength(source, dimension, "source matrix");
  requirePositiveFinite(minimumAbsolutePivot, "minimumAbsolutePivot");
  factors.set(source);

  return factorPreparedFlatDenseMatrixV1(workspace, minimumAbsolutePivot);
}

/**
 * Factor values already written into `workspace.factors`. The caller must
 * have validated that every entry is finite before granting this hot path.
 */
export function factorPreparedFlatDenseMatrixV1(
  workspace: FlatDenseLuWorkspaceV1,
  minimumAbsolutePivot = 1e-14,
): boolean {
  const { dimension, factors, pivotRowByColumn } = workspace;
  requirePositiveFinite(minimumAbsolutePivot, "minimumAbsolutePivot");

  for (let column = 0; column < dimension; column += 1) {
    let pivotRow = column;
    let pivotMagnitude = Math.abs(
      factors[column * dimension + column]!,
    );
    for (let row = column + 1; row < dimension; row += 1) {
      const magnitude = Math.abs(factors[row * dimension + column]!);
      if (magnitude > pivotMagnitude) {
        pivotMagnitude = magnitude;
        pivotRow = row;
      }
    }
    if (!Number.isFinite(pivotMagnitude)
        || pivotMagnitude < minimumAbsolutePivot) {
      return false;
    }
    pivotRowByColumn[column] = pivotRow;
    if (pivotRow !== column) {
      swapRows(factors, dimension, pivotRow, column);
    }
    const pivot = factors[column * dimension + column]!;
    for (let row = column + 1; row < dimension; row += 1) {
      const factorIndex = row * dimension + column;
      const factor = factors[factorIndex]! / pivot;
      factors[factorIndex] = factor;
      for (let trailing = column + 1;
        trailing < dimension;
        trailing += 1) {
        const targetIndex = row * dimension + trailing;
        factors[targetIndex] -= factor
          * factors[column * dimension + trailing]!;
      }
    }
  }
  return true;
}

export function solveFactoredFlatDenseSystemV1(
  workspace: FlatDenseLuWorkspaceV1,
  rightHandSide: Float64Array,
  solution: Float64Array,
): void {
  const { dimension } = workspace;
  requireVectorLength(rightHandSide, dimension, "right-hand side");
  requireVectorLength(solution, dimension, "solution");

  solvePreparedFactoredFlatDenseSystemV1(
    workspace,
    rightHandSide,
    solution,
  );
}

/** Solve with inputs already validated by the owning nonlinear solver. */
export function solvePreparedFactoredFlatDenseSystemV1(
  workspace: FlatDenseLuWorkspaceV1,
  rightHandSide: Float64Array,
  solution: Float64Array,
): void {
  const {
    dimension,
    factors,
    pivotRowByColumn,
    transformedRightHandSide,
  } = workspace;
  transformedRightHandSide.set(rightHandSide);

  for (let column = 0; column < dimension; column += 1) {
    const pivotRow = pivotRowByColumn[column]!;
    if (pivotRow !== column) {
      const temporary = transformedRightHandSide[column]!;
      transformedRightHandSide[column] =
        transformedRightHandSide[pivotRow]!;
      transformedRightHandSide[pivotRow] = temporary;
    }
    const pivotValue = transformedRightHandSide[column]!;
    for (let row = column + 1; row < dimension; row += 1) {
      transformedRightHandSide[row] -=
        factors[row * dimension + column]! * pivotValue;
    }
  }

  for (let row = dimension - 1; row >= 0; row -= 1) {
    let value = transformedRightHandSide[row]!;
    for (let column = row + 1; column < dimension; column += 1) {
      value -= factors[row * dimension + column]! * solution[column]!;
    }
    solution[row] = value / factors[row * dimension + row]!;
    if (!Number.isFinite(solution[row])) {
      throw new Error("flat dense LU produced a non-finite solution");
    }
  }
}

function swapRows(
  matrix: Float64Array,
  dimension: number,
  firstRow: number,
  secondRow: number,
): void {
  for (let column = 0; column < dimension; column += 1) {
    const firstIndex = firstRow * dimension + column;
    const secondIndex = secondRow * dimension + column;
    const temporary = matrix[firstIndex]!;
    matrix[firstIndex] = matrix[secondIndex]!;
    matrix[secondIndex] = temporary;
  }
}

function requireDimension(dimension: number): void {
  if (!Number.isInteger(dimension) || dimension <= 0) {
    throw new RangeError("flat dense dimension must be a positive integer");
  }
}

function requireFloat64Length(
  value: Float64Array,
  expected: number,
  label: string,
): void {
  if (!(value instanceof Float64Array) || value.length !== expected) {
    throw new RangeError(`${label} must contain ${expected} f64 values`);
  }
}

function requireInt32Length(
  value: Int32Array,
  expected: number,
  label: string,
): void {
  if (!(value instanceof Int32Array) || value.length !== expected) {
    throw new RangeError(`${label} must contain ${expected} int32 values`);
  }
}

function requireDisjointViews(views: readonly ArrayBufferView[]): void {
  for (let left = 0; left < views.length; left += 1) {
    const first = views[left]!;
    for (let right = left + 1; right < views.length; right += 1) {
      const second = views[right]!;
      if (
        first.buffer === second.buffer
        && first.byteOffset < second.byteOffset + second.byteLength
        && second.byteOffset < first.byteOffset + first.byteLength
      ) {
        throw new RangeError("flat dense LU workspace views must not overlap");
      }
    }
  }
}

function requireMatrixLength(
  value: Float64Array,
  dimension: number,
  label: string,
): void {
  if (!(value instanceof Float64Array)
      || value.length !== dimension * dimension) {
    throw new RangeError(`${label} must be a ${dimension}x${dimension} f64 matrix`);
  }
  if (value.some((entry) => !Number.isFinite(entry))) {
    throw new RangeError(`${label} must contain only finite values`);
  }
}

function requireVectorLength(
  value: Float64Array,
  dimension: number,
  label: string,
): void {
  if (!(value instanceof Float64Array) || value.length !== dimension) {
    throw new RangeError(`${label} must contain ${dimension} f64 values`);
  }
  if (value.some((entry) => !Number.isFinite(entry))) {
    throw new RangeError(`${label} must contain only finite values`);
  }
}

function requirePositiveFinite(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${label} must be positive and finite`);
  }
}
