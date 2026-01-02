import { MetricDefinition, MetricRecord, evaluateMetric } from '@/utils/metrics';

export function evaluateMetricRecords(
  definition: MetricDefinition,
  records: MetricRecord[]
) {
  return evaluateMetric(definition, records);
}
