import { calculateBaseline, transitionBaseline } from '../../domain/src/baseline.js';

function scope(user, project) { return user && project && user.organizationId === project.organizationId && user.projectId === project.id; }
function key(id) { return id?.trim(); }

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
