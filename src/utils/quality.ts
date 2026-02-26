import type { NodeQuality } from '../types';

/** Maps quality levels to CSS color values for the wafer grid. */
export const qualityColorMap: Record<NodeQuality, string> = {
  excellent: '#22c55e', // green-500
  good: '#3b82f6',      // blue-500
  fair: '#eab308',      // yellow-500
  poor: '#f97316',      // orange-500
  fail: '#ef4444',      // red-500
  untested: '#52525b',  // zinc-600
};

/** Human-readable labels for each quality level. */
export const qualityLabelMap: Record<NodeQuality, string> = {
  excellent: 'Excellent',
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
  fail: 'Fail',
  untested: 'Untested',
};

/** Ordered list from untested to best. */
export const qualityLevels: NodeQuality[] = [
  'untested',
  'fail',
  'poor',
  'fair',
  'good',
  'excellent',
];
