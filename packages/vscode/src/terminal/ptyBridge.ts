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
  readonly onLog?: (message: string) => void;
}

function getDefaultShell(): string {
  return process.env.SHELL ?? (process.platform === 'win32' ? 'powershell.exe' : '/bin/zsh');
}

function tryLoadNodePty(log: (msg: string) => void): any {
  // Attempt 1: direct require (works when node-pty is in node_modules of the extension)
  try {
    const pty = require('node-pty');
    log('[ptyBridge] node-pty loaded via direct require');
    return pty;
  } catch (e: any) {
    log(`[ptyBridge] direct require failed: ${e.message}`);
  }

  // Attempt 2: resolve from workspace root (F5 dev mode)
  // __dirname is packages/vscode/dist, workspace root is ../../..
  const candidates = [
    path.resolve(__dirname, '..', '..', '..', 'node_modules', 'node-pty'),
    path.resolve(__dirname, '..', 'node_modules', 'node-pty'),
    path.resolve(__dirname, '..', '..', 'node_modules', 'node-pty'),
  ];

  for (const candidate of candidates) {
    try {
      const pty = require(candidate);
      log(`[ptyBridge] node-pty loaded from: ${candidate}`);
      return pty;
    } catch (e: any) {
      log(`[ptyBridge] ${candidate}: ${e.message}`);
    }
  }

  return null;
}

export class PtyBridge {
  static create(options: PtyBridgeOptions): { pty: PtyLike; usedFallback: boolean } {
    const shell = options.shell ?? getDefaultShell();
    const args = options.shellArgs ? [...options.shellArgs] : [];
    const log = options.onLog ?? (() => {});

    log(`[ptyBridge] shell: ${shell}, args: [${args}], __dirname: ${__dirname}`);

    const nodePty = tryLoadNodePty(log);

    if (nodePty) {
      try {
        const ptyProcess = nodePty.spawn(shell, args, {
          name: 'xterm-256color',
          cols: options.cols ?? 80,
          rows: options.rows ?? 24,
          cwd: options.cwd ?? process.env.HOME,
          env: options.env ?? (process.env as Record<string, string>),
        });

        log(`[ptyBridge] node-pty spawned successfully, pid: ${ptyProcess.pid}`);

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
      } catch (e: any) {
        log(`[ptyBridge] node-pty spawn failed: ${e.message}`);
      }
    }

    // Fallback: spawn shell in interactive mode
    log(`[ptyBridge] falling back to child_process.spawn -i`);
    const shellArgs = args.length > 0 ? args : ['-i'];
    const child = spawn(shell, shellArgs, {
      cwd: options.cwd ?? process.env.HOME,
      env: {
        ...(options.env ?? process.env),
        TERM: 'dumb',
      } as Record<string, string>,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    log(`[ptyBridge] spawn fallback started, pid: ${child.pid}`);

    return {
      pty: new SpawnFallback(child),
      usedFallback: true,
    };
  }
}
