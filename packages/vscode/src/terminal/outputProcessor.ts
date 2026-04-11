import { LineBuffer, JsonDetector, LogNormalizer, LogFormatter } from '@otel-log-beautifier/core';
import { AltScreenDetector } from './altScreenDetector.js';

export class OutputProcessor {
  private readonly lineBuffer: LineBuffer;
  private readonly altScreen = new AltScreenDetector();
  private beautifyEnabled = true;

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

  private processLine(line: string): void {
    const json = JsonDetector.detect(line);
    if (!json) {
      this.onOutput(line + '\r\n');
      return;
    }

    const record = LogNormalizer.normalize(json);
    const formatted = LogFormatter.format(record);
    this.onOutput(formatted + '\r\n');
  }
}
