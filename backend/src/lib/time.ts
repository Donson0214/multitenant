import dayjs from 'dayjs';

export type DateRangeInput = {
  range?: string;
  start?: string;
  end?: string;
};

export function resolveDateRange(input: DateRangeInput) {
  const now = dayjs();
  const range = input.range ?? 'last30';

  const relativeMatch = /^last(\d+)(m|h|d)$/i.exec(range);
  if (relativeMatch) {
    const amount = Number(relativeMatch[1]);
    const unit = relativeMatch[2].toLowerCase();
    if (Number.isFinite(amount) && amount > 0) {
      const unitMap: Record<string, dayjs.ManipulateType> = {
        m: 'minute',
        h: 'hour',
        d: 'day',
      };
      const start = now.subtract(amount, unitMap[unit]).toDate();
      return { start, end: now.toDate() };
    }
  }

  if (range === 'today') {
    return {
      start: now.startOf('day').toDate(),
      end: now.endOf('day').toDate(),
    };
  }

  if (range === 'last7') {
    return {
      start: now.subtract(7, 'day').startOf('day').toDate(),
      end: now.toDate(),
    };
  }

  if (range === 'last30') {
    return {
      start: now.subtract(30, 'day').startOf('day').toDate(),
      end: now.toDate(),
    };
  }

  if (range === 'custom' && input.start && input.end) {
    const start = dayjs(input.start);
    const end = dayjs(input.end);
    if (start.isValid() && end.isValid() && end.isAfter(start)) {
      return {
        start: start.toDate(),
        end: end.toDate(),
      };
    }
  }

  return {
    start: now.subtract(30, 'day').startOf('day').toDate(),
    end: now.toDate(),
  };
}
