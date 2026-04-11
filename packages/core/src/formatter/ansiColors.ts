export const RESET = '\x1b[0m';
export const DIM = '\x1b[2m';
export const BOLD = '\x1b[1m';

export const LEVEL_COLORS: Readonly<Record<string, string>> = {
  TRACE: '\x1b[90m',   // gray
  DEBUG: '\x1b[90m',   // gray
  INFO: '\x1b[36m',    // cyan
  WARN: '\x1b[33m',    // yellow
  ERROR: '\x1b[31m',   // red
  FATAL: '\x1b[31;1m', // bold red
};
