import { describe, test, expect } from 'vitest';
import { ResourceTracker } from '../src/formatter/resourceTracker.js';

describe('ResourceTracker', () => {
  test('always displays the first resource', () => {
    const tracker = new ResourceTracker();
    expect(tracker.shouldDisplay({ 'service.name': 'auth' })).toBe(true);
  });

  test('suppresses identical resource on consecutive lines', () => {
    const tracker = new ResourceTracker();
    tracker.shouldDisplay({ 'service.name': 'auth' });

    expect(tracker.shouldDisplay({ 'service.name': 'auth' })).toBe(false);
  });

  test('displays when resource changes', () => {
    const tracker = new ResourceTracker();
    tracker.shouldDisplay({ 'service.name': 'auth' });

    expect(tracker.shouldDisplay({ 'service.name': 'billing' })).toBe(true);
  });

  test('skips comparison when resource is undefined', () => {
    const tracker = new ResourceTracker();
    expect(tracker.shouldDisplay(undefined)).toBe(false);
  });

  test('handles key order independence via sorted stringify', () => {
    const tracker = new ResourceTracker();
    tracker.shouldDisplay({ b: 2, a: 1 });

    expect(tracker.shouldDisplay({ a: 1, b: 2 })).toBe(false);
  });
});
