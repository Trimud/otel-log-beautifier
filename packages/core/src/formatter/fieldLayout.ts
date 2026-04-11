export interface FieldLayoutOptions {
  readonly fieldOrder?: readonly string[];
  readonly hiddenFields?: readonly string[];
  readonly maxValueLength?: number;
  readonly maxDepth?: number;
}

const DEFAULT_MAX_DEPTH = 3;

function truncateDepth(value: unknown, maxDepth: number, currentDepth: number = 0): unknown {
  if (currentDepth >= maxDepth) {
    return '[...]';
  }
  if (typeof value !== 'object' || value === null) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => truncateDepth(item, maxDepth, currentDepth + 1));
  }
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value)) {
    result[k] = truncateDepth(v, maxDepth, currentDepth + 1);
  }
  return result;
}

export class FieldLayout {
  static orderAndFilter(
    attrs: Readonly<Record<string, unknown>> | undefined | null,
    options?: FieldLayoutOptions,
  ): Array<[string, unknown]> {
    if (!attrs || typeof attrs !== 'object') {
      return [];
    }

    const entries = Object.entries(attrs);
    if (entries.length === 0) {
      return [];
    }

    const hidden = new Set(options?.hiddenFields ?? []);
    const filtered = entries.filter(([key]) => !hidden.has(key));

    const fieldOrder = options?.fieldOrder ?? [];
    const orderIndex = new Map(fieldOrder.map((key, i) => [key, i]));

    filtered.sort((a, b) => {
      const aIdx = orderIndex.get(a[0]);
      const bIdx = orderIndex.get(b[0]);
      if (aIdx !== undefined && bIdx !== undefined) return aIdx - bIdx;
      if (aIdx !== undefined) return -1;
      if (bIdx !== undefined) return 1;
      return a[0].localeCompare(b[0]);
    });

    const maxDepth = options?.maxDepth ?? DEFAULT_MAX_DEPTH;
    return filtered.map(([key, value]) => [key, truncateDepth(value, maxDepth)]);
  }
}
