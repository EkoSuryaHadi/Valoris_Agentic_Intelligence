import { calculateCashVariance, calculateCumulative, createRisk } from '../../domain/src/risk-cash.js';
function scope(input) { return input.user && input.project && input.user.organizationId === input.project.organizationId && input.user.projectId === input.project.id; }
export function cashSummaryResponse(input) {
  if (!scope(input)) return { status: 403, body: { error: { code: 'PROJECT_SCOPE_DENIED', message: 'project scope is not authorized' } } };
  if (!Array.isArray(input.body.planned) || !Array.isArray(input.body.actual) || input.body.planned.length !== input.body.actual.length) return { status: 422, body: { error: { code: 'CASH_VALIDATION_FAILED', message: 'planned and actual periods must align' } } };
  try { return { status: 200, body: { data: { variance: input.body.planned.map((planned, i) => calculateCashVariance({ planned, actual: input.body.actual[i] })), cumulativeForecast: calculateCumulative(input.body.forecast ?? []) } } }; }
  catch (error) { return { status: 422, body: { error: { code: 'CASH_VALIDATION_FAILED', message: error.message } } }; }
}
export function createRiskResponse(input) {
  if (!input.idempotencyKey?.trim()) return { status: 400, body: { error: { code: 'IDEMPOTENCY_KEY_REQUIRED', message: 'Idempotency-Key is required' } } };
  if (!scope(input)) return { status: 403, body: { error: { code: 'PROJECT_SCOPE_DENIED', message: 'project scope is not authorized' } } };
  try { return { status: 201, body: { data: createRisk({ projectId: input.project.id, payload: input.body }), meta: { idempotencyKey: input.idempotencyKey } } }; }
  catch (error) { return { status: 422, body: { error: { code: 'RISK_VALIDATION_FAILED', message: error.message } } }; }
}
