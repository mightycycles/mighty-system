export * from '../domain';

export interface IDatabase {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  query<T>(sql: string, params?: unknown[]): Promise<T>;
  transaction<T>(fn: (trx: ITransaction) => Promise<T>): Promise<T>;
}

export interface ITransaction {
  query<T>(sql: string, params?: unknown[]): Promise<T>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

export interface IEventBus {
  publish(event: IDomainEvent): Promise<void>;
  subscribe(eventType: string, handler: (event: IDomainEvent) => Promise<void>): void;
  unsubscribe(eventType: string): void;
}

export interface IDomainEvent {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  occurredAt: Date;
  tenantId?: string;
}

export interface ICache {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
  deletePattern(pattern: string): Promise<void>;
}

export interface ILogger {
  info(message: string, metadata?: Record<string, unknown>): void;
  error(message: string, error?: Error, metadata?: Record<string, unknown>): void;
  warn(message: string, metadata?: Record<string, unknown>): void;
  debug(message: string, metadata?: Record<string, unknown>): void;
}

export interface IMessagingService {
  sendEmail(to: string, subject: string, body: string, options?: {
    template?: string;
    data?: Record<string, unknown>;
  }): Promise<void>;
  sendSMS(to: string, body: string): Promise<void>;
}

export interface IStorageService {
  uploadFile(
    tenantId: string,
    file: Buffer,
    filename: string,
    contentType: string
  ): Promise<string>;
  deleteFile(url: string): Promise<void>;
  getFileUrl(tenantId: string, filename: string): Promise<string>;
}
