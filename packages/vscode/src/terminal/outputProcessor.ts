import { JsonDetector, LogNormalizer, LogFormatter } from '@otel-log-beautifier/core';
import { AltScreenDetector } from './altScreenDetector.js';

const LEVEL_SEVERITY: Readonly<Record<string, number>> = {
  TRACE: 0,
  DEBUG: 1,
  INFO: 2,
  WARN: 3,
  ERROR: 4,
  FATAL: 5,
};

export class OutputProcessor {
  private readonly altScreen = new AltScreenDetector();
  private beautifyEnabled = true;
  private levelFilter: string | null = null;
  private suppressedCount = 0;
  private pendingPartial = '';

  constructor(
    private readonly onOutput: (data: string) => void,
  ) {}

  processData(data: string): void {
    this.altScreen.processChunk(data);

    if (this.altScreen.isAltScreen() || !this.beautifyEnabled) {
      this.flushPending();
      this.onOutput(data);
      return;
    }

    // Split on newlines. Process complete lines, passthrough partials immediately.
    const combined = this.pendingPartial + data;
    this.pendingPartial = '';

    const lastNewline = combined.lastIndexOf('\n');

    if (lastNewline === -1) {
      // No newline in this chunk. Pass through immediately (shell prompts, etc).
      this.onOutput(combined);
      return;
    }

    // Everything up to and including the last newline = complete lines to process.
    // Everything after = partial content to pass through immediately.
    const completeSection = combined.slice(0, lastNewline);
    const trailing = combined.slice(lastNewline + 1);

    const lines = completeSection.split('\n');
    for (const rawLine of lines) {
      const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine;
      this.processLine(line);
    }

    if (trailing.length > 0) {
      // Partial content after last newline (e.g., next shell prompt).
      // Pass through immediately so the user sees it.
      this.onOutput(trailing);
    }
  }

  setBeautifyEnabled(enabled: boolean): void {
    if (this.beautifyEnabled && !enabled) {
      this.flushPending();
    }
    this.beautifyEnabled = enabled;
  }

  isBeautifyEnabled(): boolean {
    return this.beautifyEnabled;
  }

  setLevelFilter(level: string | null): void {
    this.levelFilter = level;
    this.suppressedCount = 0;
  }

  getSuppressedCount(): number {
    return this.suppressedCount;
  }

  private meetsLevelThreshold(recordLevel: string): boolean {
    if (!this.levelFilter) return true;
    const threshold = LEVEL_SEVERITY[this.levelFilter] ?? 0;
    const actual = LEVEL_SEVERITY[recordLevel] ?? 0;
    return actual >= threshold;
  }

  private processLine(line: string): void {
    const json = JsonDetector.detect(line);
    if (!json) {
      this.onOutput(line + '\r\n');
      return;
    }

    const record = LogNormalizer.normalize(json);

    if (!this.meetsLevelThreshold(record.level)) {
      this.suppressedCount++;
      return;
    }

    const formatted = LogFormatter.format(record);
    this.onOutput(formatted + '\r\n');
  }

  private flushPending(): void {
    if (this.pendingPartial.length > 0) {
      this.onOutput(this.pendingPartial);
      this.pendingPartial = '';
    }
  }
}
