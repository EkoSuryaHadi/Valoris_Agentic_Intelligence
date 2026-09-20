function nonNegative(value, label) { if (!Number.isFinite(value) || value < 0) throw new Error(`${label} must be non-negative`); return Math.round(value * 100) / 100; }
export function buildExecutiveSummary(input) {
  const bac = nonNegative(input.bac, 'BAC'); const changes = nonNegative(input.approvedChanges, 'approved changes'); const commitments = nonNegative(input.commitments, 'commitments'); const actualCost = nonNegative(input.actualCost, 'actual cost'); const etc = nonNegative(input.etc, 'ETC'); const riskExposure = nonNegative(input.riskExposure, 'risk exposure');
  const currentBudget = Math.round((bac + changes) * 100) / 100; const eac = Math.round((actualCost + etc) * 100) / 100; const vac = Math.round((bac - eac) * 100) / 100;
  const health = input.cpi < 0.9 || input.spi < 0.9 || vac < 0 ? 'AT_RISK' : 'ON_TRACK';
  return { bac, currentBudget, commitments, actualCost, etc, eac, vac, riskExposure, cpi: input.cpi, spi: input.spi, health };
}
