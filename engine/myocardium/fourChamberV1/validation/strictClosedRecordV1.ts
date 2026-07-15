export function assertExactPlainRecordV1(
  value: unknown,
  expectedKeys: readonly string[],
  field: string,
): asserts value is Record<string, unknown> {
  if (
    value === null
    || typeof value !== "object"
    || Object.getPrototypeOf(value) !== Object.prototype
  ) {
    throw new Error(`${field} must be a plain object`);
  }
  if (Object.getOwnPropertySymbols(value).length !== 0) {
    throw new Error(`${field} must not contain symbol properties`);
  }
  const ownNames = Object.getOwnPropertyNames(value);
  const expected = new Set(expectedKeys);
  const undeclared = ownNames.filter((key) => !expected.has(key));
  const missing = expectedKeys.filter((key) => !ownNames.includes(key));
  if (undeclared.length !== 0 || missing.length !== 0) {
    throw new Error(
      `${field} must contain exactly [${expectedKeys.join(", ")}]; `
      + `undeclared=[${undeclared.join(", ")}], missing=[${missing.join(", ")}]`,
    );
  }
  for (const key of expectedKeys) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (
      descriptor === undefined
      || !("value" in descriptor)
      || descriptor.enumerable !== true
    ) {
      throw new Error(`${field}.${key} must be an enumerable data property`);
    }
  }
}

export function assertDensePlainArrayV1(
  value: unknown,
  expectedLength: number | undefined,
  field: string,
): asserts value is unknown[] {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) {
    throw new Error(`${field} must be a plain array`);
  }
  if (expectedLength !== undefined && value.length !== expectedLength) {
    throw new Error(`${field} must have length ${expectedLength}; received ${value.length}`);
  }
  if (Object.getOwnPropertySymbols(value).length !== 0) {
    throw new Error(`${field} must not contain symbol properties`);
  }
  const expectedNames = new Set(["length", ...Array.from({ length: value.length }, (_, index) => String(index))]);
  const ownNames = Object.getOwnPropertyNames(value);
  const undeclared = ownNames.filter((key) => !expectedNames.has(key));
  const missing = [...expectedNames].filter((key) => !ownNames.includes(key));
  if (undeclared.length !== 0 || missing.length !== 0) {
    throw new Error(
      `${field} must be dense and contain no extra properties; `
      + `undeclared=[${undeclared.join(", ")}], missing=[${missing.join(", ")}]`,
    );
  }
  for (let index = 0; index < value.length; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
    if (
      descriptor === undefined
      || !("value" in descriptor)
      || descriptor.enumerable !== true
    ) {
      throw new Error(`${field}[${index}] must be an enumerable data property`);
    }
  }
}
