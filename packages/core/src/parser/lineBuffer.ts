const MAX_BUFFER_SIZE = 64 * 1024;

export class LineBuffer {
  constructor(private readonly onLine: (line: string) => void) {}

  private buffer = '';

  processChunk(chunk: string): void {
    this.buffer += chunk;
    let newlineIndex: number;
    while ((newlineIndex = this.buffer.indexOf('\n')) !== -1) {
      let line = this.buffer.slice(0, newlineIndex);
      if (line.endsWith('\r')) {
        line = line.slice(0, -1);
      }
      this.buffer = this.buffer.slice(newlineIndex + 1);
      this.onLine(line);
    }
    if (this.buffer.length > MAX_BUFFER_SIZE) {
      this.onLine(this.buffer);
      this.buffer = '';
    }
  }

  flush(): void {
    if (this.buffer.length > 0) {
      this.onLine(this.buffer);
      this.buffer = '';
    }
  }
}
