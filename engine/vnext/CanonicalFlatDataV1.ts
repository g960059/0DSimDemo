export const CANONICAL_FLAT_DATA_V1_SCHEMA_ID =
  "circleheart-canonical-flat-data-v1" as const;
export const CANONICAL_FLAT_CHECKPOINT_V1_MAGIC = "CHFLATB1" as const;

const CHECKPOINT_HEADER_BYTES = 8 + 4 + 32;
const MAX_DEPTH = 256;
const MAX_CONTAINER_ITEMS = 1_000_000;
const MAX_STRING_BYTES = 16 * 1024 * 1024;

const enum TagV1 {
  Null = 0,
  False = 1,
  True = 2,
  Float64 = 3,
  String = 4,
  Array = 5,
  Record = 6,
  NullPrototypeRecord = 7,
  Float64Array = 16,
  Float32Array = 17,
  Int32Array = 18,
  Uint32Array = 19,
  Int16Array = 20,
  Uint16Array = 21,
  Int8Array = 22,
  Uint8Array = 23,
  Uint8ClampedArray = 24,
}

type SupportedTypedArrayV1 =
  | Float64Array
  | Float32Array
  | Int32Array
  | Uint32Array
  | Int16Array
  | Uint16Array
  | Int8Array
  | Uint8Array
  | Uint8ClampedArray;

/** A bounded, caller-owned destination used by the numerical state authority. */
export type CanonicalFlatDataDestinationV1 = Uint8Array;

/**
 * Encodes one value into caller-owned storage without retaining any strings or
 * object identities. A failed encode leaves the reported length unchanged;
 * callers must not publish the destination until this function returns.
 */
export function encodeCanonicalFlatDataIntoV1(
  value: unknown,
  destination: CanonicalFlatDataDestinationV1,
): number {
  assertOwnedDestination(destination);
  const writer = new FixedWriterV1(destination);
  encodeValue(value, writer, new Set<object>(), 0, "$" );
  return writer.length;
}

/** Decodes exactly `length` bytes and rejects trailing or non-canonical data. */
export function decodeCanonicalFlatDataV1(
  source: Uint8Array,
  length = source.byteLength,
): unknown {
  assertOwnedDestination(source);
  if (!Number.isSafeInteger(length) || length < 0 || length > source.byteLength) {
    throw new Error("Canonical flat data length is invalid");
  }
  const reader = new ReaderV1(source.subarray(0, length));
  const value = decodeValue(reader, 0);
  if (reader.remaining !== 0) {
    throw new Error("Canonical flat data contains trailing bytes");
  }
  return value;
}

/** Portable SHA-256 envelope for durable/reference checkpoints. */
export async function encodeCanonicalFlatCheckpointV1(
  value: unknown,
): Promise<Uint8Array> {
  const payloadLength = measureCanonicalFlatDataV1(value);
  const payload = new Uint8Array(payloadLength);
  const written = encodeCanonicalFlatDataIntoV1(value, payload);
  if (written !== payloadLength) {
    throw new Error("Canonical flat checkpoint length changed while encoding");
  }
  const digest = await sha256Bytes(payload);
  const encoded = new Uint8Array(CHECKPOINT_HEADER_BYTES + payloadLength);
  encoded.set(new TextEncoder().encode(CANONICAL_FLAT_CHECKPOINT_V1_MAGIC), 0);
  new DataView(encoded.buffer).setUint32(8, payloadLength, false);
  encoded.set(digest, 12);
  encoded.set(payload, CHECKPOINT_HEADER_BYTES);
  return encoded;
}

export async function decodeCanonicalFlatCheckpointV1(
  input: Uint8Array,
): Promise<unknown> {
  assertOwnedDestination(input);
  if (input.byteLength < CHECKPOINT_HEADER_BYTES) {
    throw new Error("Canonical flat checkpoint is truncated");
  }
  const magic = new TextDecoder("utf-8", { fatal: true }).decode(
    input.subarray(0, 8),
  );
  if (magic !== CANONICAL_FLAT_CHECKPOINT_V1_MAGIC) {
    throw new Error("Canonical flat checkpoint magic is unsupported");
  }
  const payloadLength = new DataView(
    input.buffer,
    input.byteOffset,
    input.byteLength,
  ).getUint32(8, false);
  if (payloadLength !== input.byteLength - CHECKPOINT_HEADER_BYTES) {
    throw new Error("Canonical flat checkpoint payload length is invalid");
  }
  const expected = input.subarray(12, CHECKPOINT_HEADER_BYTES);
  const payload = input.subarray(CHECKPOINT_HEADER_BYTES);
  const actual = await sha256Bytes(payload);
  if (!constantTimeEqual(expected, actual)) {
    throw new Error("Canonical flat checkpoint SHA-256 mismatch");
  }
  return decodeCanonicalFlatDataV1(payload);
}

