import net from "node:net";
import { URL } from "node:url";

type RedisPrimitive = string | number | null | Buffer | RedisPrimitive[];

type Resolver = (value: RedisPrimitive) => void;
type Rejecter = (error: Error) => void;

const CRLF = Buffer.from("\r\n");

const buildCommand = (parts: (string | number | Buffer)[]): Buffer => {
  const segments: Buffer[] = [Buffer.from(`*${parts.length}`), CRLF];
  for (const part of parts) {
    const chunk =
      typeof part === "string"
        ? Buffer.from(part)
        : typeof part === "number"
          ? Buffer.from(String(part))
          : part;
    segments.push(Buffer.from(`$${chunk.length}`), CRLF, chunk, CRLF);
  }
  return Buffer.concat(segments);
};

const parseInteger = (buffer: Buffer, start: number): { value: number; nextIndex: number } | null => {
  const end = buffer.indexOf(CRLF, start);
  if (end === -1) {
    return null;
  }
  const slice = buffer.slice(start, end).toString();
  const value = Number.parseInt(slice, 10);
  if (Number.isNaN(value)) {
    throw new Error(`Invalid integer response: ${slice}`);
  }
  return { value, nextIndex: end + CRLF.length };
};

const parseSimpleString = (buffer: Buffer, start: number): { value: string; nextIndex: number } | null => {
  const end = buffer.indexOf(CRLF, start);
  if (end === -1) {
    return null;
  }
  return { value: buffer.slice(start, end).toString(), nextIndex: end + CRLF.length };
};

const parseBulkString = (buffer: Buffer, start: number): { value: string | null; nextIndex: number } | null => {
  const lengthResult = parseInteger(buffer, start);
  if (!lengthResult) {
    return null;
  }
  const { value: length, nextIndex } = lengthResult;
  if (length === -1) {
    return { value: null, nextIndex };
  }
  const end = nextIndex + length;
  if (buffer.length < end + CRLF.length) {
    return null;
  }
  const chunk = buffer.slice(nextIndex, end).toString();
  return { value: chunk, nextIndex: end + CRLF.length };
};

const parseArray = (buffer: Buffer, start: number): { value: RedisPrimitive[]; nextIndex: number } | null => {
  const lengthResult = parseInteger(buffer, start);
  if (!lengthResult) {
    return null;
  }
  const { value: length, nextIndex } = lengthResult;
  if (length === -1) {
    return { value: [], nextIndex };
  }

  let cursor = nextIndex;
  const values: RedisPrimitive[] = [];

  for (let index = 0; index < length; index += 1) {
    const parsed = parseResponse(buffer, cursor);
    if (!parsed) {
      return null;
    }
    values.push(parsed.value);
    cursor = parsed.nextIndex;
  }

  return { value: values, nextIndex: cursor };
};

const parseResponse = (
  buffer: Buffer,
  start = 0,
): { value: RedisPrimitive; nextIndex: number } | null => {
  if (buffer.length <= start) {
    return null;
  }

  const type = buffer[start];
  const offset = start + 1;

  switch (type) {
    case 43: {
      const result = parseSimpleString(buffer, offset);
      return result ? { value: result.value, nextIndex: result.nextIndex } : null;
    }
    case 45: {
      const result = parseSimpleString(buffer, offset);
      if (!result) {
        return null;
      }
      throw new Error(result.value);
    }
    case 58: {
      const result = parseInteger(buffer, offset);
      return result ? { value: result.value, nextIndex: result.nextIndex } : null;
    }
    case 36: {
      const result = parseBulkString(buffer, offset);
      return result ? { value: result.value, nextIndex: result.nextIndex } : null;
    }
    case 42: {
      const result = parseArray(buffer, offset);
      return result ? { value: result.value, nextIndex: result.nextIndex } : null;
    }
    default:
      throw new Error(`Unsupported Redis response type: ${String.fromCharCode(type ?? 0)}`);
  }
};

