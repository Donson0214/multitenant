import { AutomationCondition } from '@/modules/automations/automation.types';

export function evaluateCondition(value: number, condition: AutomationCondition) {
  if (condition.operator === 'gt') return value > condition.threshold;
  if (condition.operator === 'gte') return value >= condition.threshold;
  if (condition.operator === 'lt') return value < condition.threshold;
  if (condition.operator === 'lte') return value <= condition.threshold;
  if (condition.operator === 'eq') return value === condition.threshold;
  if (condition.operator === 'neq') return value !== condition.threshold;
  return false;
}
