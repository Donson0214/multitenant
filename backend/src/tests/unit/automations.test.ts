import { describe, it, expect } from 'vitest';
import { evaluateCondition } from '@/modules/automations/automation.evaluator';

describe('evaluateCondition', () => {
  it('evaluates greater-than condition', () => {
    expect(evaluateCondition(10, { operator: 'gt', threshold: 5 })).toBe(true);
  });

  it('evaluates less-than condition', () => {
    expect(evaluateCondition(2, { operator: 'lt', threshold: 5 })).toBe(true);
  });

  it('evaluates equality condition', () => {
    expect(evaluateCondition(5, { operator: 'eq', threshold: 5 })).toBe(true);
  });
});
