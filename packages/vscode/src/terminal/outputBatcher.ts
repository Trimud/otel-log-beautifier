export class OutputBatcher {
  private buffer = '';
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly onFlush: (data: string) => void,
    private readonly intervalMs: number = 16,
  ) {}

  write(data: string): void {
    this.buffer += data;
    if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.intervalMs);
    }
  }

  dispose(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.flush();
  }

  private flush(): void {
    this.timer = null;
    if (this.buffer.length > 0) {
      const data = this.buffer;
      this.buffer = '';
      this.onFlush(data);
    }
  }
}
