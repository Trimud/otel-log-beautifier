import { describe, test, expect, vi } from 'vitest';
import { SpawnFallback } from '../src/terminal/spawnFallback.js';

describe('SpawnFallback (child_process.spawn PTY fallback)', () => {
  test('writes data to stdin of the child process', () => {
    const stdinWrite = vi.fn();
    const fallback = new SpawnFallback({
      stdin: { write: stdinWrite } as any,
      stdout: { on: vi.fn() } as any,
      stderr: { on: vi.fn() } as any,
      on: vi.fn(),
      kill: vi.fn(),
      pid: 123,
    } as any);

    fallback.write('hello');

    expect(stdinWrite).toHaveBeenCalledWith('hello');
  });

  test('emits data from stdout via onData callback', () => {
    const stdoutListeners: Record<string, Function> = {};
    const fallback = new SpawnFallback({
      stdin: { write: vi.fn() } as any,
      stdout: { on: (event: string, cb: Function) => { stdoutListeners[event] = cb; } } as any,
      stderr: { on: vi.fn() } as any,
      on: vi.fn(),
      kill: vi.fn(),
      pid: 123,
    } as any);

    const received: string[] = [];
    fallback.onData((data) => received.push(data));

    stdoutListeners['data'](Buffer.from('output'));

    expect(received).toEqual(['output']);
  });

  test('emits exit info via onExit callback', () => {
    const processListeners: Record<string, Function> = {};
    const fallback = new SpawnFallback({
      stdin: { write: vi.fn() } as any,
      stdout: { on: vi.fn() } as any,
      stderr: { on: vi.fn() } as any,
      on: (event: string, cb: Function) => { processListeners[event] = cb; },
      kill: vi.fn(),
      pid: 123,
    } as any);

    const exits: Array<{ exitCode: number }> = [];
    fallback.onExit((info) => exits.push(info));

    processListeners['exit'](42);

    expect(exits).toEqual([{ exitCode: 42 }]);
  });

  test('kill() terminates the child process', () => {
    const killFn = vi.fn();
    const fallback = new SpawnFallback({
      stdin: { write: vi.fn() } as any,
      stdout: { on: vi.fn() } as any,
      stderr: { on: vi.fn() } as any,
      on: vi.fn(),
      kill: killFn,
      pid: 123,
    } as any);

    fallback.kill();

    expect(killFn).toHaveBeenCalled();
  });

  test('resize() is a no-op (spawn does not support resize)', () => {
    const fallback = new SpawnFallback({
      stdin: { write: vi.fn() } as any,
      stdout: { on: vi.fn() } as any,
      stderr: { on: vi.fn() } as any,
      on: vi.fn(),
      kill: vi.fn(),
      pid: 123,
    } as any);

    expect(() => fallback.resize(80, 24)).not.toThrow();
  });
});
