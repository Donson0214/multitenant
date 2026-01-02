import { describe, it, expect } from 'vitest';
import { evaluateMetric } from '@/utils/metrics';

describe('evaluateMetric', () => {
  const records = [
    { data: { amount: 10, category: 'a' }, eventTime: new Date() },
    { data: { amount: 20, category: 'b' }, eventTime: new Date() },
    { data: { amount: 30, category: 'a' }, eventTime: new Date() },
  ];

  it('evaluates sum aggregation', () => {
    const value = evaluateMetric({ aggregation: 'sum', field: 'amount' }, records);
    expect(value).toBe(60);
  });

  it('evaluates average aggregation', () => {
    const value = evaluateMetric({ aggregation: 'avg', field: 'amount' }, records);
    expect(value).toBe(20);
  });

  it('evaluates expression with operators', () => {
    const value = evaluateMetric(
      { expression: 'sum(amount) / count()' },
      records
    );
    expect(value).toBe(20);
  });
});
