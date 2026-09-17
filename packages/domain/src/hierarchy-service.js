export function createHierarchyNode({ projectId, existingNodes, payload }) {
  if (!projectId?.trim()) throw new Error('project is required');
  const code = payload.code?.trim();
  const name = payload.name?.trim();
  if (!code) throw new Error('code is required');
  if (!name) throw new Error('name is required');
  if (!Number.isInteger(payload.level) || payload.level < 1) throw new Error('level must be a positive integer');
  if (existingNodes.some((node) => node.projectId === projectId && node.code.toUpperCase() === code.toUpperCase())) throw new Error('hierarchy code already exists');
  let parentId = payload.parentId ?? null;
  if (parentId) {
    const parent = existingNodes.find((node) => node.id === parentId);
    if (!parent || parent.projectId !== projectId) throw new Error('parent must belong to the same project');
    if (parent.level !== payload.level - 1) throw new Error('parent must be exactly one level above child');
  } else if (payload.level !== 1) {
    throw new Error('non-root node requires a parent');
  }
  return { projectId, parentId, code, name, level: payload.level };
}