export class RedisClient {
  private readonly host: string;

  private readonly port: number;

  private readonly password: string | null;

  private readonly db: number | null;

  private socket: net.Socket | null = null;

  private buffer: Buffer = Buffer.alloc(0);

  private readonly queue: Array<{ resolve: Resolver; reject: Rejecter }> = [];

  private connectPromise: Promise<void> | null = null;

  constructor(url: string) {
    const parsed = new URL(url);
    this.host = parsed.hostname || "127.0.0.1";
    this.port = parsed.port ? Number.parseInt(parsed.port, 10) : 6379;
    if (Number.isNaN(this.port)) {
      throw new Error(`Invalid Redis port for URL ${url}`);
    }
    this.password = parsed.password ? decodeURIComponent(parsed.password) : null;
    this.db = parsed.pathname && parsed.pathname.length > 1 ? Number.parseInt(parsed.pathname.slice(1), 10) : null;
    if (this.db !== null && Number.isNaN(this.db)) {
      throw new Error(`Invalid Redis database index for URL ${url}`);
    }
  }

  async sendCommand(command: string, ...args: (string | number | Buffer)[]): Promise<RedisPrimitive> {
    await this.connect();
    return this.dispatch([command, ...args]);
  }

  async quit() {
    if (!this.socket) {
      return;
    }
    try {
      await this.dispatch(["QUIT"]);
    } catch (error) {
      // Ignore errors when closing
    }
    this.socket.destroy();
    this.socket = null;
    this.connectPromise = null;
  }

  private async connect(): Promise<void> {
    if (this.connectPromise) {
      return this.connectPromise;
    }

    this.connectPromise = new Promise((resolve, reject) => {
      const socket = net.createConnection({ host: this.host, port: this.port });
      this.socket = socket;

      const cleanup = (error?: Error) => {
        socket.removeAllListeners();
        this.socket = null;
        this.connectPromise = null;
        if (error) {
          reject(error);
        }
      };

      socket.on("error", (error) => {
        while (this.queue.length) {
          const entry = this.queue.shift();
          entry?.reject(error);
        }
        cleanup(error instanceof Error ? error : new Error(String(error)));
      });

      socket.on("close", () => {
        cleanup();
      });

      socket.on("data", (chunk: Buffer) => {
        this.buffer = Buffer.concat([this.buffer, chunk]);
        this.processBuffer();
      });

      socket.once("connect", async () => {
        try {
          if (this.password) {
            await this.dispatch(["AUTH", this.password]);
          }
          if (this.db !== null) {
            await this.dispatch(["SELECT", this.db]);
          }
          resolve();
        } catch (error) {
          cleanup(error instanceof Error ? error : new Error(String(error)));
        }
      });
    });

    return this.connectPromise;
  }

  private dispatch(parts: (string | number | Buffer)[]): Promise<RedisPrimitive> {
    if (!this.socket) {
      return Promise.reject(new Error("Redis socket is not connected"));
    }

    return new Promise<RedisPrimitive>((resolve, reject) => {
      this.queue.push({ resolve, reject });
      const payload = buildCommand(parts);
      this.socket?.write(payload);
    });
  }

  private processBuffer() {
    if (!this.queue.length) {
      return;
    }

    while (this.queue.length) {
      try {
        const parsed = parseResponse(this.buffer);
        if (!parsed) {
          return;
        }
        const entry = this.queue.shift();
        if (entry) {
          entry.resolve(parsed.value);
        }
        this.buffer = this.buffer.slice(parsed.nextIndex);
      } catch (error) {
        const entry = this.queue.shift();
        if (entry) {
          entry.reject(error instanceof Error ? error : new Error(String(error)));
        }
        this.buffer = Buffer.alloc(0);
      }
    }
  }
}

export const createRedisClient = (url: string | null | undefined): RedisClient | null => {
  if (!url) {
    return null;
  }
  return new RedisClient(url);
};

export type { RedisPrimitive };
