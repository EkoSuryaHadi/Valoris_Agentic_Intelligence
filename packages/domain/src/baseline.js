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
