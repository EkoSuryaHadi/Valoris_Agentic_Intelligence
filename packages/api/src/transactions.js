import { createCommitment, postActualCost, createAccrual } from '../../domain/src/transactions.js';

function scoped(user, project) { return user && project && user.organizationId === project.organizationId && user.projectId === project.id; }
function guard(input) { if (!input.idempotencyKey?.trim()) return { status: 400, body: { error: { code: 'IDEMPOTENCY_KEY_REQUIRED', message: 'Idempotency-Key is required' } } }; if (!scoped(input.user, input.project)) return { status: 403, body: { error: { code: 'PROJECT_SCOPE_DENIED', message: 'project scope is not authorized' } } }; return null; }
function result(input, operation) { const denied = guard(input); if (denied) return denied; try { return { status: 201, body: { data: operation(), meta: { idempotencyKey: input.idempotencyKey } } }; } catch (error) { return { status: 422, body: { error: { code: 'TRANSACTION_VALIDATION_FAILED', message: error.message } } }; } }

export function createCommitmentResponse(input) { return result(input, () => createCommitment({ projectId: input.project.id, existing: input.existing, payload: input.body })); }
export function postActualResponse(input) { return result(input, () => postActualCost({ projectId: input.project.id, period: input.period, payload: input.body })); }
export function createAccrualResponse(input) { return result(input, () => createAccrual({ projectId: input.project.id, period: input.period, amount: input.body.amount, sourceRef: input.body.sourceRef })); }
