import type {
  ControlDefinitionV2,
  ModelContractV2,
} from "@/studio/contracts/v2/model";
import type { ExactModelFixtureProjectionV1 } from
  "@/studio/application/model/ExactModelFixtureProjectionV1";

export function resolveExactModelControlValueV1(
  definition: ControlDefinitionV2,
  fixture: unknown,
  projection: ExactModelFixtureProjectionV1,
): number {
  return projection.controlValue(fixture, definition.controlId) ??
    definition.defaultValue;
}

export function materializeExactModelControlValuesV1(
  contract: ModelContractV2,
  fixture: unknown,
  projection: ExactModelFixtureProjectionV1,
): Readonly<Record<string, number>> {
  return Object.freeze(
    Object.fromEntries(
      contract.controlCatalog.map((definition) => [
        definition.controlId,
        resolveExactModelControlValueV1(definition, fixture, projection),
      ]),
    ),
  );
}
