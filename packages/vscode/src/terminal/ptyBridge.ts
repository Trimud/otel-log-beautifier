import { spawn } from 'child_process';
import path from 'path';
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

function tryLoadNodePty(): any {
  try {
    return require('node-pty');
  } catch {
    // Try workspace root (F5 dev mode with npm workspace hoisting)
    const candidates = [
      path.resolve(__dirname, '..', '..', '..', 'node_modules', 'node-pty'),
      path.resolve(__dirname, '..', 'node_modules', 'node-pty'),
    ];
    for (const candidate of candidates) {
      try {
        return require(candidate);
      } catch { /* continue */ }
    }
  }
  return null;
}

function cleanEnvironment(env: NodeJS.ProcessEnv | Record<string, string>): Record<string, string> {
  const clean: Record<string, string> = {};
  for (const [key, value] of Object.entries(env)) {
    if (value != null) {
      clean[key] = value;
    }
  }
  return clean;
}

export class PtyBridge {
  static create(options: PtyBridgeOptions): { pty: PtyLike; usedFallback: boolean } {
    const shell = options.shell ?? getDefaultShell();
    const args = options.shellArgs ? [...options.shellArgs] : [];
    const cwd = options.cwd ?? process.env.HOME ?? '/';
    const env = cleanEnvironment(options.env ?? process.env);

    const nodePty = tryLoadNodePty();

    if (nodePty) {
      try {
        const ptyProcess = nodePty.spawn(shell, args, {
          name: 'xterm-256color',
          cols: options.cols ?? 80,
          rows: options.rows ?? 24,
          cwd,
          env,
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
      } catch { /* fall through to spawn */ }
    }

    const shellArgs = args.length > 0 ? args : ['-i'];
    const child = spawn(shell, shellArgs, {
      cwd,
      env: { ...env, TERM: 'dumb' },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    return {
      pty: new SpawnFallback(child),
      usedFallback: true,
    };
  }
}
