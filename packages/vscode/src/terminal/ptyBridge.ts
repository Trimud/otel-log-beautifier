import { spawn } from 'child_process';
import { SpawnFallback } from './spawnFallback.js';

export interface PtyLike {
  onData(callback: (data: string) => void): void;
  onExit(callback: (exitInfo: { exitCode: number }) => void): void;
  write(data: string): void;
  resize(cols: number, rows: number): void;
  kill(): void;
}

export interface PtyBridgeOptions {
  readonly shell?: string;
  readonly shellArgs?: readonly string[];
  readonly cols?: number;
  readonly rows?: number;
  readonly cwd?: string;
  readonly env?: Record<string, string>;
}

function getDefaultShell(): string {
  return process.env.SHELL ?? (process.platform === 'win32' ? 'powershell.exe' : '/bin/zsh');
}

export class PtyBridge {
  static create(options: PtyBridgeOptions): { pty: PtyLike; usedFallback: boolean } {
    const shell = options.shell ?? getDefaultShell();
    const args = options.shellArgs ? [...options.shellArgs] : [];

    try {
      const nodePty = require('node-pty');
      const ptyProcess = nodePty.spawn(shell, args, {
        name: 'xterm-256color',
        cols: options.cols ?? 80,
        rows: options.rows ?? 24,
        cwd: options.cwd ?? process.env.HOME,
        env: options.env ?? (process.env as Record<string, string>),
      });

      return {
        pty: {
          onData(callback: (data: string) => void) {
            ptyProcess.onData(callback);
          },
          onExit(callback: (exitInfo: { exitCode: number }) => void) {
            ptyProcess.onExit((e: { exitCode: number }) => callback(e));
          },
          write(data: string) {
            ptyProcess.write(data);
          },
          resize(cols: number, rows: number) {
            ptyProcess.resize(cols, rows);
          },
          kill() {
            ptyProcess.kill();
          },
        },
        usedFallback: false,
      };
    } catch {
      const child = spawn(shell, args, {
        cwd: options.cwd ?? process.env.HOME,
        env: options.env ?? (process.env as Record<string, string>),
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      return {
        pty: new SpawnFallback(child),
        usedFallback: true,
      };
    }
  }
}
