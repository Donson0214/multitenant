export type MetricRecord = {
  data: Record<string, unknown>;
  eventTime: Date;
};

export type MetricFilter = {
  field: string;
  op: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte';
  value: unknown;
};

export type MetricDefinition = {
  expression?: string;
  aggregation?: 'sum' | 'avg' | 'count';
  field?: string;
  filters?: MetricFilter[];
};

function applyFilters(records: MetricRecord[], filters?: MetricFilter[]) {
  if (!filters?.length) {
    return records;
  }

  return records.filter((record) =>
    filters.every((filter) => {
      const value = record.data[filter.field];
      if (filter.op === 'eq') {
        return value === filter.value;
      }
      if (filter.op === 'neq') {
        return value !== filter.value;
      }
      if (filter.op === 'gt') {
        return Number(value) > Number(filter.value);
      }
      if (filter.op === 'gte') {
        return Number(value) >= Number(filter.value);
      }
      if (filter.op === 'lt') {
        return Number(value) < Number(filter.value);
      }
      if (filter.op === 'lte') {
        return Number(value) <= Number(filter.value);
      }
      return false;
    })
  );
}

function aggregate(
  records: MetricRecord[],
  op: 'sum' | 'avg' | 'count',
  field?: string
) {
  if (op === 'count') {
    if (!field) {
      return records.length;
    }
    return records.filter((record) => record.data[field] !== undefined).length;
  }

  const values = records
    .map((record) => Number(record.data[field ?? '']))
    .filter((value) => Number.isFinite(value));

  const total = values.reduce((sum, value) => sum + value, 0);
  if (op === 'sum') {
    return total;
  }
  return values.length ? total / values.length : 0;
}

function tokenize(expression: string) {
  const tokens: string[] = [];
  let current = '';

  for (let i = 0; i < expression.length; i += 1) {
    const char = expression[i];
    if (/\d|\./.test(char)) {
      current += char;
      continue;
    }

    if (current) {
      tokens.push(current);
      current = '';
    }

    if (/[+\-*/()]/.test(char)) {
      tokens.push(char);
    }
  }

  if (current) {
    tokens.push(current);
  }

  return tokens;
}

function toRpn(tokens: string[]) {
  const output: string[] = [];
  const operators: string[] = [];
  const precedence: Record<string, number> = { '+': 1, '-': 1, '*': 2, '/': 2 };

  tokens.forEach((token) => {
    if (/^\d+(\.\d+)?$/.test(token)) {
      output.push(token);
      return;
    }

    if (token === '(') {
      operators.push(token);
      return;
    }

    if (token === ')') {
      while (operators.length && operators[operators.length - 1] !== '(') {
        output.push(operators.pop() as string);
      }
      operators.pop();
      return;
    }

    while (
      operators.length &&
      precedence[operators[operators.length - 1]] >= precedence[token]
    ) {
      output.push(operators.pop() as string);
    }
    operators.push(token);
  });

  while (operators.length) {
    output.push(operators.pop() as string);
  }

  return output;
}

function evalRpn(tokens: string[]) {
  const stack: number[] = [];

  tokens.forEach((token) => {
    if (/^\d+(\.\d+)?$/.test(token)) {
      stack.push(Number(token));
      return;
    }

    const right = stack.pop() ?? 0;
    const left = stack.pop() ?? 0;
    if (token === '+') {
      stack.push(left + right);
    } else if (token === '-') {
      stack.push(left - right);
    } else if (token === '*') {
      stack.push(left * right);
    } else if (token === '/') {
      stack.push(right === 0 ? 0 : left / right);
    }
  });

  return stack.pop() ?? 0;
}

function evaluateExpression(expression: string) {
  const tokens = tokenize(expression);
  const rpn = toRpn(tokens);
  return evalRpn(rpn);
}

export function evaluateMetric(definition: MetricDefinition, records: MetricRecord[]) {
  const filtered = applyFilters(records, definition.filters);

  if (definition.expression) {
    const expression = definition.expression.replace(
      /(sum|avg|count)\(([^)]*)\)/g,
      (match, op, field) => {
        const fieldName = typeof field === 'string' ? field.trim() : '';
        const value = aggregate(
          filtered,
          op as 'sum' | 'avg' | 'count',
          fieldName || undefined
        );
        return String(value);
      }
    );

    return evaluateExpression(expression);
  }

  if (definition.aggregation) {
    return aggregate(filtered, definition.aggregation, definition.field);
  }

  return 0;
}
