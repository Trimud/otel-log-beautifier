export interface CommonLogRecord {
  readonly timestamp: string;
  readonly level: string;
  readonly message: string;
  readonly traceId?: string;
  readonly spanId?: string;
  readonly serviceName?: string;
  readonly resource?: Readonly<Record<string, unknown>>;
  readonly attributes?: Readonly<Record<string, unknown>>;
  readonly raw: Readonly<Record<string, unknown>>;
  readonly source: 'otel' | 'pino' | 'winston' | 'bunyan' | 'generic';
}
