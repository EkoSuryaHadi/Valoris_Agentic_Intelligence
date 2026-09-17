import { createHierarchyNode } from '../../domain/src/hierarchy-service.js';

export function createHierarchyResponse({ user, project, existingNodes, body, idempotencyKey }) {
  if (!idempotencyKey?.trim()) return { status: 400, body: { error: { code: 'IDEMPOTENCY_KEY_REQUIRED', message: 'Idempotency-Key is required' } } };
  if (!user || !project || user.organizationId !== project.organizationId || user.projectId !== project.id) return { status: 403, body: { error: { code: 'PROJECT_SCOPE_DENIED', message: 'project scope is not authorized' } } };
  if (!['ADMIN', 'PROJECT_MANAGER', 'COST_ENGINEER'].includes(user.role)) return { status: 403, body: { error: { code: 'CAPABILITY_DENIED', message: 'role cannot edit hierarchy' } } };
  try { return { status: 201, body: { data: createHierarchyNode({ projectId: project.id, existingNodes, payload: body }), meta: { idempotencyKey } } }; }
  catch (error) { return { status: 422, body: { error: { code: 'HIERARCHY_VALIDATION_FAILED', message: error.message } } }; }
}
