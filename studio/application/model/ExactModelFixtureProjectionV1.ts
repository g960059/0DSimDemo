export type ExactModelProjectedControlValueV1 =
  | Readonly<{ status: "value"; value: number }>
  | Readonly<{ status: "mixed" }>
  | Readonly<{ status: "unsupported" }>;

export type ExactModelFixtureProjectionV1 = Readonly<{
  controlValue(
    fixture: unknown,
    controlId: string,
  ): ExactModelProjectedControlValueV1;
}>;
