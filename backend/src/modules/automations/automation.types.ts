export type AutomationCondition = {
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq';
  threshold: number;
  range?: string;
  start?: string;
  end?: string;
};

export type AutomationAction = {
  type: 'EMAIL' | 'IN_APP' | 'WEBHOOK';
  target?: string;
  title?: string;
  message?: string;
};
