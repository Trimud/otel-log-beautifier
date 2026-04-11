import { describe, test, expect } from 'vitest';
import { LogNormalizer } from '../src/parser/logNormalizer.js';

describe('LogNormalizer', () => {
  test('detects OTel format by severity_text field', () => {
    const result = LogNormalizer.normalize({
      timestamp: '2026-04-11T18:26:07.864Z',
      severity_text: 'INFO',
      body: 'Request received',
      resource: { 'service.name': 'auth-api' },
      traceId: 'abc123',
      spanId: 'def456',
    });

    expect(result.source).toBe('otel');
    expect(result.level).toBe('INFO');
    expect(result.message).toBe('Request received');
    expect(result.timestamp).toBe('2026-04-11T18:26:07.864Z');
    expect(result.traceId).toBe('abc123');
    expect(result.spanId).toBe('def456');
    expect(result.serviceName).toBe('auth-api');
  });

  test('detects OTel format by severity_number field', () => {
    const result = LogNormalizer.normalize({
      timestamp: '2026-04-11T18:26:07.864Z',
      severity_number: 9,
      message: 'Something happened',
    });

    expect(result.source).toBe('otel');
    expect(result.level).toBe('INFO');
  });

  test('detects Pino format by numeric level + pid', () => {
    const result = LogNormalizer.normalize({
      level: 30,
      time: 1744393567864,
      pid: 12345,
      msg: 'Server started',
    });

    expect(result.source).toBe('pino');
    expect(result.level).toBe('INFO');
    expect(result.message).toBe('Server started');
  });

  test('detects Bunyan format by hostname + name + numeric level', () => {
    const result = LogNormalizer.normalize({
      level: 30,
      time: '2026-04-11T18:26:07.864Z',
      hostname: 'server-01',
      name: 'myapp',
      msg: 'Connected',
    });

    expect(result.source).toBe('bunyan');
    expect(result.level).toBe('INFO');
    expect(result.message).toBe('Connected');
  });

  test('detects Winston format by string level + message field', () => {
    const result = LogNormalizer.normalize({
      level: 'info',
      message: 'Processing request',
      timestamp: '2026-04-11T18:26:07.864Z',
    });

    expect(result.source).toBe('winston');
    expect(result.level).toBe('INFO');
    expect(result.message).toBe('Processing request');
  });

  test('falls back to generic for unrecognized format', () => {
    const result = LogNormalizer.normalize({
      ts: '2026-04-11T18:26:07.864Z',
      lvl: 'warn',
      text: 'Something odd',
    });

    expect(result.source).toBe('generic');
    expect(result.level).toBe('WARN');
    expect(result.message).toBe('Something odd');
  });

  test('priority: bunyan wins over pino when both match', () => {
    const result = LogNormalizer.normalize({
      level: 30,
      pid: 12345,
      hostname: 'server-01',
      name: 'myapp',
      msg: 'Ambiguous',
      time: '2026-04-11T18:26:07.864Z',
    });

    expect(result.source).toBe('bunyan');
  });

  test('preserves raw JSON in the raw field', () => {
    const input = { level: 'info', message: 'test', timestamp: 'now' };
    const result = LogNormalizer.normalize(input);

    expect(result.raw).toEqual(input);
  });
});
