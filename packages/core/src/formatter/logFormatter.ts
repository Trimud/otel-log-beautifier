import type { CommonLogRecord } from '../types.js';
import { LEVEL_COLORS, RESET, DIM } from './ansiColors.js';

const DEFAULT_MAX_VALUE_LENGTH = 120;

function formatTimestamp(iso: string): string {
  const match = iso.match(/T(\d{2}:\d{2}:\d{2}\.\d{3})/);
  return match ? match[1] : iso;
}

function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return value.slice(0, max) + '...';
}

function formatAttributes(
  attrs: Readonly<Record<string, unknown>>,
  maxValueLength: number,
): string {
  const lines: string[] = [];
  for (const [key, value] of Object.entries(attrs)) {
    const strValue = typeof value === 'string' ? value : JSON.stringify(value);
    lines.push(`    ${DIM}${key}:${RESET} ${truncate(strValue, maxValueLength)}`);
  }
  return lines.join('\r\n');
}

export class LogFormatter {
  static format(
    record: CommonLogRecord,
    maxValueLength: number = DEFAULT_MAX_VALUE_LENGTH,
  ): string {
    try {
      const time = formatTimestamp(record.timestamp);
      const levelColor = LEVEL_COLORS[record.level] ?? LEVEL_COLORS.INFO;
      const level = `${levelColor}${record.level.padEnd(5)}${RESET}`;

      const parts: string[] = [
        `${DIM}${time}${RESET}`,
        level,
      ];

      if (record.serviceName) {
        parts.push(`${DIM}[${record.serviceName}]${RESET}`);
      }

      parts.push(record.message);

      let output = parts.join('  ');

      if (record.traceId) {
        output += `\r\n    ${DIM}trace:${RESET} ${record.traceId}`;
        if (record.spanId) {
          output += `  ${DIM}span:${RESET} ${record.spanId}`;
        }
      }

      if (record.attributes && Object.keys(record.attributes).length > 0) {
        output += '\r\n' + formatAttributes(record.attributes, maxValueLength);
      }

      return output;
    } catch {
      const rawStr = JSON.stringify(record.raw ?? record);
      return `${DIM}[format error]${RESET} ${rawStr}`;
    }
  }
}
