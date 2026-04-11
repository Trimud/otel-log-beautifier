import * as vscode from 'vscode';
import { PtyBridge } from './ptyBridge.js';
import type { PtyLike } from './ptyBridge.js';
import { OutputProcessor } from './outputProcessor.js';
import { OutputBatcher } from './outputBatcher.js';

export class BeautifiedTerminal implements vscode.Pseudoterminal {
  private readonly writeEmitter = new vscode.EventEmitter<string>();
  private readonly closeEmitter = new vscode.EventEmitter<number | void>();
  readonly onDidWrite = this.writeEmitter.event;
  readonly onDidClose = this.closeEmitter.event;

  private pty: PtyLike | null = null;
  private processor: OutputProcessor | null = null;
  private batcher: OutputBatcher | null = null;

  constructor(
    private readonly options: {
      readonly shell?: string;
      readonly shellArgs?: readonly string[];
      readonly cwd?: string;
    } = {},
  ) {}

  open(initialDimensions: vscode.TerminalDimensions | undefined): void {
    this.batcher = new OutputBatcher((data) => this.writeEmitter.fire(data));
    this.processor = new OutputProcessor((data) => this.batcher!.write(data));

    try {
      const { pty, usedFallback } = PtyBridge.create({
        shell: this.options.shell,
        shellArgs: this.options.shellArgs,
        cols: initialDimensions?.columns ?? 80,
        rows: initialDimensions?.rows ?? 24,
        cwd: this.options.cwd,
      });

      this.pty = pty;

      if (usedFallback) {
        console.warn('[OTel Log Beautifier] node-pty unavailable, using spawn fallback.');
      }

      this.pty.onData((data) => {
        this.processor!.processData(data);
      });

      this.pty.onExit(({ exitCode }) => {
        if (exitCode !== 0) {
          this.writeEmitter.fire(`\r\n[Process exited with code ${exitCode}]\r\n`);
        }
        this.closeEmitter.fire(exitCode);
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.writeEmitter.fire(`[Failed to start shell: ${message}]\r\n`);
      this.closeEmitter.fire(1);
    }
  }

  close(): void {
    this.batcher?.dispose();
    this.pty?.kill();
  }

  handleInput(data: string): void {
    this.pty?.write(data);
  }

  setDimensions(dimensions: vscode.TerminalDimensions): void {
    this.pty?.resize(dimensions.columns, dimensions.rows);
  }

  toggleBeautify(): void {
    if (this.processor) {
      this.processor.setBeautifyEnabled(!this.processor.isBeautifyEnabled());
    }
  }

  setLevelFilter(level: string | null): void {
    this.processor?.setLevelFilter(level);
  }

  getSuppressedCount(): number {
    return this.processor?.getSuppressedCount() ?? 0;
  }

  isBeautifyEnabled(): boolean {
    return this.processor?.isBeautifyEnabled() ?? true;
  }
}
