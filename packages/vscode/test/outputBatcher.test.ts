import { describe, test, expect, vi } from 'vitest';
import { OutputBatcher } from '../src/terminal/outputBatcher.js';

describe('OutputBatcher', () => {
  test('does not flush immediately on write', () => {
    const flushed: string[] = [];
    const batcher = new OutputBatcher((data) => flushed.push(data));

    batcher.write('hello');

    expect(flushed).toEqual([]);
    batcher.dispose();
  });

  test('flushes accumulated data after the interval', async () => {
    vi.useFakeTimers();
    const flushed: string[] = [];
    const batcher = new OutputBatcher((data) => flushed.push(data), 16);

    batcher.write('line one\r\n');
    batcher.write('line two\r\n');

    expect(flushed).toEqual([]);

    vi.advanceTimersByTime(16);

    expect(flushed.length).toBe(1);
    expect(flushed[0]).toBe('line one\r\nline two\r\n');

    batcher.dispose();
    vi.useRealTimers();
  });

  test('does not schedule a timer when buffer is empty', () => {
    vi.useFakeTimers();
    const flushed: string[] = [];
    const batcher = new OutputBatcher((data) => flushed.push(data), 16);

    vi.advanceTimersByTime(100);

    expect(flushed).toEqual([]);
    batcher.dispose();
    vi.useRealTimers();
  });

  test('schedules a new timer for subsequent writes after flush', async () => {
    vi.useFakeTimers();
    const flushed: string[] = [];
    const batcher = new OutputBatcher((data) => flushed.push(data), 16);

    batcher.write('batch 1');
    vi.advanceTimersByTime(16);
    expect(flushed).toEqual(['batch 1']);

    batcher.write('batch 2');
    vi.advanceTimersByTime(16);
    expect(flushed).toEqual(['batch 1', 'batch 2']);

    batcher.dispose();
    vi.useRealTimers();
  });

  test('dispose flushes remaining data immediately', () => {
    const flushed: string[] = [];
    const batcher = new OutputBatcher((data) => flushed.push(data), 16);

    batcher.write('pending');
    batcher.dispose();

    expect(flushed).toEqual(['pending']);
  });
});
