const PERMISSION_KEY_PATTERN = /^[A-Za-z0-9][A-Za-z0-9:_\.-]{2,63}$/;

export class ReadonlyAdminPermissionSet implements ReadonlySet<string> {
  #delegate: Set<string>;

  constructor(entries: Iterable<string>) {
    this.#delegate = new Set(entries);
  }

  get size() {
    return this.#delegate.size;
  }

  has(value: string) {
    return this.#delegate.has(value);
  }

  forEach(callbackfn: (value: string, value2: string, set: ReadonlySet<string>) => void, thisArg?: unknown) {
    return this.#delegate.forEach((value) => callbackfn.call(thisArg, value, value, this));
  }

  entries() {
    return this.#delegate.entries();
  }

  keys() {
    return this.#delegate.keys();
  }

  values() {
    return this.#delegate.values();
  }

  [Symbol.iterator]() {
    return this.#delegate[Symbol.iterator]();
  }
}

export const isReadonlyAdminPermissionSet = (
  value: unknown,
): value is ReadonlyAdminPermissionSet => value instanceof ReadonlyAdminPermissionSet;

export const normalizeAdminPermissions = (source: Iterable<unknown>) => {
  const normalized = new Set<string>();

  for (const entry of source) {
    if (typeof entry !== 'string') {
      throw new TypeError('Permission entries must be strings.');
    }

    const trimmed = entry.trim();
    if (!trimmed) {
      throw new TypeError('Permission entries must be non-empty strings.');
    }

    if (!PERMISSION_KEY_PATTERN.test(trimmed)) {
      throw new TypeError(`Invalid permission key: ${trimmed}`);
    }

    normalized.add(trimmed);
  }

  return new ReadonlyAdminPermissionSet(normalized);
};
