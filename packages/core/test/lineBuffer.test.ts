import { describe, test, expect } from 'vitest';
import { LineBuffer } from '../src/parser/lineBuffer.js';

describe('LineBuffer', () => {
  test('emits a complete line ending with \\n', () => {
    const lines: string[] = [];
    const buffer = new LineBuffer((line) => lines.push(line));

    buffer.processChunk('hello world\n');

    expect(lines).toEqual(['hello world']);
  });

  test('emits a complete line ending with \\r\\n', () => {
    const lines: string[] = [];
    const buffer = new LineBuffer((line) => lines.push(line));

    buffer.processChunk('hello world\r\n');

    expect(lines).toEqual(['hello world']);
  });

  test('accumulates partial chunks until newline arrives', () => {
    const lines: string[] = [];
    const buffer = new LineBuffer((line) => lines.push(line));

    buffer.processChunk('hel');
    expect(lines).toEqual([]);

    buffer.processChunk('lo world\n');
    expect(lines).toEqual(['hello world']);
  });

  test('emits multiple lines from a single chunk', () => {
    const lines: string[] = [];
    const buffer = new LineBuffer((line) => lines.push(line));

    buffer.processChunk('line one\nline two\nline three\n');

    expect(lines).toEqual(['line one', 'line two', 'line three']);
  });

  test('does not emit anything for empty input', () => {
    const lines: string[] = [];
    const buffer = new LineBuffer((line) => lines.push(line));

    buffer.processChunk('');

    expect(lines).toEqual([]);
  });

  test('flushes accumulated content at 64KB as passthrough', () => {
    const lines: string[] = [];
    const buffer = new LineBuffer((line) => lines.push(line));

    const bigChunk = 'x'.repeat(64 * 1024 + 1);
    buffer.processChunk(bigChunk);

    expect(lines.length).toBe(1);
    expect(lines[0]).toBe(bigChunk);
  });

  test('flush() emits accumulated partial content', () => {
    const lines: string[] = [];
    const buffer = new LineBuffer((line) => lines.push(line));

    buffer.processChunk('partial content');
    expect(lines).toEqual([]);

    buffer.flush();
    expect(lines).toEqual(['partial content']);
  });
});
