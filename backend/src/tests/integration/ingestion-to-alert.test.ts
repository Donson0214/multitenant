import { describe, it, expect } from 'vitest';
import { mapRecords } from '@/modules/data-sources/ingestion.service';
import { evaluateMetric } from '@/utils/metrics';
import { evaluateCondition } from '@/modules/automations/automation.evaluator';

describe('ingestion-to-alert flow', () => {
  it('maps records, computes metric, and triggers condition', () => {
    const schema = {
      dateField: 'date',
      fields: {
        date: 'date',
        amount: 'number',
      },
    };

    const rawRecords = [
      { date: new Date().toISOString(), amount: '100' },
      { date: new Date().toISOString(), amount: '200' },
    ];

    const { records, errors } = mapRecords({
      rawRecords,
      mapping: {},
      schema,
    });

    expect(errors.length).toBe(0);

    const metricValue = evaluateMetric(
      { aggregation: 'sum', field: 'amount' },
      records
    );

    const triggered = evaluateCondition(metricValue, {
      operator: 'gt',
      threshold: 250,
    });

    expect(triggered).toBe(true);
  });
});
