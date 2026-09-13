interface DurableObjectId {}

interface DurableObjectNamespace {
  idFromName(name: string): DurableObjectId;
  get(id: DurableObjectId): { fetch(request: Request): Promise<Response> };
}

interface DurableObjectStorage {
  get<T>(key: string): Promise<T | undefined>;
  put<T>(key: string, value: T): Promise<void>;
  transaction<T>(closure: (transaction: DurableObjectStorage) => Promise<T>): Promise<T>;
}

interface DurableObjectState {
  storage: DurableObjectStorage;
  getWebSockets(): WebSocket[];
  acceptWebSocket(socket: WebSocket): void;
}

declare class WebSocketPair {
  0: WebSocket;
  1: WebSocket;
}

interface WebSocket {
  serializeAttachment(value: unknown): void;
  deserializeAttachment(): unknown;
}

interface ResponseInit {
  webSocket?: WebSocket;
}
