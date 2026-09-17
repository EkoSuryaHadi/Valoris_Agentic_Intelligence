export function createCostCode({ projectId, existingCodes, payload }) {
  if (!projectId?.trim()) throw new Error('project is required');
  const code = payload.code?.trim().toUpperCase();
  const name = payload.name?.trim();
  if (!code) throw new Error('cost code is required');
  if (!name) throw new Error('cost code name is required');
  if (existingCodes.some((item) => item.projectId === projectId && item.code.toUpperCase() === code)) throw new Error('cost code already exists');
  return { projectId, code, name };
}

export function allocateBudgetLine({ baseline, wbs, costCode, amount }) {
  if (baseline.status === 'LOCKED') throw new Error('locked baseline cannot receive budget lines');
  if (!Number.isFinite(amount) || amount < 0) throw new Error('budget amount must be non-negative');
  if (baseline.projectId !== wbs.projectId || baseline.projectId !== costCode.projectId) throw new Error('budget references must belong to the same project');
  return { baselineId: baseline.id, wbsId: wbs.id, costCodeId: costCode.id, amount: Math.round(amount * 100) / 100 };
}
