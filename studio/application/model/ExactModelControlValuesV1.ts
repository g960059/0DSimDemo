import type {
  ControlDefinitionV2,
  ModelContractV2,
} from "@/studio/contracts/v2/model";
import type {
  ExactModelFixtureProjectionV1,
  ExactModelProjectedControlValueV1,
} from
  "@/studio/application/model/ExactModelFixtureProjectionV1";

export type ExactModelControlValuesV1 = Readonly<
  Record<string, ExactModelResolvedControlValueV1>
>;

export type ExactModelResolvedControlValueV1 = Exclude<
  ExactModelProjectedControlValueV1,
  Readonly<{ status: "unsupported" }>
>;

export function resolveExactModelControlValueV1(
  definition: ControlDefinitionV2,
  fixture: unknown,
  projection: ExactModelFixtureProjectionV1,
): ExactModelResolvedControlValueV1 {
  const projected = projection.controlValue(fixture, definition.controlId);
  if (projected.status === "unsupported") {
    throw new Error(
      `Exact fixture cannot project registered control ${definition.controlId}`,
    );
  }
  return projected;
}

export function materializeExactModelControlValuesV1(
  contract: ModelContractV2,
  fixture: unknown,
  projection: ExactModelFixtureProjectionV1,
): ExactModelControlValuesV1 {
  return Object.freeze(
    Object.fromEntries(
      contract.controlCatalog.map((definition) => [
        definition.controlId,
        resolveExactModelControlValueV1(definition, fixture, projection),
      ]),
    ),
  );
}
