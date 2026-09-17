function nonNegative(value, label) { if (!Number.isFinite(value) || value < 0) throw new Error(`${label} must be non-negative`); return value; }
export function calculateCashVariance({ planned, actual }) { return Math.round((nonNegative(actual, 'actual') - nonNegative(planned, 'planned')) * 100) / 100; }
export function calculateCumulative(values) { let total = 0; return values.map((value) => { total += nonNegative(value, 'cash'); return Math.round(total * 100) / 100; }); }
export function createRisk({ projectId, payload }) {
  if (!projectId?.trim()) throw new Error('project is required');
  if (!payload.title?.trim() || !payload.category?.trim()) throw new Error('risk title and category are required');
  if (!Number.isFinite(payload.probability) || payload.probability < 0 || payload.probability > 1) throw new Error('probability must be between 0 and 1');
  const impact = nonNegative(payload.impact, 'impact'); const exposure = Math.round(impact * payload.probability * 100) / 100;
  const severity = exposure >= 1000000 ? 'CRITICAL' : exposure >= 100000 ? 'HIGH' : exposure >= 25000 ? 'MEDIUM' : 'LOW';
  return { projectId, title: payload.title.trim(), category: payload.category.trim(), probability: payload.probability, impact, exposure, severity, status: 'NEW' };
}
