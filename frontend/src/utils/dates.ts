import dayjs from 'dayjs'

export type DateRangeKey = 'today' | 'last7' | 'last30' | 'custom'

export const buildRangeQuery = (
  range: DateRangeKey,
  start?: string,
  end?: string
) => {
  if (range === 'custom' && start && end) {
    return {
      range,
      start: dayjs(start).toISOString(),
      end: dayjs(end).toISOString(),
    }
  }
  return { range }
}

export const formatShortDate = (value: string | Date) => {
  return dayjs(value).format('MMM D, YYYY')
}

export const resolveDateRange = (range: DateRangeKey, start?: string, end?: string) => {
  const now = dayjs()
  if (range === 'today') {
    return { start: now.startOf('day'), end: now.endOf('day') }
  }
  if (range === 'last7') {
    return { start: now.subtract(7, 'day').startOf('day'), end: now }
  }
  if (range === 'last30') {
    return { start: now.subtract(30, 'day').startOf('day'), end: now }
  }
  if (range === 'custom' && start && end) {
    return { start: dayjs(start), end: dayjs(end) }
  }
  return { start: now.subtract(30, 'day').startOf('day'), end: now }
}

export const resolvePreviousRange = (range: DateRangeKey, start?: string, end?: string) => {
  const current = resolveDateRange(range, start, end)
  const duration = current.end.diff(current.start, 'millisecond')
  const previousEnd = current.start.subtract(1, 'millisecond')
  const previousStart = previousEnd.subtract(duration, 'millisecond')
  return { start: previousStart, end: previousEnd }
}
