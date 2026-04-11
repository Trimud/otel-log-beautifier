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
      // Try loading node-pty from multiple locations:
      // 1. Bundled with the extension (production .vsix)
      // 2. Workspace node_modules (F5 development mode)
      let nodePty: any;
      try {
        nodePty = require('node-pty');
      } catch {
        // In development, try resolving from the workspace root
        const path = require('path');
        const workspaceRoot = path.resolve(__dirname, '..', '..', '..');
        nodePty = require(path.join(workspaceRoot, 'node_modules', 'node-pty'));
      }
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
      // Fallback: spawn shell in interactive mode so it shows a prompt
      const shellArgs = args.length > 0 ? args : ['-i'];
      const child = spawn(shell, shellArgs, {
        cwd: options.cwd ?? process.env.HOME,
        env: {
          ...(options.env ?? process.env),
          TERM: 'dumb', // signal that this is not a real TTY
        } as Record<string, string>,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      return {
        pty: new SpawnFallback(child),
        usedFallback: true,
      };
    }
  }
}
