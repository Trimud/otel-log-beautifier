const MAX_BUFFER_SIZE = 64 * 1024;

function containsNul(str: string): boolean {
  return str.indexOf('\0') !== -1;
}

export class LineBuffer {
  private readonly onBinary: ((data: string) => void) | undefined;

  constructor(
    private readonly onLine: (line: string) => void,
    onBinary?: (data: string) => void,
  ) {
    this.onBinary = onBinary;
  }

  private buffer = '';

  processChunk(chunk: string): void {
    if (this.onBinary && containsNul(chunk)) {
      if (this.buffer.length > 0) {
        this.onLine(this.buffer);
        this.buffer = '';
      }
      this.onBinary(chunk);
      return;
    }

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
