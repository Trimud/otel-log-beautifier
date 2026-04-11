import type { ChildProcess } from 'child_process';
import type { PtyLike } from './ptyBridge.js';

export class SpawnFallback implements PtyLike {
  constructor(private readonly child: ChildProcess) {}

  onData(callback: (data: string) => void): void {
    this.child.stdout?.on('data', (data: Buffer) => callback(data.toString()));
    this.child.stderr?.on('data', (data: Buffer) => callback(data.toString()));
  }

  onExit(callback: (exitInfo: { exitCode: number }) => void): void {
    this.child.on('exit', (code: number | null) => {
      callback({ exitCode: code ?? 1 });
    });
  }

  write(data: string): void {
    this.child.stdin?.write(data);
  }

  resize(_cols: number, _rows: number): void {
    // child_process.spawn does not support resize
  }

  kill(): void {
    this.child.kill();
  }
}
