import { describe, test, expect } from 'vitest';
import { JsonDetector } from '../src/parser/jsonDetector.js';

describe('JsonDetector', () => {
  test('detects a valid JSON object and returns parsed result', () => {
    const result = JsonDetector.detect('{"level":"info","msg":"hello"}');

    expect(result).not.toBeNull();
    expect(result!.level).toBe('info');
    expect(result!.msg).toBe('hello');
  });

  test('returns null for non-JSON line (does not start with {)', () => {
    const result = JsonDetector.detect('just a regular log line');

    expect(result).toBeNull();
  });

  test('returns null for invalid JSON (starts with { but not valid)', () => {
    const result = JsonDetector.detect('{not valid json}');

    expect(result).toBeNull();
  });

  test('detects JSON wrapped in ANSI escape codes', () => {
    const ansiWrapped = '\x1b[32m{"level":"info","msg":"hello"}\x1b[0m';
    const result = JsonDetector.detect(ansiWrapped);

    expect(result).not.toBeNull();
    expect(result!.level).toBe('info');
  });

  test('returns null for JSON array (not object)', () => {
    const result = JsonDetector.detect('[1, 2, 3]');

    expect(result).toBeNull();
  });

  test('returns null for empty object {}', () => {
    const result = JsonDetector.detect('{}');

    expect(result).toBeNull();
  });

  test('catches deeply nested JSON without crashing', () => {
    const deep = '{"a":'.repeat(200) + '1' + '}'.repeat(200);
    const result = JsonDetector.detect(deep);

    // Should either parse or return null, but not throw
    expect(() => JsonDetector.detect(deep)).not.toThrow();
  });
});
