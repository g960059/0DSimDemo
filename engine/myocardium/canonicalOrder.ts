export function compareCanonicalStrings(left: string, right: string): number {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

export function compareCanonicalStringTuples(left: readonly string[], right: readonly string[]): number {
  const sharedLength = Math.min(left.length, right.length);
  for (let index = 0; index < sharedLength; index += 1) {
    const order = compareCanonicalStrings(left[index], right[index]);
    if (order !== 0) return order;
  }
  return left.length - right.length;
}
