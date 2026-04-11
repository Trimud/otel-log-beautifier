import { describe, test, expect } from 'vitest';
import { FieldLayout } from '../src/formatter/fieldLayout.js';

describe('FieldLayout', () => {
  test('returns all fields in alphabetical order by default', () => {
    const result = FieldLayout.orderAndFilter({
      zField: 'z',
      aField: 'a',
      mField: 'm',
    });

    expect(result.map(([k]) => k)).toEqual(['aField', 'mField', 'zField']);
  });

  test('respects custom field order, placing ordered fields first', () => {
    const result = FieldLayout.orderAndFilter(
      { userId: 'abc', duration: 42, method: 'GET' },
      { fieldOrder: ['method', 'userId'] },
    );

    expect(result.map(([k]) => k)).toEqual(['method', 'userId', 'duration']);
  });

  test('filters out hidden fields', () => {
    const result = FieldLayout.orderAndFilter(
      { userId: 'abc', secret: 'hidden', method: 'GET' },
      { hiddenFields: ['secret'] },
    );

    expect(result.map(([k]) => k)).not.toContain('secret');
    expect(result.length).toBe(2);
  });

  test('truncates nested objects beyond maxDepth', () => {
    const result = FieldLayout.orderAndFilter(
      { nested: { a: { b: { c: 'deep' } } } },
      { maxDepth: 2 },
    );

    const [, value] = result[0];
    const str = JSON.stringify(value);
    expect(str).not.toContain('deep');
  });

  test('returns empty array for empty input', () => {
    const result = FieldLayout.orderAndFilter({});
    expect(result).toEqual([]);
  });

  test('returns empty array for undefined attributes', () => {
    const result = FieldLayout.orderAndFilter(
      undefined as unknown as Record<string, unknown>,
    );
    expect(result).toEqual([]);
  });
});
