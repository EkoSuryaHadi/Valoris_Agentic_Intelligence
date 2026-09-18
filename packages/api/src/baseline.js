import { calculateBaseline, transitionBaseline } from '../../domain/src/baseline.js';
import { allocateBudgetLine } from '../../domain/src/budget-service.js';

function scope(user, project) { return user && project && user.organizationId === project.organizationId && user.projectId === project.id; }
function key(id) { return id?.trim(); }

export function createBaselineResponse({ user, project, existingBaselines, idempotencyKey }) {
  if (!key(idempotencyKey)) return { status: 400, body: { error: { code: 'IDEMPOTENCY_KEY_REQUIRED', message: 'Idempotency-Key is required' } } };
  if (!scope(user, project)) return { status: 403, body: { error: { code: 'PROJECT_SCOPE_DENIED', message: 'project scope is not authorized' } } };
  if (!['ADMIN', 'PROJECT_MANAGER', 'COST_ENGINEER'].includes(user.role)) return { status: 403, body: { error: { code: 'CAPABILITY_DENIED', message: 'role cannot create a baseline draft' } } };
  const version = Math.max(0, ...existingBaselines.map((baseline) => Number(baseline.version) || 0)) + 1;
  return { status: 201, body: { data: { projectId: project.id, version, status: 'DRAFT' }, meta: { idempotencyKey } } };
}

export function createBudgetLineResponse({ user, project, baseline, wbs, costCode, amount, idempotencyKey }) {
  if (!key(idempotencyKey)) return { status: 400, body: { error: { code: 'IDEMPOTENCY_KEY_REQUIRED', message: 'Idempotency-Key is required' } } };
  if (!scope(user, project) || !baseline || baseline.projectId !== project.id) return { status: 403, body: { error: { code: 'PROJECT_SCOPE_DENIED', message: 'project scope is not authorized' } } };
  if (!['ADMIN', 'PROJECT_MANAGER', 'COST_ENGINEER'].includes(user.role)) return { status: 403, body: { error: { code: 'CAPABILITY_DENIED', message: 'role cannot edit budget lines' } } };
  try { return { status: 201, body: { data: allocateBudgetLine({ baseline, wbs, costCode, amount }), meta: { idempotencyKey } } }; }
  catch (error) { return { status: 422, body: { error: { code: 'BUDGET_LINE_VALIDATION_FAILED', message: error.message } } }; }
}

export function calculateBaselineResponse({ user, project, baseline, lines, idempotencyKey }) {
  if (!key(idempotencyKey)) return { status: 400, body: { error: { code: 'IDEMPOTENCY_KEY_REQUIRED', message: 'Idempotency-Key is required' } } };
  if (!scope(user, project) || baseline.projectId !== project.id) return { status: 403, body: { error: { code: 'PROJECT_SCOPE_DENIED', message: 'project scope is not authorized' } } };
  try { return { status: 200, body: { data: calculateBaseline({ status: baseline.status, lines }), meta: { idempotencyKey } } }; }
  catch (error) { return { status: 422, body: { error: { code: 'BASELINE_VALIDATION_FAILED', message: error.message } } }; }
}

export function transitionBaselineResponse({ user, project, baseline, nextStatus, idempotencyKey }) {
  if (!key(idempotencyKey)) return { status: 400, body: { error: { code: 'IDEMPOTENCY_KEY_REQUIRED', message: 'Idempotency-Key is required' } } };
  if (!scope(user, project) || baseline.projectId !== project.id) return { status: 403, body: { error: { code: 'PROJECT_SCOPE_DENIED', message: 'project scope is not authorized' } } };
  try { return { status: 200, body: { data: { status: transitionBaseline(baseline.status, nextStatus, user.role) }, meta: { idempotencyKey } } }; }
  catch (error) { return { status: error.message.includes('role') || error.message.includes('approval') || error.message.includes('lock') ? 403 : 422, body: { error: { code: 'BASELINE_TRANSITION_FAILED', message: error.message } } }; }
}
