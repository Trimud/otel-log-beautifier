const ALT_SCREEN_ENTER = /\x1b\[\?(1049|47|1047)h/;
const ALT_SCREEN_LEAVE = /\x1b\[\?(1049|47|1047)l/;

export class AltScreenDetector {
  private altScreen = false;

  isAltScreen(): boolean {
    return this.altScreen;
  }

  processChunk(chunk: string): void {
    if (ALT_SCREEN_ENTER.test(chunk)) {
      this.altScreen = true;
    }
    if (ALT_SCREEN_LEAVE.test(chunk)) {
      this.altScreen = false;
    }
  }
}
