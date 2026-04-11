import { describe, test, expect } from 'vitest';
import { AltScreenDetector } from '../src/terminal/altScreenDetector.js';

describe('AltScreenDetector', () => {
  test('starts in normal mode (not alt screen)', () => {
    const detector = new AltScreenDetector();
    expect(detector.isAltScreen()).toBe(false);
  });

  test('enters alt screen on ESC[?1049h', () => {
    const detector = new AltScreenDetector();
    detector.processChunk('\x1b[?1049h');
    expect(detector.isAltScreen()).toBe(true);
  });

  test('leaves alt screen on ESC[?1049l', () => {
    const detector = new AltScreenDetector();
    detector.processChunk('\x1b[?1049h');
    detector.processChunk('\x1b[?1049l');
    expect(detector.isAltScreen()).toBe(false);
  });

  test('enters alt screen on ESC[?47h (older variant)', () => {
    const detector = new AltScreenDetector();
    detector.processChunk('\x1b[?47h');
    expect(detector.isAltScreen()).toBe(true);
  });

  test('enters alt screen on ESC[?1047h (xterm variant)', () => {
    const detector = new AltScreenDetector();
    detector.processChunk('\x1b[?1047h');
    expect(detector.isAltScreen()).toBe(true);
  });

  test('leaves alt screen on ESC[?47l', () => {
    const detector = new AltScreenDetector();
    detector.processChunk('\x1b[?47h');
    detector.processChunk('\x1b[?47l');
    expect(detector.isAltScreen()).toBe(false);
  });

  test('leaves alt screen on ESC[?1047l', () => {
    const detector = new AltScreenDetector();
    detector.processChunk('\x1b[?1047h');
    detector.processChunk('\x1b[?1047l');
    expect(detector.isAltScreen()).toBe(false);
  });

  test('detects sequence embedded in larger output chunk', () => {
    const detector = new AltScreenDetector();
    detector.processChunk('some text before\x1b[?1049hsome text after');
    expect(detector.isAltScreen()).toBe(true);
  });

  test('stays in normal mode for unrelated escape sequences', () => {
    const detector = new AltScreenDetector();
    detector.processChunk('\x1b[32mcolored text\x1b[0m');
    expect(detector.isAltScreen()).toBe(false);
  });
});
