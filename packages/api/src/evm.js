import { calculateEvm } from '../../domain/src/formulas.js';

export function calculateEvmResponse({ user, project, period, body, idempotencyKey }) {
  if (!idempotencyKey?.trim()) return { status: 400, body: { error: { code: 'IDEMPOTENCY_KEY_REQUIRED', message: 'Idempotency-Key is required' } } };
  if (!user || !project || user.organizationId !== project.organizationId || user.projectId !== project.id || period.projectId !== project.id) return { status: 403, body: { error: { code: 'PROJECT_SCOPE_DENIED', message: 'project scope is not authorized' } } };
  if ([body.plannedProgress, body.actualProgress].some((value) => !Number.isFinite(value) || value < 0 || value > 1)) return { status: 422, body: { error: { code: 'EVM_VALIDATION_FAILED', message: 'progress must be between 0 and 1' } } };
  try { return { status: 200, body: { data: calculateEvm(body), meta: { idempotencyKey, periodId: period.id } } }; }
  catch (error) { return { status: 422, body: { error: { code: 'EVM_VALIDATION_FAILED', message: error.message } } }; }
}
