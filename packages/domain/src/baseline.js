function money(value) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) throw new Error('budget amount must be a non-negative number');
  return value;
}

export function calculateBaseline({ status, lines }) {
  if (!Array.isArray(lines) || lines.length === 0) throw new Error('at least one budget line is required');
  if (status === 'LOCKED' && lines.some((line) => line.amount === undefined)) throw new Error('locked baseline requires budget lines');
  const bac = Math.round(lines.reduce((sum, line) => sum + money(line.amount), 0) * 100) / 100;
  return { bac, lineCount: lines.length };
}

export function validateHierarchyNode({ code, name, level, parentProjectId, projectId }) {
  if (!code?.trim()) throw new Error('code is required');
  if (!name?.trim()) throw new Error('name is required');
  if (!Number.isInteger(level) || level < 1) throw new Error('level must be a positive integer');
  if (parentProjectId && parentProjectId !== projectId) throw new Error('parent must belong to the same project');
  return true;
}

const transitions = {
  DRAFT: ['UNDER_REVIEW'],
  UNDER_REVIEW: ['SUBMITTED', 'DRAFT'],
  SUBMITTED: ['APPROVED', 'REJECTED'],
  REJECTED: ['DRAFT'],
  APPROVED: ['LOCKED'],
  LOCKED: [],
};

export function transitionBaseline(current, next, actorRole) {
  if (actorRole === 'AGENT') throw new Error('human approval is required');
  if (current === 'LOCKED') throw new Error('locked baseline cannot transition');
  if (!transitions[current]?.includes(next)) throw new Error(`invalid baseline transition: ${current} to ${next}`);
  if (next === 'APPROVED' && !['COST_MANAGER', 'PROJECT_MANAGER'].includes(actorRole)) throw new Error('human approval role required');
  if (next === 'LOCKED' && actorRole !== 'COST_MANAGER') throw new Error('lock requires COST_MANAGER role');
  return next;
}
