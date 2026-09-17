function nonNegative(value) { if (!Number.isFinite(value) || value < 0) throw new Error('estimated cost must be non-negative'); return Math.round(value * 100) / 100; }
export function createChange({ projectId, payload }) {
  if (!projectId?.trim()) throw new Error('project is required');
  if (!payload.number?.trim() || !payload.title?.trim() || !payload.type?.trim()) throw new Error('change number, title, and type are required');
  if (!Number.isFinite(payload.probability) || payload.probability < 0 || payload.probability > 1) throw new Error('probability must be between 0 and 1');
  return { projectId, number: payload.number.trim(), title: payload.title.trim(), type: payload.type.trim(), estimatedCost: nonNegative(payload.estimatedCost), probability: payload.probability, status: 'POTENTIAL' };
}
export function calculateExposure(change) { return Math.round(change.estimatedCost * change.probability * 100) / 100; }
export function canIncorporateChange(change) { return change.status === 'APPROVED' && Number.isFinite(change.approvedCost) && change.approvedCost >= 0; }
