function nonNegative(value, label) { if (!Number.isFinite(value) || value < 0) throw new Error(`${label} must be non-negative`); return Math.round(value * 100) / 100; }
export function calculateForecast({ bac, actualCost, etc, periodStatus = 'OPEN' }) {
  if (periodStatus === 'LOCKED' || periodStatus === 'CLOSED') throw new Error('forecast period is locked');
  const budget = nonNegative(bac, 'BAC'); const actual = nonNegative(actualCost, 'actual cost'); const remaining = nonNegative(etc, 'ETC');
  const eac = Math.round((actual + remaining) * 100) / 100;
  return { actualCost: actual, etc: remaining, eac, vac: Math.round((budget - eac) * 100) / 100 };
}
