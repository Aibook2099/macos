/// <reference types="@cloudflare/workers-types" />

declare global {
  interface WebSocket {
    accept(): void;
    send(data: string | ArrayBuffer): void;
    close(code?: number, reason?: string): void;
    addEventListener(type: string, listener: (event: any) => void): void;
  }

  interface WebSocketPair {
    0: WebSocket;
    1: WebSocket;
  }

  interface DurableObjectState {
    storage: DurableObjectStorage;
    blockConcurrencyWhile<T>(callback: () => Promise<T>): Promise<T>;
  }

  interface DurableObjectStorage {
    get<T = unknown>(key: string): Promise<T | undefined>;
    put<T = unknown>(key: string, value: T): Promise<void>;
    delete(key: string): Promise<boolean>;
    list<T = unknown>(): Promise<Map<string, T>>;
  }

  interface DurableObjectNamespace {
    idFromName(name: string): DurableObjectId;
    get(id: DurableObjectId): DurableObjectStub;
  }

  interface DurableObjectId {
    toString(): string;
  }

  interface DurableObjectStub {
    fetch(request: Request): Promise<Response>;
  }

  interface KVNamespace {
    get(key: string): Promise<string | null>;
    put(key: string, value: string): Promise<void>;
    delete(key: string): Promise<void>;
    list(): Promise<KVNamespaceListResult>;
  }

  interface KVNamespaceListResult {
    keys: KVNamespaceListKey[];
    list_complete: boolean;
    cursor?: string;
  }

  interface KVNamespaceListKey {
    name: string;
    expiration?: number;
    metadata?: unknown;
  }
} 