export function measureCanonicalFlatDataV1(value: unknown): number {
  const writer = new MeasuringWriterV1();
  encodeValue(value, writer, new Set<object>(), 0, "$" );
  return writer.length;
}

interface WriterV1 {
  readonly length: number;
  u8(value: number): void;
  u16(value: number): void;
  u32(value: number): void;
  i8(value: number): void;
  i16(value: number): void;
  i32(value: number): void;
  f32(value: number): void;
  f64(value: number): void;
  bytes(value: Uint8Array): void;
}

class FixedWriterV1 implements WriterV1 {
  readonly #destination: Uint8Array;
  readonly #view: DataView;
  #offset = 0;

  constructor(destination: Uint8Array) {
    this.#destination = destination;
    this.#view = new DataView(
      destination.buffer,
      destination.byteOffset,
      destination.byteLength,
    );
  }

  get length(): number {
    return this.#offset;
  }

  u8(value: number): void {
    this.reserve(1);
    this.#view.setUint8(this.#offset, value);
    this.#offset += 1;
  }

  u16(value: number): void {
    this.reserve(2);
    this.#view.setUint16(this.#offset, value, false);
    this.#offset += 2;
  }

  u32(value: number): void {
    this.reserve(4);
    this.#view.setUint32(this.#offset, value, false);
    this.#offset += 4;
  }

  i8(value: number): void {
    this.reserve(1);
    this.#view.setInt8(this.#offset, value);
    this.#offset += 1;
  }

  i16(value: number): void {
    this.reserve(2);
    this.#view.setInt16(this.#offset, value, false);
    this.#offset += 2;
  }

  i32(value: number): void {
    this.reserve(4);
    this.#view.setInt32(this.#offset, value, false);
    this.#offset += 4;
  }

  f32(value: number): void {
    this.reserve(4);
    this.#view.setFloat32(this.#offset, value, false);
    this.#offset += 4;
  }

  f64(value: number): void {
    this.reserve(8);
    this.#view.setFloat64(this.#offset, value, false);
    this.#offset += 8;
  }

  bytes(value: Uint8Array): void {
    this.reserve(value.byteLength);
    this.#destination.set(value, this.#offset);
    this.#offset += value.byteLength;
  }

  private reserve(byteLength: number): void {
    if (this.#offset + byteLength > this.#destination.byteLength) {
      throw new Error("Canonical flat data exceeds its fixed capacity");
    }
  }
}

class MeasuringWriterV1 implements WriterV1 {
  #length = 0;

  get length(): number {
    return this.#length;
  }

  u8(): void { this.add(1); }
  u16(): void { this.add(2); }
  u32(): void { this.add(4); }
  i8(): void { this.add(1); }
  i16(): void { this.add(2); }
  i32(): void { this.add(4); }
  f32(): void { this.add(4); }
  f64(): void { this.add(8); }
  bytes(value: Uint8Array): void { this.add(value.byteLength); }

  private add(byteLength: number): void {
    this.#length += byteLength;
    if (!Number.isSafeInteger(this.#length) || this.#length > 0xffff_ffff) {
      throw new Error("Canonical flat data is too large");
    }
  }
}

class ReaderV1 {
  readonly #source: Uint8Array;
  readonly #view: DataView;
  #offset = 0;

  constructor(source: Uint8Array) {
    this.#source = source;
    this.#view = new DataView(source.buffer, source.byteOffset, source.byteLength);
  }

  get remaining(): number {
    return this.#source.byteLength - this.#offset;
  }

