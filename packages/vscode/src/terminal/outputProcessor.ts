import { LineBuffer, JsonDetector, LogNormalizer, LogFormatter } from '@otel-log-beautifier/core';
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
  private readonly lineBuffer: LineBuffer;
  private readonly altScreen = new AltScreenDetector();
  private beautifyEnabled = true;
  private levelFilter: string | null = null;
  private suppressedCount = 0;

  constructor(
    private readonly onOutput: (data: string) => void,
  ) {
    this.lineBuffer = new LineBuffer((line) => this.processLine(line));
  }

  processData(data: string): void {
    this.altScreen.processChunk(data);

    if (this.altScreen.isAltScreen() || !this.beautifyEnabled) {
      this.onOutput(data);
      return;
    }

    this.lineBuffer.processChunk(data);
  }

  setBeautifyEnabled(enabled: boolean): void {
    if (this.beautifyEnabled && !enabled) {
      this.lineBuffer.flush();
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
}
