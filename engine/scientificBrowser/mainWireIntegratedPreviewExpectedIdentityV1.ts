/**
 * Main-thread trust anchor for the integrated-preview Worker.
 *
 * Keep this module literal-only. Importing the release assembly here would
 * pull the numerical model into the browser bundle and would let Worker-owned
 * data become its own expected identity. Node tests bind these literals back
 * to the checked-in release, seed, and live session construction.
 */
export const MAIN_WIRE_INTEGRATED_PREVIEW_BROWSER_RELEASE_REF_V1 =
  Object.freeze({
    id: "circleheart/adult-five-wall-integrated-preview",
    version: "0.1.0",
    sha256:
      "ccb12d25e279ccab81ba9372b89f7ea16ba5e4ab3cb5694107c0cdd155add5f5",
  } as const);

const SOURCE_SEED_IDENTITY_V1 = Object.freeze({
  payloadSha256:
    "a52afa5cdc291bb14c7a4bbae87e8235d4705bc6939453f9c86c9a66aad99821",
  startCheckpointSha256:
    "9fc15d39328e3ef1e3c4f17d22b99c224fd44efebbf4b1fe5cbdb5cec3036aef",
  terminalCheckpointSha256:
    "f4024a1570f791315211a0d88b767fb4b0e846ac80dba3f57079ca7924accad0",
} as const);

export const MAIN_WIRE_INTEGRATED_PREVIEW_BROWSER_EXPECTED_IDENTITY_V1 =
  Object.freeze({
    releaseRef: MAIN_WIRE_INTEGRATED_PREVIEW_BROWSER_RELEASE_REF_V1,
    sourceSeed: SOURCE_SEED_IDENTITY_V1,
    checkpointClaimSha256: Object.freeze({
      integratedV3:
        "9da6f4b7b469a0ab066282d8540622f4dcb207d63369d3e8e172abd731b43600",
      coronaryV3:
        "8f2ada5247467b1e86d8a465e244be383d887bd2410044354af37447481b5998",
      coronaryV2:
        "091a5d036c621883531069cf4289d096daa10d6ee76bd9ca032677ba2d8693ab",
      composedRhythmV2:
        "f7a7dfcfd5e84a253dd4be6af2174e64081c0f294799ae5e7b244c1674ca1c30",
    }),
    byMcsPresetId: Object.freeze({
      "all-off": Object.freeze({
        simulationInputSpecSha256:
          "73248db5e5f67036a8af004901b7a28744f76a19677fa721fe4940cb110d9174",
        createStartCheckpointSha256:
          SOURCE_SEED_IDENTITY_V1.startCheckpointSha256,
      }),
      "lvad-hmii-9000-one-beat-transient": Object.freeze({
        simulationInputSpecSha256:
          "be91f6813435fcdf58f5dbe8b7a359d683258208b396bcb72980af333f9a629d",
        createStartCheckpointSha256:
          "2202d829789d38649aa936995623afd59cb47e3e64f0d4292ad35693389b61c1",
      }),
    }),
  } as const);
