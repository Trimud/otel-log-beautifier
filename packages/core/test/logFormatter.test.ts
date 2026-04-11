import { describe, test, expect } from 'vitest';
import { LogFormatter } from '../src/formatter/logFormatter.js';
import { LEVEL_COLORS, RESET, DIM } from '../src/formatter/ansiColors.js';
import type { CommonLogRecord } from '../src/types.js';

function makeRecord(overrides: Partial<CommonLogRecord> = {}): CommonLogRecord {
  return {
    timestamp: '2026-04-11T18:26:07.864Z',
    level: 'INFO',
    message: 'Request received',
    raw: {},
    source: 'otel',
    ...overrides,
  };
}

describe('LogFormatter', () => {
  test('formats a basic log line with timestamp, level, and message', () => {
    const output = LogFormatter.format(makeRecord());

    expect(output).toContain('18:26:07.864');
    expect(output).toContain('INFO');
    expect(output).toContain('Request received');
  });

  test('colors INFO level cyan', () => {
    const output = LogFormatter.format(makeRecord({ level: 'INFO' }));
    expect(output).toContain(LEVEL_COLORS.INFO);
    expect(output).toContain(RESET);
  });

  test('colors ERROR level red', () => {
    const output = LogFormatter.format(makeRecord({ level: 'ERROR' }));
    expect(output).toContain(LEVEL_COLORS.ERROR);
  });

  test('colors WARN level yellow', () => {
    const output = LogFormatter.format(makeRecord({ level: 'WARN' }));
    expect(output).toContain(LEVEL_COLORS.WARN);
  });

  test('colors DEBUG level gray', () => {
    const output = LogFormatter.format(makeRecord({ level: 'DEBUG' }));
    expect(output).toContain(LEVEL_COLORS.DEBUG);
  });

  test('includes indented attributes below the main line', () => {
    const output = LogFormatter.format(makeRecord({
      attributes: { userId: 'abc123', duration_ms: 42 },
    }));

    expect(output).toContain('userId');
    expect(output).toContain('abc123');
    expect(output).toContain('duration_ms');
    expect(output).toContain('42');
  });

  test('truncates long attribute values at maxValueLength', () => {
    const longValue = 'x'.repeat(200);
    const output = LogFormatter.format(makeRecord({
      attributes: { data: longValue },
    }));

    expect(output).not.toContain(longValue);
    expect(output).toContain('x'.repeat(120));
  });

  test('handles missing optional fields gracefully', () => {
    const output = LogFormatter.format(makeRecord({
      traceId: undefined,
      spanId: undefined,
      serviceName: undefined,
      attributes: undefined,
    }));

    expect(output).toContain('INFO');
    expect(output).toContain('Request received');
  });

  test('returns raw JSON passthrough with [format error] on TypeError', () => {
    const badRecord = { raw: { broken: true } } as unknown as CommonLogRecord;
    const output = LogFormatter.format(badRecord);

    expect(output).toContain('[format error]');
    expect(output).toContain('broken');
  });

  test('includes serviceName when present', () => {
    const output = LogFormatter.format(makeRecord({
      serviceName: 'auth-api',
    }));

    expect(output).toContain('auth-api');
  });

  test('includes traceId when present', () => {
    const output = LogFormatter.format(makeRecord({
      traceId: 'abc123def456',
    }));

    expect(output).toContain('abc123def456');
  });
});