  u8(): number { this.require(1); return this.#view.getUint8(this.#offset++); }
  i8(): number { this.require(1); return this.#view.getInt8(this.#offset++); }
  u16(): number {
    this.require(2);
    const value = this.#view.getUint16(this.#offset, false);
    this.#offset += 2;
    return value;
  }
  i16(): number {
    this.require(2);
    const value = this.#view.getInt16(this.#offset, false);
    this.#offset += 2;
    return value;
  }
  u32(): number {
    this.require(4);
    const value = this.#view.getUint32(this.#offset, false);
    this.#offset += 4;
    return value;
  }
  i32(): number {
    this.require(4);
    const value = this.#view.getInt32(this.#offset, false);
    this.#offset += 4;
    return value;
  }
  f32(): number {
    this.require(4);
    const value = this.#view.getFloat32(this.#offset, false);
    this.#offset += 4;
    return value;
  }
  f64(): number {
    this.require(8);
    const value = this.#view.getFloat64(this.#offset, false);
    this.#offset += 8;
    return value;
  }
  bytes(length: number): Uint8Array {
    this.require(length);
    const value = this.#source.subarray(this.#offset, this.#offset + length);
    this.#offset += length;
    return value;
  }

  private require(byteLength: number): void {
    if (!Number.isSafeInteger(byteLength) || byteLength < 0 || byteLength > this.remaining) {
      throw new Error("Canonical flat data is truncated");
    }
  }
}

function encodeValue(
  value: unknown,
  writer: WriterV1,
  ancestors: Set<object>,
  depth: number,
  path: string,
): void {
  if (depth > MAX_DEPTH) throw new Error(`Canonical flat data ${path} is too deep`);
  if (value === null) { writer.u8(TagV1.Null); return; }
  if (value === false) { writer.u8(TagV1.False); return; }
  if (value === true) { writer.u8(TagV1.True); return; }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error(`Canonical flat data ${path} must be finite`);
    }
    writer.u8(TagV1.Float64);
    writer.f64(value);
    return;
  }
  if (typeof value === "string") {
    writer.u8(TagV1.String);
    writeString(value, writer, path);
    return;
  }
  if (typeof value !== "object") {
    throw new Error(`Canonical flat data ${path} has an unsupported value`);
  }
  if (ancestors.has(value)) {
    throw new Error(`Canonical flat data ${path} contains a cycle`);
  }
  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      const descriptors = Object.getOwnPropertyDescriptors(value);
      assertDenseArrayDescriptors(value, descriptors, path);
      assertItemCount(value.length, path);
      writer.u8(TagV1.Array);
      writer.u32(value.length);
      for (let index = 0; index < value.length; index += 1) {
        encodeValue(
          descriptors[String(index)]!.value,
          writer,
          ancestors,
          depth + 1,
          `${path}/${index}`,
        );
      }
      return;
    }
    if (isSupportedTypedArray(value)) {
      encodeTypedArray(value, writer, path);
      return;
    }
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      throw new Error(`Canonical flat data ${path} has an unsupported prototype`);
    }
    const descriptors = Object.getOwnPropertyDescriptors(value);
    const keys = Object.keys(descriptors).sort(compareStrings);
    assertItemCount(keys.length, path);
    for (const key of Reflect.ownKeys(descriptors)) {
      if (typeof key !== "string" || !Object.prototype.propertyIsEnumerable.call(value, key)) {
        throw new Error(`Canonical flat data ${path} contains a non-enumerable or symbol key`);
      }
    }
    writer.u8(
      prototype === null ? TagV1.NullPrototypeRecord : TagV1.Record,
    );
    writer.u32(keys.length);
    for (const key of keys) {
      const descriptor = descriptors[key]!;
      if (!("value" in descriptor)) {
        throw new Error(`Canonical flat data ${path}/${escapePointer(key)} is an accessor`);
      }
      writeString(key, writer, `${path} key`);
      encodeValue(
        descriptor.value,
        writer,
        ancestors,
        depth + 1,
        `${path}/${escapePointer(key)}`,
      );
    }
  } finally {
    ancestors.delete(value);
  }
}

