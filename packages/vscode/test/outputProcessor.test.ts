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

  test('filters out lines below the set level threshold', () => {
    const output: string[] = [];
    const proc = new OutputProcessor((data) => output.push(data));

    proc.setLevelFilter('ERROR');
    proc.processData('{"severity_text":"INFO","body":"Should be hidden","timestamp":"2026-04-11T18:26:07.864Z"}\n');
    proc.processData('{"severity_text":"ERROR","body":"Should be visible","timestamp":"2026-04-11T18:26:07.864Z"}\n');

    const combined = output.join('');
    expect(combined).not.toContain('Should be hidden');
    expect(combined).toContain('Should be visible');
  });

  test('WARN+ filter shows WARN, ERROR, and FATAL', () => {
    const output: string[] = [];
    const proc = new OutputProcessor((data) => output.push(data));

    proc.setLevelFilter('WARN');
    proc.processData('{"severity_text":"DEBUG","body":"hidden","timestamp":"2026-04-11T18:26:07.864Z"}\n');
    proc.processData('{"severity_text":"INFO","body":"hidden too","timestamp":"2026-04-11T18:26:07.864Z"}\n');
    proc.processData('{"severity_text":"WARN","body":"visible warn","timestamp":"2026-04-11T18:26:07.864Z"}\n');
    proc.processData('{"severity_text":"ERROR","body":"visible error","timestamp":"2026-04-11T18:26:07.864Z"}\n');

    const combined = output.join('');
    expect(combined).not.toContain('hidden');
    expect(combined).toContain('visible warn');
    expect(combined).toContain('visible error');
  });

  test('null level filter shows all lines', () => {
    const output: string[] = [];
    const proc = new OutputProcessor((data) => output.push(data));

    proc.setLevelFilter('ERROR');
    proc.setLevelFilter(null);
    proc.processData('{"severity_text":"DEBUG","body":"now visible","timestamp":"2026-04-11T18:26:07.864Z"}\n');

    const combined = output.join('');
    expect(combined).toContain('now visible');
  });

  test('non-JSON lines always pass through regardless of level filter', () => {
    const output: string[] = [];
    const proc = new OutputProcessor((data) => output.push(data));

    proc.setLevelFilter('ERROR');
    proc.processData('regular shell output\n');

    const combined = output.join('');
    expect(combined).toContain('regular shell output');
  });

  test('tracks suppressed line count when filtering', () => {
    const proc = new OutputProcessor(() => {});

    proc.setLevelFilter('ERROR');
    proc.processData('{"severity_text":"INFO","body":"filtered","timestamp":"2026-04-11T18:26:07.864Z"}\n');
    proc.processData('{"severity_text":"DEBUG","body":"filtered","timestamp":"2026-04-11T18:26:07.864Z"}\n');

    expect(proc.getSuppressedCount()).toBe(2);
  });
});
