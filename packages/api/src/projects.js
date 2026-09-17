import { createProject } from '../../domain/src/project-service.js';

export function createProjectResponse({ user, existingProjects, body, idempotencyKey }) {
  if (!idempotencyKey?.trim()) return { status: 400, body: { error: { code: 'IDEMPOTENCY_KEY_REQUIRED', message: 'Idempotency-Key is required' } } };
  if (!user || user.organizationId !== body.organizationId) return { status: 403, body: { error: { code: 'TENANT_SCOPE_DENIED', message: 'organization scope is not authorized' } } };
  try {
    const project = createProject({ organizationId: user.organizationId, existingProjects, payload: body });
    return { status: 201, body: { data: project, meta: { idempotencyKey } } };
  } catch (error) {
    return { status: 422, body: { error: { code: 'PROJECT_VALIDATION_FAILED', message: error.message } } };
  }
}