function decodeValue(reader: ReaderV1, depth: number): unknown {
  if (depth > MAX_DEPTH) throw new Error("Canonical flat data is too deep");
  const tag = reader.u8();
  switch (tag) {
    case TagV1.Null: return null;
    case TagV1.False: return false;
    case TagV1.True: return true;
    case TagV1.Float64: {
      const value = reader.f64();
      if (!Number.isFinite(value)) throw new Error("Canonical flat number must be finite");
      return value;
    }
    case TagV1.String: return readString(reader);
    case TagV1.Array: {
      const length = readItemCount(reader);
      const values = new Array<unknown>(length);
      for (let index = 0; index < length; index += 1) {
        values[index] = decodeValue(reader, depth + 1);
      }
      return Object.freeze(values);
    }
    case TagV1.Record:
    case TagV1.NullPrototypeRecord: {
      const count = readItemCount(reader);
      const record = Object.create(
        tag === TagV1.Record ? Object.prototype : null,
      ) as Record<string, unknown>;
      let previous: string | null = null;
      for (let index = 0; index < count; index += 1) {
        const key = readString(reader);
        if (previous !== null && compareStrings(previous, key) >= 0) {
          throw new Error("Canonical flat record keys are not strictly ordered");
        }
        previous = key;
        Object.defineProperty(record, key, {
          value: decodeValue(reader, depth + 1),
          enumerable: true,
          writable: false,
          configurable: false,
        });
      }
      return Object.freeze(record);
    }
    case TagV1.Float64Array:
    case TagV1.Float32Array:
    case TagV1.Int32Array:
    case TagV1.Uint32Array:
    case TagV1.Int16Array:
    case TagV1.Uint16Array:
    case TagV1.Int8Array:
    case TagV1.Uint8Array:
    case TagV1.Uint8ClampedArray:
      return decodeTypedArray(tag, reader);
    default:
      throw new Error("Canonical flat data tag is unsupported");
  }
}

function encodeTypedArray(
  value: SupportedTypedArrayV1,
  writer: WriterV1,
  path: string,
): void {
  assertItemCount(value.length, path);
  const tag = typedArrayTag(value);
  writer.u8(tag);
  writer.u32(value.length);
  for (let index = 0; index < value.length; index += 1) {
    const item = value[index]!;
    switch (tag) {
      case TagV1.Float64Array:
        if (!Number.isFinite(item)) throw new Error(`Canonical flat data ${path}/${index} must be finite`);
        writer.f64(item);
        break;
      case TagV1.Float32Array:
        if (!Number.isFinite(item)) throw new Error(`Canonical flat data ${path}/${index} must be finite`);
        writer.f32(item);
        break;
      case TagV1.Int32Array: writer.i32(item); break;
      case TagV1.Uint32Array: writer.u32(item); break;
      case TagV1.Int16Array: writer.i16(item); break;
      case TagV1.Uint16Array: writer.u16(item); break;
      case TagV1.Int8Array: writer.i8(item); break;
      case TagV1.Uint8Array:
      case TagV1.Uint8ClampedArray: writer.u8(item); break;
    }
  }
}

function decodeTypedArray(tag: TagV1, reader: ReaderV1): SupportedTypedArrayV1 {
  const length = readItemCount(reader);
  switch (tag) {
    case TagV1.Float64Array: {
      const result = new Float64Array(length);
      for (let index = 0; index < length; index += 1) {
        const value = reader.f64();
        if (!Number.isFinite(value)) throw new Error("Canonical flat typed value must be finite");
        result[index] = value;
      }
      return result;
    }
    case TagV1.Float32Array: {
      const result = new Float32Array(length);
      for (let index = 0; index < length; index += 1) {
        const value = reader.f32();
        if (!Number.isFinite(value)) throw new Error("Canonical flat typed value must be finite");
        result[index] = value;
      }
      return result;
    }
    case TagV1.Int32Array: return fillTyped(new Int32Array(length), () => reader.i32());
    case TagV1.Uint32Array: return fillTyped(new Uint32Array(length), () => reader.u32());
    case TagV1.Int16Array: return fillTyped(new Int16Array(length), () => reader.i16());
    case TagV1.Uint16Array: return fillTyped(new Uint16Array(length), () => reader.u16());
    case TagV1.Int8Array: return fillTyped(new Int8Array(length), () => reader.i8());
    case TagV1.Uint8Array: return fillTyped(new Uint8Array(length), () => reader.u8());
    case TagV1.Uint8ClampedArray:
      return fillTyped(new Uint8ClampedArray(length), () => reader.u8());
    default: throw new Error("Canonical flat typed-array tag is unsupported");
  }
}

