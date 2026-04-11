const ANSI_REGEX = /\x1b(?:\[[0-9;?]*[a-zA-Z]|\][^\x07]*\x07|\(B)/g;

export class JsonDetector {
  static detect(line: string): Record<string, unknown> | null {
    const stripped = line.replace(ANSI_REGEX, '').trim();
    if (!stripped.startsWith('{')) {
      return null;
    }
    try {
      const parsed = JSON.parse(stripped);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        return null;
      }
      if (Object.keys(parsed).length === 0) {
        return null;
      }
      return parsed as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}
