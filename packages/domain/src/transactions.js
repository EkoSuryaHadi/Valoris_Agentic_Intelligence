function amount(value) { if (!Number.isFinite(value) || value < 0) throw new Error('amount must be non-negative'); return Math.round(value * 100) / 100; }
function sameProject(projectId, ref, label) { if (!ref || ref.projectId !== projectId) throw new Error(`${label} must belong to the same project`); }
function openPeriod(projectId, period) { if (!period || period.projectId !== projectId) throw new Error('period must belong to the same project'); if (period.status === 'LOCKED' || period.status === 'CLOSED') throw new Error('period is locked or closed'); }

export function createCommitment({ projectId, existing, payload, wbs, costCode }) {
  if (!payload.referenceNo?.trim()) throw new Error('commitment reference is required');
  if (!payload.vendor?.trim()) throw new Error('vendor is required');
  if (existing.some((item) => item.projectId === projectId && item.referenceNo.toUpperCase() === payload.referenceNo.trim().toUpperCase())) throw new Error('commitment reference already exists');
  if (wbs) sameProject(projectId, wbs, 'WBS'); if (costCode) sameProject(projectId, costCode, 'cost code');
  return { projectId, referenceNo: payload.referenceNo.trim(), vendor: payload.vendor.trim(), amount: amount(payload.amount), wbsId: payload.wbsId ?? null, costCodeId: payload.costCodeId ?? null, status: 'OPEN' };
}

export function postActualCost({ projectId, period, payload, wbs, costCode }) {
  openPeriod(projectId, period); if (!payload.sourceRef?.trim()) throw new Error('source reference is required');
  if (wbs) sameProject(projectId, wbs, 'WBS'); if (costCode) sameProject(projectId, costCode, 'cost code');
  return { projectId, periodId: period.id, amount: amount(payload.amount), sourceRef: payload.sourceRef.trim(), wbsId: payload.wbsId ?? null, costCodeId: payload.costCodeId ?? null, status: 'POSTED' };
}

export function createAccrual({ projectId, period, amount: value, sourceRef }) {
  openPeriod(projectId, period); if (!sourceRef?.trim()) throw new Error('source reference is required');
  return { projectId, periodId: period.id, amount: amount(value), sourceRef: sourceRef.trim(), status: 'DRAFT' };
}
