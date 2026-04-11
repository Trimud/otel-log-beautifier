function sortedStringify(obj: Record<string, unknown>): string {
  return JSON.stringify(obj, Object.keys(obj).sort());
}

export class ResourceTracker {
  private previousKey: string | null = null;

  shouldDisplay(resource: Record<string, unknown> | undefined): boolean {
    if (resource === undefined) {
      return false;
    }
    const key = sortedStringify(resource);
    if (key === this.previousKey) {
      return false;
    }
    this.previousKey = key;
    return true;
  }
}