function fillTyped<T extends SupportedTypedArrayV1>(
  destination: T,
  read: () => number,
): T {
  for (let index = 0; index < destination.length; index += 1) {
    destination[index] = read();
  }
  return destination;
}

function typedArrayTag(value: SupportedTypedArrayV1): TagV1 {
  if (value instanceof Float64Array) return TagV1.Float64Array;
  if (value instanceof Float32Array) return TagV1.Float32Array;
  if (value instanceof Int32Array) return TagV1.Int32Array;
  if (value instanceof Uint32Array) return TagV1.Uint32Array;
  if (value instanceof Int16Array) return TagV1.Int16Array;
  if (value instanceof Uint16Array) return TagV1.Uint16Array;
  if (value instanceof Int8Array) return TagV1.Int8Array;
  if (value instanceof Uint8ClampedArray) return TagV1.Uint8ClampedArray;
  return TagV1.Uint8Array;
}

function isSupportedTypedArray(value: object): value is SupportedTypedArrayV1 {
  return value instanceof Float64Array
    || value instanceof Float32Array
    || value instanceof Int32Array
    || value instanceof Uint32Array
    || value instanceof Int16Array
    || value instanceof Uint16Array
    || value instanceof Int8Array
    || value instanceof Uint8Array
    || value instanceof Uint8ClampedArray;
}

function assertDenseArrayDescriptors(
  value: readonly unknown[],
  descriptors: ReturnType<typeof Object.getOwnPropertyDescriptors>,
  path: string,
): void {
  const length = value.length;
  const keys = Reflect.ownKeys(descriptors);
  if (keys.length !== length + 1 || !("length" in descriptors)) {
    throw new Error(`Canonical flat data ${path} must be a dense plain array`);
  }
  for (let index = 0; index < length; index += 1) {
    const descriptor = descriptors[String(index)];
    if (descriptor === undefined || !("value" in descriptor)) {
      throw new Error(`Canonical flat data ${path}/${index} is missing or an accessor`);
    }
  }
}

function writeString(value: string, writer: WriterV1, path: string): void {
  if (!isWellFormedString(value)) {
    throw new Error(`Canonical flat data ${path} contains an unpaired surrogate`);
  }
  const bytes = new TextEncoder().encode(value);
  if (bytes.byteLength > MAX_STRING_BYTES) {
    throw new Error(`Canonical flat data ${path} string is too large`);
  }
  writer.u32(bytes.byteLength);
  writer.bytes(bytes);
}

function readString(reader: ReaderV1): string {
  const length = reader.u32();
  if (length > MAX_STRING_BYTES) throw new Error("Canonical flat string is too large");
  const value = new TextDecoder("utf-8", { fatal: true }).decode(reader.bytes(length));
  if (!isWellFormedString(value)) throw new Error("Canonical flat string is malformed");
  return value;
}

function isWellFormedString(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) return false;
      index += 1;
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      return false;
    }
  }
  return true;
}

function readItemCount(reader: ReaderV1): number {
  const count = reader.u32();
  assertItemCount(count, "decoded container");
  return count;
}

function assertItemCount(count: number, path: string): void {
  if (!Number.isSafeInteger(count) || count < 0 || count > MAX_CONTAINER_ITEMS) {
    throw new Error(`Canonical flat data ${path} has too many items`);
  }
}

function assertOwnedDestination(value: Uint8Array): void {
  if (
    !(value instanceof Uint8Array)
    || value.buffer instanceof SharedArrayBuffer
    || (value.buffer as ArrayBuffer & { readonly resizable?: boolean }).resizable
      === true
  ) {
    throw new Error("Canonical flat data requires an owned fixed Uint8Array");
  }
}

function compareStrings(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function escapePointer(value: string): string {
  return value.replaceAll("~", "~0").replaceAll("/", "~1");
}

async function sha256Bytes(bytes: Uint8Array): Promise<Uint8Array> {
  const subtle = globalThis.crypto?.subtle;
  if (subtle === undefined) {
    throw new Error("Web Crypto subtle.digest is required for flat checkpoints");
  }
  return new Uint8Array(await subtle.digest("SHA-256", bytes));
}

function constantTimeEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.byteLength !== right.byteLength) return false;
  let difference = 0;
  for (let index = 0; index < left.byteLength; index += 1) {
    difference |= left[index]! ^ right[index]!;
  }
  return difference === 0;
}
