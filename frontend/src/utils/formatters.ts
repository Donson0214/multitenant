export const formatCurrency = (value: number, currency = 'USD') => {
  if (!Number.isFinite(value)) return '--'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value)
}

export const formatNumber = (value: number) => {
  if (!Number.isFinite(value)) return '--'
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
  }).format(value)
}

export const formatCompactNumber = (value: number) => {
  if (!Number.isFinite(value)) return '--'
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}
