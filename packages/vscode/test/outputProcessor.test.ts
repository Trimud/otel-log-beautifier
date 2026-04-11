import { describe, test, expect } from 'vitest';
import { OutputProcessor } from '../src/terminal/outputProcessor.js';

describe('OutputProcessor', () => {
  test('passes non-JSON lines through unchanged', () => {
    const output: string[] = [];
    const proc = new OutputProcessor((data) => output.push(data));

    proc.processData('just a regular line\n');

    expect(output.length).toBeGreaterThan(0);
    expect(output.join('')).toContain('just a regular line');
  });

  test('formats JSON log lines with color', () => {
    const output: string[] = [];
    const proc = new OutputProcessor((data) => output.push(data));

    proc.processData('{"severity_text":"INFO","body":"Request received","timestamp":"2026-04-11T18:26:07.864Z"}\n');

    const combined = output.join('');
    expect(combined).toContain('INFO');
    expect(combined).toContain('Request received');
    expect(combined).toContain('\x1b['); // contains ANSI color codes
  });

  test('bypasses parse pipeline during alt screen mode', () => {
    const output: string[] = [];
    const proc = new OutputProcessor((data) => output.push(data));

    proc.processData('\x1b[?1049h');
    proc.processData('{"severity_text":"INFO","body":"Should passthrough raw"}\n');

    const combined = output.join('');
    // In alt screen, JSON should NOT be formatted, just passed through raw
    expect(combined).toContain('"severity_text"');
  });

  test('resumes formatting after leaving alt screen', () => {
    const output: string[] = [];
    const proc = new OutputProcessor((data) => output.push(data));

    proc.processData('\x1b[?1049h');
    proc.processData('\x1b[?1049l');
    proc.processData('{"severity_text":"INFO","body":"Now formatted","timestamp":"2026-04-11T18:26:07.864Z"}\n');

    const combined = output.join('');
    expect(combined).toContain('\x1b['); // ANSI codes present = formatted
    expect(combined).toContain('Now formatted');
  });

  test('passes everything through raw when beautify is disabled', () => {
    const output: string[] = [];
    const proc = new OutputProcessor((data) => output.push(data));

    proc.setBeautifyEnabled(false);
    proc.processData('{"severity_text":"INFO","body":"Raw mode","timestamp":"2026-04-11T18:26:07.864Z"}\n');

    const combined = output.join('');
    expect(combined).toContain('"severity_text"');
  });

  test('toggle flushes line buffer before switching', () => {
    const output: string[] = [];
    const proc = new OutputProcessor((data) => output.push(data));

    proc.processData('partial content without newline');
    proc.setBeautifyEnabled(false);

    const combined = output.join('');
    expect(combined).toContain('partial content without newline');
  });
});
