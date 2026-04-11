import type { CommonLogRecord } from '../types.js';

const PINO_LEVELS: Readonly<Record<number, string>> = {
  10: 'TRACE',
  20: 'DEBUG',
  30: 'INFO',
  40: 'WARN',
  50: 'ERROR',
  60: 'FATAL',
};

const OTEL_SEVERITY_NUMBERS: Readonly<Record<number, string>> = {
  1: 'TRACE', 2: 'TRACE', 3: 'TRACE', 4: 'TRACE',
  5: 'DEBUG', 6: 'DEBUG', 7: 'DEBUG', 8: 'DEBUG',
  9: 'INFO', 10: 'INFO', 11: 'INFO', 12: 'INFO',
  13: 'WARN', 14: 'WARN', 15: 'WARN', 16: 'WARN',
  17: 'ERROR', 18: 'ERROR', 19: 'ERROR', 20: 'ERROR',
  21: 'FATAL', 22: 'FATAL', 23: 'FATAL', 24: 'FATAL',
};

function extractTimestamp(obj: Record<string, unknown>, fieldNames: readonly string[]): string {
  for (const name of fieldNames) {
    const val = obj[name];
    if (val !== undefined && val !== null) {
      if (typeof val === 'number') {
        return new Date(val).toISOString();
      }
      return String(val);
    }
  }
  return new Date().toISOString();
}

function normalizeLevel(value: string | number): string {
  if (typeof value === 'number') {
    return PINO_LEVELS[value] ?? OTEL_SEVERITY_NUMBERS[value] ?? 'INFO';
  }
  const upper = String(value).toUpperCase();
  const VALID = ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'];
  if (VALID.includes(upper)) return upper;
  if (upper === 'WARNING') return 'WARN';
  return 'INFO';
}

function extractMessage(obj: Record<string, unknown>, fieldNames: readonly string[]): string {
  for (const name of fieldNames) {
    const val = obj[name];
    if (typeof val === 'string') return val;
  }
  return '';
}

function isOtel(json: Record<string, unknown>): boolean {
  return 'severity_text' in json || 'severity_number' in json;
}

function isBunyan(json: Record<string, unknown>): boolean {
  return typeof json.level === 'number' && typeof json.hostname === 'string' && typeof json.name === 'string';
}

function isPino(json: Record<string, unknown>): boolean {
  return typeof json.level === 'number' && typeof json.pid === 'number' && !isBunyan(json);
}

function isWinston(json: Record<string, unknown>): boolean {
  return typeof json.level === 'string' && 'message' in json;
}

function collectAttributes(
  json: Record<string, unknown>,
  knownKeys: readonly string[],
): Record<string, unknown> | undefined {
  const attrs: Record<string, unknown> = {};
  let hasAny = false;
  for (const [key, val] of Object.entries(json)) {
    if (!knownKeys.includes(key)) {
      attrs[key] = val;
      hasAny = true;
    }
  }
  return hasAny ? attrs : undefined;
}

export class LogNormalizer {
  static normalize(json: Record<string, unknown>): CommonLogRecord {
    if (isOtel(json)) return LogNormalizer.normalizeOtel(json);
    if (isBunyan(json)) return LogNormalizer.normalizeBunyan(json);
    if (isPino(json)) return LogNormalizer.normalizePino(json);
    if (isWinston(json)) return LogNormalizer.normalizeWinston(json);
    return LogNormalizer.normalizeGeneric(json);
  }

  private static normalizeOtel(json: Record<string, unknown>): CommonLogRecord {
    const level = json.severity_text
      ? normalizeLevel(json.severity_text as string)
      : normalizeLevel(json.severity_number as number);
    const resource = json.resource as Record<string, unknown> | undefined;
    return {
      timestamp: extractTimestamp(json, ['timestamp']),
      level,
      message: extractMessage(json, ['body', 'message']),
      traceId: json.traceId as string | undefined,
      spanId: json.spanId as string | undefined,
      serviceName: resource?.['service.name'] as string | undefined,
      resource,
      attributes: collectAttributes(json, ['timestamp', 'severity_text', 'severity_number', 'body', 'message', 'traceId', 'spanId', 'resource']),
      raw: json,
      source: 'otel',
    };
  }

  private static normalizePino(json: Record<string, unknown>): CommonLogRecord {
    return {
      timestamp: extractTimestamp(json, ['time']),
      level: normalizeLevel(json.level as number),
      message: extractMessage(json, ['msg']),
      attributes: collectAttributes(json, ['time', 'level', 'msg', 'pid', 'hostname']),
      raw: json,
      source: 'pino',
    };
  }

  private static normalizeBunyan(json: Record<string, unknown>): CommonLogRecord {
    return {
      timestamp: extractTimestamp(json, ['time']),
      level: normalizeLevel(json.level as number),
      message: extractMessage(json, ['msg']),
      resource: { hostname: json.hostname, name: json.name, pid: json.pid },
      attributes: collectAttributes(json, ['time', 'level', 'msg', 'hostname', 'name', 'pid', 'v']),
      raw: json,
      source: 'bunyan',
    };
  }

  private static normalizeWinston(json: Record<string, unknown>): CommonLogRecord {
    return {
      timestamp: extractTimestamp(json, ['timestamp']),
      level: normalizeLevel(json.level as string),
      message: extractMessage(json, ['message']),
      attributes: collectAttributes(json, ['timestamp', 'level', 'message']),
      raw: json,
      source: 'winston',
    };
  }

  private static normalizeGeneric(json: Record<string, unknown>): CommonLogRecord {
    return {
      timestamp: extractTimestamp(json, ['timestamp', 'time', 'ts', '@timestamp']),
      level: normalizeLevel((json.level ?? json.lvl ?? json.severity ?? 'INFO') as string | number),
      message: extractMessage(json, ['message', 'msg', 'text']),
      attributes: collectAttributes(json, ['timestamp', 'time', 'ts', '@timestamp', 'level', 'lvl', 'severity', 'message', 'msg', 'text']),
      raw: json,
      source: 'generic',
    };
  }
}
